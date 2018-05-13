require("dotenv").config();
var config = {
  default: {
    socket: {
      /* Saving session namespaces here so they are easily accesible 
       throughout the application */
      session: {
        namespace: "socket",
        spotifyApi: "spotifyApi",
        user: "spotifyUser"
      }
    },
    spotifyAuth: {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
      scopes: [
        "user-read-private",
        "user-read-email",
        "playlist-read-private",
        "playlist-read-collaborative",
        "playlist-modify-public",
        "playlist-modify-private",
        "streaming",
        "user-read-currently-playing",
        "user-read-recently-played",
        "user-modify-playback-state",
        "user-read-playback-state",
        "user-top-read"
      ]
    },
    redis: {
      secret: process.env.REDIS_SECRET
    }
  }
};

// Allow the user to fetch the correct config for the environment
exports.get = function get(env) {
  return config[env] || config.default;
};
