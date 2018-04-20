const express = require("express");
const nunjucks = require("nunjucks");
var path = require("path");
var roomFunctions = require("./room/");
var userFunctions = require("./user/");
var chatFunctions = require("./chat/");
var database = require("./db");
var justatest = {};
var bodyParser = require("body-parser");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var router = express.Router();
require("dotenv").config();

database.initDB();

var SpotifyWebApi = require("spotify-web-api-node");

var scopes = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "streaming",
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-modify-playback-state",
  "user-read-playback-state",
  "user-top-read"
];

app = express();
app
  .use(bodyParser.urlencoded({ extended: true }))
  .use(cookieParser())
  .use(
    session({
      key: "user_sid",
      secret: "somerandonstuffs",
      resave: false,
      saveUninitialized: false,
      cookie: {
        expires: 600000
      }
    })
  )
  .use((req, res, next) => {
    // This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
    // This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
    if (req.cookies.user_sid && !req.session.user) {
      res.clearCookie("user_sid");
    }
    next();
  });

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect("/dashboard");
  } else {
    next();
  }
};

app
  .use(function(req, res, next) {
    req.io = io;
    next();
  })
  .use(express.static(path.join(__dirname, "/static")))
  .get("/", function(request, response) {
    const ioConnection = request.io;
    if (request.session.user) {
      ioConnection.emit("logged in user", request.session.user);
    }
    var code = request.query.code || null;
    response.render("chat.html");
  })

  .get("/callback", function(request, response) {
    var code = request.query.code || null;

    spotifyApi.authorizationCodeGrant(code).then(function(data) {
      console.log("The token expires in " + data.body["expires_in"]);
      console.log("The access token is " + data.body["access_token"]);
      console.log("The refresh token is " + data.body["refresh_token"]);

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body["access_token"]);
      spotifyApi.setRefreshToken(data.body["refresh_token"]);

      // Retrieval of current state
      spotifyApi.getMyCurrentPlaybackState({}).then(
        function(data) {
          // Output items
          console.log("Now Playing: ", data.body);
        },
        function(err) {
          console.log("Something went wrong!", err);
        }
      );
    });
    //   Create a cool playlist
    //     .createPlaylist("mr_vanderwal", "My Cool Playlist", { public: true })
    //     .then(
    //       function(data) {
    //         console.log("Created playlist!");
    //       },
    //       function(err) {
    //         console.log("Something went wrong!", err);
    //       }
    //     );
    // });

    response.render("redirect.html");
  })

  .get("/register", function(request, response) {
    var User = userFunctions.models.user;
    database.sequelize
      .sync({ force: true })
      .then(() =>
        User.create({
          username: request.query.username,
          password: request.query.password,
          color: "hsl(" + Math.random() * 360 + ", 100%, 75%)"
        })
      )
      .then(user => {
        request.session.user = user.dataValues;
        response.redirect("/");
      });
  });

// Configuring the nj path as /templates
nunjucks.configure("templates", {
  autoescape: true,
  express: app
});

const server = app.listen(3000, "0.0.0.0", () =>
  console.log("running! on localhost:3000 ")
);

const io = require("socket.io")(server, {});

io.on("connection", socketConnection);

function socketConnection(socket) {
  socket.room = "General";
  console.log("this is a code", justatest[socket.user]);
  userFunctions.checkLocalStorage(socket);
  var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  });

  var authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  console.log(authorizeURL);

  socket.on("logged in user", function(data) {
    console.log("logged in", data);
  });

  socket.on("spotify user authenticated", function(code) {
    socket.spotify_auth_token = code;
    justatest[socket.user] = code;
    console.log(code);
  });

  socket.on("disconnect", function() {
    console.log("disconnect", socket.user, socket.room);
    roomFunctions.leaveRoom(io, socket, socket.user, socket.room);
  });

  socket.on("typing", function(data) {
    context = {
      message: "",
      typing: false
    };
    if (data.typing === true) {
      context.message = `${socket.user} is typing...`;
      context.typing = true;
    }
    socket.to(socket.room).emit("typing", context);
  });

  socket.on("login temp user", function(data) {
    userFunctions.configureTempUser(io, socket, data);
  });

  socket.on("logged in", function(data) {
    roomFunctions.joinRoom(io, socket, data.user, "General");
  });

  socket.on("new message", function(data) {
    censoredMessage = chatFunctions.censorProfanity(data, socket);
    io.to(socket.room).emit("new message", {
      message: censoredMessage,
      user: socket.user,
      user_color: socket.color
    });
  });

  socket.on("change room", function(data) {
    roomFunctions.leaveRoom(io, socket, socket.user, socket.room);
    socket.room = data.room;
    roomFunctions.joinRoom(io, socket, socket.user, socket.room);
  });
}
