const server = require("../server");
const io = server.io;
const config = require("../config").get(process.env.NODE_ENV);
const auth = require("../auth/");
const sessionConfig = config.socket.session;

class Queue {
  constructor() {
    this.currentlyPlaying = false;
    this.queue = [];
    this.io = io;
  }

  addToQueue(song, socket) {
    let id = song.split(":").pop();

    socket.handshake.session.spotifyApi.getTrack(id, {}).then(
      details => {
        this.queue.push({
          uri: song,
          details: details.body,
          userName: socket.handshake.session[sessionConfig.user]
        });
        console.log(socket.handshake.session[sessionConfig.user]);
        socket.io.sockets.emit("no name yet", {
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

  RetrieveQueue(socket) {
    console.log("we in here");
    socket.emit("update spotify related ui", {
      queue: this.queue,
      currentSong: this.currentlyPlaying
    });
  }

  playNextSong(socket) {
    let nextSong = this.queue.shift();
    console.log(nextSong);
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
