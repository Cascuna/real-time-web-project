var database = require("../db");
var sequelize = database.sequelize;
var Sequelize = require("sequelize");
exports.user = sequelize.define("user", {
  username: Sequelize.STRING,
  password: Sequelize.STRING,
  spotifyCode: {
    type: Sequelize.STRING(2550),
    allowNull: true
  },
  color: Sequelize.STRING
});
