const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const nunjucks = require("nunjucks");
const router = express.Router();
const auth = require("./auth/");

nunjucks.configure("templates", {
  autoescape: true,
  express: app
});
console.log(auth.paths);
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

exports.io = io;

io.on("connection", function(socket) {
  console.log("a user connected");

  socket.on("user authenticated", function(data) {
    socket.spotifyApi = auth.functions.generateUserSpotifyApiInstance(
      data.access_token,
      data.refresh_token
    );
    socket.spotifyApi.getMe().then(data => {
      // TODO: What is a good name for this event? :)
      socket.emit("user verified", { user: data.body.id });
      console.log(data.body);
    });
  });
});

server.listen(3000, "0.0.0.0", serverConnected);
