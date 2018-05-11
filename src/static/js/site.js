{
  var socket = io();
  const loginButton = document.getElementById("spotify-link");
  loginButton.onclick = function callSpotifyUrl(caller) {
    // TODO: Replace with your own credentials, automate the making of this
    // TODO: Generate this on the backend, send with a socket event?
    // Opening the url in a new window helps with sockets, since we can keep the requesting connection!
    var spotifyLoginWindow = window.open(
      caller.target.href,
      "popup",
      "width=600,height=600"
    );
    return false;
  };

  function receiveMessage(event) {
    if (event.origin !== "http://localhost:3000") {
      console.log("oeps");
    }
    socket.emit("user authenticated", JSON.parse(event.data));
  }

  socket.on("user verified", function(data) {
    document.getElementsByTagName("header")[0].innerHTML = `<b>Welcome ${
      data.user
    }!</b>`;
  });

  window.addEventListener("message", receiveMessage, false);

  // spotifyLoginWindow.onbeforeunload = function retrieveAuthCredentials() {
  //   var accessToken = localStorage.getItem("sp-accessToken");
  //   var refreshToken = localStorage.getItem("sp-refreshToken");
  // };
}
