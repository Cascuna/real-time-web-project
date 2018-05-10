const express = require("express");
const app = express();
const nunjucks = require("nunjucks");

nunjucks.configure("templates", {
  autoescape: true,
  express: app
});
app
  .set("view engine", "html")
  .use(express.static("static"))
  .get("/", homePage);
const io = require("socket.io")(
  app.listen(3000, "0.0.0.0", serverConnected),
  {}
);

function homePage(request, response) {
  response.render("index");
}

function serverConnected() {
  console.log("available on http://127.0.0.1:3000");
}
