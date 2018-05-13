{
  var socket = io();
  const loginButton = document.getElementById("spotify-link");
  loginButton.onclick = function callSpotifyUrl(caller) {
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

  socket.on("update user view", function(users) {
    const onlineUsers = document.getElementById("online-users");
    onlineUsers.innerHTML = "";
    for (user of users) {
      let li = document.createElement("li");
      let username = document.createTextNode(user);
      li.appendChild(username);
      onlineUsers.appendChild(li);
    }
  });

  socket.on("user logged in", function(data) {
    document.getElementsByTagName("header")[0].innerHTML = `<b>Welcome ${
      data.user
    }!</b>`;
  });

  document.getElementById("message").oninput = function(event) {
    console.log(event.target.value);
    var autoCompleteList = document.getElementById("huge_list");
    var children = autoCompleteList.children;
    let songSelected = [...children].find(
      child => child.value === event.target.value
    );
    if (songSelected) {
      console.log(songSelected.id);
      socket.emit("add song to queue", songSelected.id);
    } else {
      socket.emit("auto complete query", event.target.value);
    }
  };
  socket.on("auto complete result", function(tracks) {
    console.log(tracks.tracks);
    var autoCompleteList = document.getElementById("huge_list");
    autoCompleteList.innerHTML = "";
    for (track of tracks.tracks) {
      let option = document.createElement("option");
      option.value = track.name;
      option.id = track.id;
      // li.appendChild(textNode);
      autoCompleteList.appendChild(option);
    }
  });

  document.getElementById("huge_list").onclick = function(test) {
    console.log(test.id);
  };

  window.addEventListener("message", receiveMessage, false);

  // spotifyLoginWindow.onbeforeunload = function retrieveAuthCredentials() {
  //   var accessToken = localStorage.getItem("sp-accessToken");
  //   var refreshToken = localStorage.getItem("sp-refreshToken");
  // };
}
