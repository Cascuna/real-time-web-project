const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const nunjucks = require("nunjucks");
const router = express.Router();
const auth = require("./auth/");
const session = require("express-session");

const config = require("./config").get(process.env.NODE_ENV);
const sessionConfig = config.socket.session;
const FileStore = new session.MemoryStore();
let userCount = 0;
exports.io = io;
// const sessionStore = new FileStore();
const sessionMiddleWare = session({
  store: FileStore,
  secret: config.redis.secret,
  resave: true,
  saveUninitialized: true
});

app.use(sessionMiddleWare);

io.use(function(socket, next) {
  sessionMiddleWare(socket.handshake, socket.request.res, next);
});

nunjucks.configure("templates", {
  autoescape: true,
  express: app
});
// TODO: Wellicht moet resave & save unit op false
app
  .set("view engine", "html")
  .use(express.static("static"))
  .use("/auth", auth.paths)
  .get("/", homePage);

function homePage(request, response) {
  response.render("index", { spotifyUrl: auth.functions.generateSpotifyUrl() });
}

function serverConnected() {
  console.log("available on http://127.0.0.1:3000");
}

// function writeToSession(socket, key, value) {
//   let currentSession = socket.handshake.session;
//   if (!currentSession) {
//     return;
//   }
//   currentSession[key] = value;
// }

io.on("connection", function(socket) {
  let currentSession = socket.handshake.session;
  // console.log(socket.handshake.sessionStore.all());
  let activeUsers = [];
  for (let [key, session] of Object.entries(FileStore.sessions)) {
    session = JSON.parse(session);
    if (session[sessionConfig.user]) {
      activeUsers.push(session[sessionConfig.user]);
    }
  }
  if (activeUsers.length != userCount) {
    io.sockets.emit("update user view", activeUsers);
    userCount = activeUsers.length;
  }
  if (currentSession[sessionConfig.user]) {
    auth.functions.userLoggedIn(socket);
  }

  socket.on("disconnect", function(data) {
    if (currentSession[sessionConfig.user]) {
      userCount--;
    }
  });
  socket.on("user authenticated", function(data) {
    spotifyApi = auth.functions.generateUserSpotifyApiInstance(
      data.access_token,
      data.refresh_token
    );
    currentSession[sessionConfig.spotifyApi] = spotifyApi;

    currentSession.spotifyApi.getMe().then(data => {
      currentSession[sessionConfig.user] = data.body.id;
      currentSession.save();
      activeUsers.push(currentSession[sessionConfig.user]);
      io.sockets.emit("update user view", activeUsers);
      auth.functions.userLoggedIn(socket);
    });
  });

  socket.on("add song to queue", function(song) {
    let deviceId;
    currentSession[sessionConfig.spotifyApi].getMyDevices().then(
      data => {
        for (device of data.body.devices) {
          if (device.is_active) {
            deviceId = device.id;
            currentSession[sessionConfig.spotifyApi]
              .play({
                device_id: deviceId,
                uris: [song]
              })
              .then(() => console.log("we gaan hard"), err => console.log(err));
            break;
          }
        }
      },
      function(err) {
        console.log(err);
      }
    );
    // console.log("song_id", song);
    // currentSession[sessionConfig.spotifyApi].getMyDevices().then()
  });

  socket.on("auto complete query", function(query) {
    // TODO: Clean this shit up
    let completedAmount = 15;

    currentSession[sessionConfig.spotifyApi].searchTracks(query).then(
      data => {
        let tracks = [];
        for (track of data.body.tracks.items.slice(0, completedAmount)) {
          console.log(track.uri);
          let newTrack = {};
          newTrack.name = track.name;
          let artists = [];
          for (artist of track.artists) {
            artists.push(artist.name);
          }
          newTrack.artists = artists;
          newTrack.id = track.uri;
          tracks.push(newTrack);
        }
        socket.emit("auto complete result", { tracks });
      },
      function(err) {
        console.error(err);
      }
    );
  });
});

server.listen(3000, "0.0.0.0", serverConnected);
