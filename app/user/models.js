var database = require("../db");
var sequelize = database.sequelize;
var Sequelize = require("sequelize");
exports.user = sequelize.define("user", {
  username: Sequelize.STRING,
  password: Sequelize.STRING,
  spotify_code: Sequelize.STRING(2550),
  color: Sequelize.STRING
});
