const express = require("express");
const app = express();
const server = require("http").Server(app);
var io = require("socket.io")(server);
const nunjucks = require("nunjucks");
const router = express.Router();
const auth = require("./auth/");
const session = require("express-session");
const queue = require("./queue/");
const config = require("./config").get(process.env.NODE_ENV);
const sessionConfig = config.socket.session;
const FileStore = new session.MemoryStore();
let userCount = 0;

// const sessionStore = new FileStore();
const sessionMiddleWare = session({
  store: FileStore,
  secret: config.redis.secret,
  resave: true,
  saveUninitialized: true
});

app.use(sessionMiddleWare);

// Allows us to have the FileStore binded to our socket in a persistent way once authenticated
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

function socketConnection(socket) {
  // TODO: I'm not sure why, but exporting my IO via exports. isn't working, which forces me to work around it this way
  socket.io = io;
  let playbackPolling;
  let currentSession = socket.handshake.session;
  let authenticatedUsers = [];

  function activatePolling() {
    playbackPolling = setInterval(function() {
      auth.functions.checkForPlaybackChanges(socket);
    }, 3200);
  }
  function clearPolling() {
    clearInterval(playbackPolling);
  }

  for (let [key, session] of Object.entries(FileStore.sessions)) {
    session = JSON.parse(session);
    if (session[sessionConfig.user]) {
      authenticatedUsers.push(session[sessionConfig.user]);
    }
  }
  if (authenticatedUsers.length != userCount) {
    io.sockets.emit("update user list", authenticatedUsers);
    userCount = authenticatedUsers.length;
  }
  currentSession[sessionConfig.spotifyApi];
  if (currentSession[sessionConfig.spotifyApi]) {
    spotifyApi = auth.functions.generateUserSpotifyApiInstance(
      currentSession.access_token,
      currentSession.refresh_token
    );

    currentSession[sessionConfig.spotifyApi] = spotifyApi;
    auth.functions.userLoggedIn(socket, session);
    activatePolling();
  }
  queue.queue.RetrieveQueue(socket);

  socket.on("disconnect", function() {
    if (currentSession[sessionConfig.user]) {
      userCount--;
      clearPolling();
    }
  });
  socket.on("user authenticated", function(data) {
    currentSession.access_token = data.access_token;
    currentSession.refresh_token = data.refresh_token;
    spotifyApi = auth.functions.generateUserSpotifyApiInstance(
      currentSession.access_token,
      currentSession.refresh_token
    );
    currentSession[sessionConfig.spotifyApi] = spotifyApi;

    currentSession.spotifyApi.getMe().then(data => {
      console.log(data.body);
      currentSession[sessionConfig.user] = data.body.id;
      currentSession.save();
      authenticatedUsers.push(currentSession[sessionConfig.user]);
      io.sockets.emit("update user list", authenticatedUsers);
      auth.functions.userLoggedIn(socket, session);
    });
    activatePolling();
  });

  socket.on("typing", function(data) {
    context = {
      message: "",
      typing: false
    };
    if (data.typing === true) {
      context.message = `${currentSession[sessionConfig.user]} is typing...`;
      context.typing = true;
    }
    io.sockets.emit("typing", context);
  });

  socket.on("rate song", function(data) {
    queue.queue.RateSong(socket, data.songId, data.rating);
  });

  socket.on("new message", function(data) {
    console.log("hi");
    io.sockets.emit("new message", {
      message: data.message,
      user: currentSession[sessionConfig.user]
      // user_color: socket.color
    });
  });

  socket.on("new active playback device", function(device) {
    currentSession[sessionConfig.playback] = device;
    console.log("new playback ativate");
    currentSession[sessionConfig.spotifyApi]
      .transferMyPlayback({
        deviceIds: [device],
        play: true
      })
      .then(
        result => {
          console.log(result);
        },
        error => {
          console.log(error);
        }
      );
  });

  socket.on("add song to queue", function(song) {
    queue.queue.addToQueue(song, socket);
  });
  // console.log("song_id", song);
  // currentSession[sessionConfig.spotifyApi].getMyDevices().then()

  socket.on("play next in queue", function() {
    queue.queue.playNextSong(socket);
  });

  socket.on("auto complete query", function(query) {
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
}

io.on("connection", socketConnection);

server.listen(3000, "0.0.0.0", serverConnected);

exports.FileStore = FileStore;

exports.io = io;
