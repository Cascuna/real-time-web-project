var roomFunctions = require("../room/");
var localStorage = require("localStorage");
var localStorageKeyNames = { temp: "temporaryUser" };

exports.models = require("./models");
// function storeTempUserData(socket) {
//   var tempUser = {
//     user: String(socket.user),
//     color: socket.color,
//     room: socket.room
//   };

//   localStorage.setItem("tempUser", JSON.stringify(tempUser));
// }
exports.checkLocalStorage = function checkLocalStorage(socket) {
  socket.emit("check localstorage", localStorageKeyNames);
};

function configureBaseUser(io, socket, data, type) {
  socket.color = "hsl(" + Math.random() * 360 + ", 100%, 75%)";
  socket.user = data.user;
  socket.room = "General";
  var key =
    type === "temp" ? localStorageKeyNames.temp : localStorageKeyNames.user;
  socket.emit("save user in localstorage", {
    key: key,
    user: data.user,
    color: data.color
  });
}

exports.configureTempUser = function configureTempuser(io, socket, data) {
  configureBaseUser(io, socket, data, "temp");

  roomFunctions.joinRoom(io, socket, socket.user, socket.room);
};
