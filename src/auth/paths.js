const express = require("express");
const router = express.Router();
const functions = require("./functions");
const app = express();

app.use(express.json()); // to support JSON-encoded bodies
// app.use(express.urlencoded()); // to support URL-encoded bodies

router.all("/", function(req, res) {
  res.render("index.html", { detailpage: true });
});

// Application requests refresh and accesstoken IF auth was succesful
router.get("/callback", functions.callback);

module.exports = router;
