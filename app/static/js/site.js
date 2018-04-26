(function() {
  const sendMessage = document.getElementById("send_message");
  const messageInput = document.getElementById("message_input");
  const chatWindow = document.getElementById("messages");
  const userWindow = document.getElementById("users");
  const roomsWindow = document.getElementById("rooms");
  const changeRoom = document.getElementById("change_room");
  const roomInput = document.getElementById("room_input");
  const tempUser = document.querySelector(".tempUser");
  const loginTempUser = document.querySelector(".loginTempUser");
  const currentRoom = document.querySelector("#current_room");
  const typingNotification = document.querySelector("#is_typing");
  const chatWindows = document.querySelector("#chat-chat");
  const chatBar = document.querySelector("#chatbar");
  const spotifyOnlySelection = document.querySelector("#spotifyOnlySelection");
  var socket = io();

  socket.on("save user in localstorage", function(data) {
    var ctx = JSON.stringify({ user: data.user, color: data.color });
    console.log(ctx);
    if (window.localStorage) {
      localStorage.setItem(data.key, ctx);
    }
  });

  function userParticipation(joined = True, data) {
    let messageBlock = document.createElement("li");
    let participationStatus = document.createElement("p");
    let status = "left";
    if (joined) {
      status = "joined";
    }
    participationStatus.textContent = `${data.user} ${status}`;
    messageBlock.appendChild(participationStatus);
    chatWindow.appendChild(messageBlock);
  }

  loginTempUser.addEventListener("click", function(e) {
    socket.emit("login temp user", {
      user: tempUser.value
    });
    e.preventDefault();
  });
  socket.on("login temp user", function(data) {});

  function promptLoginScreen() {
    document.querySelector("#tempaccount").style.display = "flex";
    document.querySelector("#chatbar").style.display = "none";
    document.querySelector("#display").style.display = "none";
  }

  socket.on("check localstorage", function(localStorageKeyNames) {
    var userData = localStorage.getItem(localStorageKeyNames.temp);
    console.log(userData);
    if (!userData) {
      promptLoginScreen();
    } else {
      var userData = JSON.parse(userData);
      console.log(userData);
      socket.emit("logged in", userData);
    }
  });

  socket.on("logged in user", function(data) {
    console.log("test", data.username);
    var userData = {
      user: data.username,
      color: data.color,
      room: socket.room | "General"
    };
    console.log("spotify", data.spotifyCode);
    if (data.spotifyCode) {
      userData.spotifyCode = data.spotifyCode;
    }
    socket.emit("logged in", userData);
  });

  chatBar.addEventListener("submit", function(event) {
    socket.emit("new message", {
      message: messageInput.value
    });
    messageInput.value = "";
    event.preventDefault();
  });

  function typingFunction() {
    typing = false;
    socket.emit("typing", { message: false, typing: typing });
  }
  let timeout;
  messageInput.addEventListener("keyup", function() {
    typing = true;
    socket.emit("typing", { typing: typing });
    clearTimeout(timeout);
    timeout = setTimeout(typingFunction, 500);
  });

  socket.on("typing", function(data) {
    if (data.typing) {
      console.log("test");
      typingNotification.innerHTML = data.message;
    } else {
      typingNotification.innerHTML = "";
    }
  });

  changeRoom.addEventListener("click", function() {
    socket.emit("change room", {
      room: roomInput.value,
      spotifyOnly: spotifyOnlySelection.checked
    });
  });

  socket.on("user left", function(data) {
    userParticipation(false, data);
  });

  socket.on("setup user client", function(data) {
    console.log(data);

    if (data.spotify === true) {
      let mItem = document.createElement("li");
      let p = document.createElement("p");
      let userDiv = document.createElement("div");
      userDiv.textContent = " Joined a spotify listening room, setting up.";
      userDiv.style.color = String(data.user_color);
      p.appendChild(userDiv);
      t = document.createTextNode(
        "Joined a spotify listening room, setting up."
      );
      p.appendChild(t);
      mItem.appendChild(p);
      chatWindow.appendChild(mItem);
      socket.emit("setup spotify playlist", { room: room, user: user });
    }

    document.querySelector("#tempaccount").style.display = "none";
    document.querySelector("#chatbar").style.display = "flex";
    document.querySelector("#display").style.display = "grid";
    currentRoom.innerHTML = "Current room " + data.room;
    chatWindow.innerHTML = "";
  });

  var test = ``;

  socket.on("user joined", function(data) {
    userParticipation(true, data);
  });

  socket.on("connect_error", function() {
    console.log("Is The Server Online? " + socket.connected);
  });

  socket.on("connect", function() {
    console.log("Is The Server Online? " + socket.connected);
  });

  socket.on("update roomlist", function(data) {
    roomsWindow.innerHTML = "";
    let roomsTitle = document.querySelector(".room-header");
    let header = document.querySelector("header");
    roomsTitle.textContent = Object.keys(data.rooms).length + " Rooms active";

    for (room of Object.keys(data.rooms)) {
      let roomItem = document.createElement("li");
      let roomName = document.createElement("a");
      roomName.textContent = `${room}`;
      roomName.addEventListener("click", function(event) {
        socket.emit("change room", {
          room: event.target.innerHTML
        });
      });
      roomItem.appendChild(roomName);
      roomsWindow.appendChild(roomItem);
    }
  });

  socket.on("update userlist", function(data) {
    userWindow.innerHTML = "";
    let usersTitle = document.querySelector(".chat-header");
    usersTitle.textContent = data.activeUsers.length + " Users in room";
    for (user of data.activeUsers) {
      let mItem = document.createElement("li");
      let userJoined = document.createElement("p");
      userJoined.textContent = `${user}`;
      mItem.appendChild(userJoined);
      userWindow.appendChild(mItem);
    }
  });
  socket.on("profane message", function(data) {
    let mItem = document.createElement("li");
    let p = document.createElement("p");

    p.textContent = data.message + " " + data.cusswords;
    mItem.appendChild(p);
    chatWindow.appendChild(mItem);
  });
  socket.on("new message", function(data) {
    let mItem = document.createElement("li");
    let p = document.createElement("p");
    let userDiv = document.createElement("div");
    userDiv.textContent = data.user + " ";
    userDiv.style.color = String(data.user_color);
    p.appendChild(userDiv);
    t = document.createTextNode(data.message);
    p.appendChild(t);
    mItem.appendChild(p);

    // Only scroll to the bottom when a user is close to the bottom
    let windowTop = chatWindow.scrollTop;
    chatWindow.appendChild(mItem);
    if (
      chatWindows.scrollHeight - chatWindows.scrollTop - window.innerHeight <
      50
    ) {
      chatWindows.scrollTop = chatWindows.scrollHeight;
    }
  });
})();
