const server = require("../server");
const io = server.io;
const config = require("../config").get(process.env.NODE_ENV);
const auth = require("../auth/");
const sessionConfig = config.socket.session;

class Queue {
  constructor() {
    this.currentlyPlaying = false;
    this.queue = [];
    this.scoreBoard = {};
    this.unsortedRatings = [];
    this.io = io;
  }

  addToQueue(song, socket) {
    let id = song.split(":").pop();

    socket.handshake.session.spotifyApi.getTrack(id, {}).then(
      details => {
        this.queue.push({
          songId: id,
          uri: song,
          details: details.body,
          userName: socket.handshake.session[sessionConfig.user]
        });
        console.log(socket.handshake.session[sessionConfig.user]);
        socket.io.sockets.emit("create song card", {
          details: details.body,
          userName: socket.handshake.session[sessionConfig.user]
        });
        if (!this.currentlyPlaying) {
          this.playNextSong(socket);
        }
      },
      function(error) {
        console.log(error);
      }
    );
  }

  calcRate(song_id, socket) {
    let songScore = 0;
    console.log(this.scoreBoard[song_id]);
    for (let [key, rating] of Object.entries(this.scoreBoard[song_id])) {
      console.log(key, rating);
      rating == "like" ? songScore++ : songScore--;
    }
    this.unsortedRatings[song_id] = songScore;

    // nxtSongValue = this.queue.find(song => song.songId == wantedKey);

    socket.io.sockets.emit("song rated", {
      rating: songScore,
      songId: song_id
    });
  }

  RateSong(socket, song_id, rating) {
    let user = socket.handshake.session[sessionConfig.user];
    if (!this.scoreBoard[song_id]) {
      this.scoreBoard[song_id] = {};
    }
    if (this.scoreBoard[song_id][user] !== rating) {
      this.scoreBoard[song_id][user] = rating;
      this.calcRate(song_id, socket);
    }
  }

  RetrieveQueue(socket) {
    // console.log(this.currentlyPlaying);
    if (socket.handshake.session.spotifyApi) {
      console.log("currplaying uri", this.currentlyPlaying.song.uri);
      socket.handshake.session.spotifyApi.play({
        device_id: socket.handshake.session[sessionConfig.playback],
        uris: [this.currentlyPlaying.song.uri],
        offset: { position: this.currentlyPlaying.timeStarted }
      });
    }

    socket.emit("update spotify related ui", {
      queue: this.queue,
      currentSong: this.currentlyPlaying
    });
    if (this.queue) {
      for (let queueItem in this.queue) {
        console.log("queue item", queueItem);
        // this.rateSong(socket, queueItem.songId, "none");
      }
    }
  }

  playNextSong(socket) {
    let nextSong;
    let nxtSongValue = "";
    console.log(this.unsortedRatings.length);
    if (this.unsortedRatings.length > 0) {
      let keysSorted = Object.keys(this.unsortedRatings).sort((a, b) => {
        return this.unsortedRatings[a] - this.unsortedRatings[b];
      });
      let neededKey = keysSorted.pop();
      nextSong = this.queue.find(song => song.songId == neededKey);
    } else {
      nextSong = this.queue.shift();
    }
    // let nextSong;
    // console.log(this.unsortedRatings);
    // if (this.unsortedRatings > 0) {
    //   console.log("unsorted ratings", this.unsortedRatings);

    //   let keysSorted = Object.keys(this.unsortedRatings).sort((a, b) => {
    //     return this.unsortedRatings[a] - this.unsortedRatings[b];
    //   });
    //   console.log("sorted", keysSorted);
    //   neededKey = keysSorted.pop();
    //   console.log(queue.find(song => song.songId == wantedKey));
    //   nxtSongValue = queue.find(song => song.songId == wantedKey);
    // } else {
    //   nxtSongValue = this.queue.shift();
    // }
    // if (nxtSongValue) {
    //   nextSong = nxtSongValue;
    // }

    if (!nextSong) {
      console.log("no songs!");
      this.currentlyPlaying = "";
    } else {
      console.log(Object.entries(server.FileStore.sessions));
      for (let [key, session] of Object.entries(server.FileStore.sessions)) {
        session = JSON.parse(session);
        spotifyApi = auth.functions.generateUserSpotifyApiInstance(
          session.access_token,
          session.refresh_token
        );
        if (session[sessionConfig.user]) {
          spotifyApi
            .play({
              device_id: session[sessionConfig.playback],
              uris: [nextSong.uri]
            })
            .then(
              data => {
                this.currentlyPlaying = {
                  song: nextSong,
                  timeStarted: Date.now()
                };

                socket.io.sockets.emit("current song playing", {
                  duration: nextSong.details.duration_ms,
                  id: nextSong.details.id
                });
              },
              err => console.log(err)
            ),
            function(err) {
              console.log(err);
            };
        }
      }
    }
  }
}

let queueSingleton = {
  instance: false,
  getInstance: function(socket = undefined) {
    return this.instance ? this.instance : this.createInstance();
  },
  createInstance: function(socket) {
    this.instance = new Queue();
    return this.instance;
  }
};
exports.queue = queueSingleton.getInstance();
