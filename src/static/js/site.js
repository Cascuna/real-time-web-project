{
  var socket = io();
  var loggedIn = false;
  let currentCountDown = 0;
  const chatWindow = document.getElementById("messages");
  let currentTime = 0;
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

  function rateSong(event) {
    console.log(event.target);
  }

  function receiveMessage(event) {
    if (event.origin !== "http://localhost:3000") {
      console.log("oeps");
    }
    socket.emit("user authenticated", JSON.parse(event.data));
  }

  socket.on("update user list", function(users) {
    const onlineUsers = document.getElementById("online-users");
    onlineUsers.innerHTML = "";
    for (user of users) {
      let li = document.createElement("li");
      let username = document.createTextNode(user);
      li.appendChild(username);
      onlineUsers.appendChild(li);
    }
  });

  socket.on("playback devices fetched", function(data) {
    var playbackDevices =
      document.getElementById("playback-devices") ||
      document.createElement("select");
    playbackDevices.id = "playback-devices";
    playbackDevices.innerHTML = "";

    for (device of data.devices) {
      var deviceOption = document.createElement("option");
      deviceOption.value = device.id;
      var text = document.createTextNode(device.name + device.type);
      deviceOption.appendChild(text);
      playbackDevices.appendChild(deviceOption);
    }
    console.log(data.devices.length);
    if (data.devices.length === 0) {
      var deviceOption = document.createElement("option");
      var text = document.createTextNode(
        "Geen playback apparaten beschikbaar, zet er 1 aan"
      );
      deviceOption.appendChild(text);
      playbackDevices.appendChild(deviceOption);
    }
    document.getElementsByTagName("header")[0].appendChild(playbackDevices);
    hookPlaybackListener();
  });

  function hookPlaybackListener() {
    let playbackDevices = document.getElementById("playback-devices");
    // document.getElementById("playback-devices");
    playbackDevices.onclick = event => {
      socket.emit("update playback devices");
    };
    playbackDevices.onchange = event => {
      console.log(event.target.value);
      socket.emit("new active playback device", event.target.value);
      device.innerHTML += "(active)";
    };
  }
  socket.on("user logged in", function(data) {
    loggedIn = true;
    let musicForm = document.getElementById("music-form");
    musicForm.classList.remove("hidden");
    document.getElementsByTagName("header")[0].innerHTML = "";
    var welcomeText = document.createElement("span");
    welcomeText.classList.add("welcome-text");
    userName = data.user;
    welcomeText.innerHTML = `Welcome ${userName}!`;
    document.getElementsByTagName("header")[0].appendChild(welcomeText);
  });
  document.getElementById("message").oninput = function(event) {
    console.log(loggedIn);
    var autoCompleteList = document.getElementById("huge_list");
    var children = autoCompleteList.children;
    let songSelected = [...children].find(
      child => child.value === event.target.value
    );
    if (songSelected) {
      console.log(songSelected.id);
      socket.emit("add song to queue", songSelected.id);
    } else if (loggedIn) {
      socket.emit("auto complete query", event.target.value);
    }
  };

  document.getElementById("huge_list").onclick = function(test) {
    console.log(test.id);
  };

  socket.on("auto complete result", function(tracks) {
    if (loggedIn) {
      var autoCompleteList = document.getElementById("huge_list");
      autoCompleteList.innerHTML = "";
      for (track of tracks.tracks) {
        let option = document.createElement("option");
        option.value = track.name;
        option.id = track.id;
        // li.appendChild(textNode);
        autoCompleteList.appendChild(option);
      }
    }
  });

  function createPlaylistCard(details) {
    let player = document.getElementById("playlist-view");
    let li = document.createElement("li");
    let div = document.createElement("div");
    div.id = details.details.id;
    let img = document.createElement("img");
    console.log(details.details.album.images);
    img.src = details.details.album.images[2].url;
    div.appendChild(img);
    div.classList.add("card");
    let songName = document.createElement("div");
    songName.innerHTML = details.details.name;
    songName.classList.add("songName");
    let artistName = document.createElement("div");
    artistName.classList.add("artistName");

    artistName.innerHTML = details.details.artists[0].name;
    console.log(details.userName);
    let addedBy = document.createElement("div");
    addedBy.classList.add("addedBy");
    addedBy.innerHTML = "added by" + details.userName;

    // dislikeText = document.createTextNode = "dislike";
    // dislike.appendChild(dislikeText);
    let rs = function rateSong(event) {
      let currTarget = event.target;
      socket.emit("rate song", {
        songId: currTarget.getAttribute("data-id"),
        rating: currTarget.value
      });
    };

    let dislike = document.createElement("button");
    dislike.value = "dislike";
    dislike.innerHTML = "dislike";
    dislike.setAttribute("data-id", details.details.id);

    let like = document.createElement("button");
    like.value = "like";
    like.setAttribute("data-id", details.details.id);

    like.onclick = rs;
    dislike.onclick = rs;
    like.innerHTML = "like";

    let likeCount = document.createElement("span");
    likeCount.classList.add("like-counter");

    let scoreBar = document.createElement("div");

    scoreBar.appendChild(like);
    scoreBar.appendChild(dislike);
    scoreBar.appendChild(likeCount);
    div.appendChild(songName);
    div.appendChild(artistName);
    div.appendChild(addedBy);
    div.appendChild(scoreBar);
    li.appendChild(div);
    player.appendChild(li);
  }

  socket.on("create song card", function(details) {
    console.log(details);
    createPlaylistCard(details);
  });

  var totalRunTime = 0;
  function millisToMinutesAndSeconds(millis, songPlayTime = false) {
    if (songPlayTime) {
      totalRunTime = Math.round(millis / 1000);
    }
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }
  var updatecountDown;
  var counter = 0;
  const chatBar = document.querySelector("#chatbar");
  chatBar.addEventListener("submit", function(event) {
    socket.emit("new message", {
      message: messageInput.value
    });
    messageInput.value = "";
    event.preventDefault();
  });

  socket.on("song rated", function(data) {
    let songRate = document.getElementById(data.songId);
    let likeCounter = songRate.querySelector(".like-counter");
    likeCounter.innerHTML = data.rating;
  });

  function typingFunction() {
    typing = false;
    socket.emit("typing", { message: false, typing: typing });
  }
  let timeout;
  const messageInput = document.getElementById("message_input");
  messageInput.addEventListener("keyup", function() {
    typing = true;
    socket.emit("typing", { typing: typing });
    clearTimeout(timeout);
    timeout = setTimeout(typingFunction, 500);
  });

  function updateCountDown() {
    let progressBar = document.getElementById("progresBar");
    let totalDuration = document.getElementById("total-duration");
    let timeLeft = document.getElementById("time-left");
    counter++;
    console.log(totalRunTime);
    if (counter >= totalRunTime && totalRunTime != 0) {
      clearInterval(updatecountDown);

      let spotifyPlayer = document.getElementById("spotify-player");
      spotifyPlayer.innerHTML = "";
      counter = 0;
      socket.emit("play next in queue");
    }
    timeLeft.innerHTML = millisToMinutesAndSeconds(counter * 1000);
    progressBar.value = counter;
  }

  function showCurrentSongPlaying(nextSong) {
    console.log(nextSong);
    if (nextSong.id) {
      songsContainer = document.getElementById(nextSong.id);
    } else {
      songsContainer = document.getElementById(nextSong.details.id);
    }
    if (songsContainer) {
      songsContainer.classList.add("large");
      let player = songsContainer.parentNode;
      player.removeChild(songsContainer);
    } else {
      let li = document.createElement("li");
      let div = document.createElement("div");
      div.id = nextSong.details.id;
      let img = document.createElement("img");
      console.log(nextSong.details.album.images);
      img.src = nextSong.details.album.images[2].url;
      div.appendChild(img);
      div.classList.add("card");
      div.classList.add("large");
      let songName = document.createElement("div");
      songName.innerHTML = nextSong.details.name;
      let artistName = document.createElement("div");
      artistName.classList.add("artistName");

      artistName.innerHTML = nextSong.details.artists[0].name;
      console.log(nextSong.userName);
      let addedBy = document.createElement("div");
      addedBy.innerHTML = "added by" + nextSong.userName;
      let rs = function rateSong(event) {
        let currTarget = event.target;
        socket.emit("rate song", {
          songId: currTarget.getAttribute("data-id"),
          rating: currTarget.value
        });
      };

      let dislike = document.createElement("button");
      dislike.value = "dislike";
      dislike.innerHTML = "dislike";
      dislike.setAttribute("data-id", nextSong.details.id);

      let like = document.createElement("button");
      like.value = "like";
      like.setAttribute("data-id", nextSong.details.id);

      like.onclick = rs;
      dislike.onclick = rs;
      like.innerHTML = "like";

      let likeCount = document.createElement("span");
      likeCount.classList.add("like-counter");

      let scoreBar = document.createElement("div");

      scoreBar.appendChild(like);
      scoreBar.appendChild(dislike);
      scoreBar.appendChild(likeCount);
      div.appendChild(songName);
      div.appendChild(artistName);
      div.appendChild(addedBy);
      div.appendChild(scoreBar);
      songsContainer = div;
    }

    let countDown = document.createElement("div");
    countDown.id = "countdown";

    let spotifyPlayer = document.getElementById("spotify-player");
    spotifyPlayer.innerHTML = "";
    let timeLeft = document.createElement("span");
    timeLeft.innerHTML = "0";
    timeLeft.id = "time-left";
    let totalDuration = document.createElement("span");
    totalDuration.id = "total-duration";
    if (!nextSong.duration) {
      currentCountDown = millisToMinutesAndSeconds(
        nextSong.details.duration_ms,
        true
      );
    } else {
      currentCountDown = millisToMinutesAndSeconds(nextSong.duration, true);
    }

    totalDuration.innerHTML = currentCountDown;
    let progressBar = document.createElement("progress");
    progressBar.id = "progresBar";
    progressBar.max = totalRunTime;
    console.log(songsContainer);
    songsContainer.appendChild(timeLeft);
    songsContainer.appendChild(progressBar);
    songsContainer.appendChild(totalDuration);
    console.log(songsContainer.children);
    spotifyPlayer.appendChild(songsContainer);

    updatecountDown = setInterval(updateCountDown, 1000);
  }

  socket.on("current song playing", function(nextSong) {
    counter = 0;
    showCurrentSongPlaying(nextSong);
  });

  socket.on("update spotify related ui", function(data) {
    if (data.currentSong) {
      console.log((Date.now() - data.currentSong.timeStarted) / 1000);
      counter = Math.round((Date.now() - data.currentSong.timeStarted) / 1000);
      showCurrentSongPlaying(
        data.currentSong.song,
        data.currentSong.timeStarted
      );
    }
    for (queueItem of data.queue) {
      console.log(queueItem);
      createPlaylistCard(queueItem);
    }
  });

  var offlineMessage = document.getElementById("server-not-connected-message");

  socket.on("connect_error", function() {
    if (!socket.connected) {
      offlineMessage.classList.remove("hidden");
    } else {
      offlineMessage.classList.add("hidden");
    }
    console.log("Is The Server Online? " + socket.connected);
  });

  socket.on("connect", function() {
    if (!socket.connected) {
      offlineMessage.classList.remove("hidden");
    } else {
      offlineMessage.classList.add("hidden");
    }

    console.log("Is The Server Online? " + socket.connected);
  });
  chatWindows = document.querySelector("#chat-chat");

  socket.on("new message", function(data) {
    let mItem = document.createElement("li");
    let p = document.createElement("p");
    let userDiv = document.createElement("div");
    userDiv.textContent = data.user + " ";
    // userDiv.style.color = String(data.user_color);
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

  window.addEventListener("message", receiveMessage, false);

  // spotifyLoginWindow.onbeforeunload = function retrieveAuthCredentials() {
  //   var accessToken = localStorage.getItem("sp-accessToken");
  //   var refreshToken = localStorage.getItem("sp-refreshToken");
  // };
}
