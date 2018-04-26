var socket = io();

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

socket.on("logged in user", function(data) {
  console.log("test");
  // var userData = { user: data.username, color: data.color, room: 0 };
  socket.emit("spotify generate access token", {
    user: data.username,
    code: getParameterByName("code")
  });
});
console.log("socket");

window.setTimeout(function() {
  // Move to a new location or you can do something else
  window.location.href = "/";
}, 3000);
