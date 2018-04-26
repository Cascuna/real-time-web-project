var express = require("express");
var nunjucks = require("nunjucks");
var path = require("path");
var roomFunctions = require("./room/");
var userFunctions = require("./user/");
var chatFunctions = require("./chat/");
var database = require("./db");
var bodyParser = require("body-parser");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var SpotifyWebApi = require("spotify-web-api-node");
var userKeyPairs = {};
var spotifySessionRoomPair = {};
var User = userFunctions.models.user;

var router = express.Router();
require("dotenv").config();
database.initDB();

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

// Configuring the nj path as /templates
nunjucks.configure("templates", {
  autoescape: true,
  express: app
});

const server = app.listen(3000, "0.0.0.0", () =>
  console.log("running! on localhost:3000 ")
);

const io = require("socket.io")(server, {});

app
  .use(bodyParser.urlencoded({ extended: true }))
  .use(cookieParser())
  .use(
    session({
      key: "user_sid",
      secret: "54632442365dkfospdir2834shfjkn0248sd",
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
    res.redirect("/");
  } else {
    next();
  }
};

function checkRequestSession(request) {
  if (request.session.user) {
    console.log("hits this", "beneath all the spammmmmmm");
    io.on("connect", function(socket) {
      socket.emit("logged in user", request.session.user);
    });
  }
}

function generateSpotifyAPIObject() {
  return (spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  }));
}

function generateSpotifyAuthUrl(apiObject = generateSpotifyAPIObject()) {
  return apiObject.createAuthorizeURL(scopes);
}

app
  .use(function(req, res, next) {
    req.io = io;
    next();
  })
  .use(express.static(path.join(__dirname, "/static")))
  .get("/", function(request, response) {
    if (request.session.user) {
      console.log("hits this", "beneath all the spammmmmmm");
      io.on("connect", function(socket) {
        socket.emit("logged in user", request.session.user);
      });
    }

    response.render("chat.html", { auth_url: generateSpotifyAuthUrl() });
  })

  .get("/callback", function(request, response) {
    if (request.session.user) {
      console.log("hits this", "beneath all the spammmmmmm");
      io.on("connect", function(socket) {
        socket.emit("logged in user", request.session.user);
      });
    }
    response.render("redirect.html");
  })

  .get("/register", function(request, response) {
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
        request.session.userobj = user;
        response.redirect("/");
      });
  });

io.on("connection", socketConnection);

function socketConnection(socket) {
  console.log("wat the fuck");
  socket.room = "General";
  // userFunctions.checkLocalStorage(socket);

  socket.on("setup spotify playlist", function(data) {
    var userApi = generateSpotifyAPIObject();
    userApi.setAccessToken(userKeyPairs[data.user].spotifyCode);
    userApi.setRefreshToken(userKeyPairs[data.user].spotifyRefresh);
    console.log("testing");
    spotifyApi.getMe().then(
      function(data) {
        console.log("testinggggggggg", data.body);
        spotifyApi
          .createPlaylist("mr_vanderwal", data.room, { public: true })
          .then(
            function(data) {
              console.log("Created playlist!", data);
              spotifySessionRoomPair[data.room] = { id: data.body.id };
              console.log(data.body.id);
            },
            function(err) {
              console.log("Something went wrong!", err);
            }
          );
        console.log("Some information about the authenticated user", data.body);
      },
      function(err) {
        console.log("Something went wrong!", err);
      }
    );
  });

  socket.on("spotify generate access token", function(response) {
    console.log(response);
    console.log(userKeyPairs);
    if (!userKeyPairs[response.user]) {
      var userApi = generateSpotifyAPIObject();
      userApi.authorizationCodeGrant(String(response.code)).then(
        function(data) {
          console.log("name", response.user);
          var accessToken = data.body["access_token"];
          console.log("The token expires in " + data.body["expires_in"]);
          // console.log("The access token is " + accessToken);
          // console.log("The refresh token is " + data.body["refresh_token"]);

          // // Set the access token on the API object to use it in later calls
          userKeyPairs[response.user] = {
            spotifyCode: accessToken,
            spotifyRefresh: data.body["refresh_token"]
          };

          userApi.setAccessToken(userKeyPairs[response.user].spotifyCode);
          userApi.setRefreshToken(userKeyPairs[response.user].spotifyRefresh);

          socket.spotifyCode = userKeyPairs[response.user];

          User.update(
            { spotify_code: spotifyApi.getAccessToken() },
            {
              where: { username: response.user }
            }
          ).then(updatedUser => {
            // project will be the first entry of the Projects table with the title 'aProject' || null
            // project.title will contain the name of the project
          });
        },
        function(err) {
          console.log("Something went wrong!", err);
          console.log("user api object", userApi);
        }
      );
    } else {
      socket.spotifyCode = userKeyPairs[response.user];
    }
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

  function registerUser(socket, data) {
    console.log("this is from register user", data.spotifyCode);
    if (data.spotifyCode) {
      socket.spotifyCode = data.spotifyCode;
    }
  }

  socket.on("logged in", function(data) {
    console.log("this is from logged in", data.spotifyCode);
    registerUser(socket, data);
    // HIER WORDT HIJ ERGENS AANGEROEPEN
    roomFunctions.joinRoom(io, socket, data.user, data.room | "General");
  });

  socket.on("new message", function(data) {
    if (data.message.includes("!search")) {
      let query = data.message.replace("!search", "");
      console.log(data.message.replace("!search", ""));
      spotifyApi.searchTracks(query).then(
        function(response) {
          console.log(
            "Search tracks by " + query + " in the artist name",
            response.body
          );
        },
        function(err) {
          console.log("Something went wrong!", err);
        }
      );
    }
    censoredMessage = chatFunctions.censorProfanity(data, socket);
    io.to(socket.room).emit("new message", {
      message: censoredMessage,
      user: socket.user,
      user_color: socket.color
    });
  });

  socket.on("change room", function(data) {
    socket.room = data.room;
    console.log(userKeyPairs[socket.user]);
    if (data.spotifyOnly) {
      console.log(userKeyPairs[socket.user]);
      if (userKeyPairs[socket.user]) {
        console.log("dank");
        roomFunctions.leaveRoom(io, socket, socket.user, socket.room);
        roomFunctions.joinRoom(io, socket, socket.user, socket.room, true);
      } else {
        socket.emit("profane message", {
          cusswords: [""],
          message:
            "You need to have spotify linked to your account to create a spotify listening room"
        });
      }
    } else {
      roomFunctions.leaveRoom(io, socket, socket.user, socket.room);
      roomFunctions.joinRoom(io, socket, socket.user, socket.room);
    }
  });
}
