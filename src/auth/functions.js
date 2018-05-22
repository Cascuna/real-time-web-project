const spotifyWebApi = require("spotify-web-api-node");
const io = require("../server");
const config = require("../config").get(process.env.NODE_ENV);
const sessionConfig = config.socket.session;
const spotifyApiInterface = newSpotifyApiInstance();

var devices = [];

function newSpotifyApiInstance() {
  return new spotifyWebApi({
    clientId: config.spotifyAuth.clientId,
    clientSecret: config.spotifyAuth.clientSecret,
    redirectUri: config.spotifyAuth.redirectUri
  });
}

exports.generateUserSpotifyApiInstance = function generateUserSpotifyApiInstance(
  access_token,
  refresh_token
) {
  const userApiInstance = newSpotifyApiInstance();
  userApiInstance.setAccessToken(access_token);
  userApiInstance.setRefreshToken(refresh_token);

  return userApiInstance;
};

exports.checkForPlaybackChanges = function checkForPlaybackChanges(socket) {
  let userApi = socket.handshake.session.spotifyApi;
  if (!socket.handshake.session.devices) {
    socket.handshake.session.devices = [];
  }
  let sessionDevices = socket.handshake.session.devices;
  userApi.getMyDevices().then(function(data) {
    let updated = false;
    console.log(sessionDevices);
    for (device of data.body.devices) {
      tempSessionDevices = sessionDevices.map(session => session.id);
      if (!tempSessionDevices.includes(device.id)) {
        sessionDevices.push(device);
        updated = true;
      }
    }
    if (updated) {
      socket.emit("playback devices fetched", {
        devices: sessionDevices
      });
    }
  });
};

exports.generateSpotifyUrl = function generateSpotifyUrl() {
  return spotifyApiInterface.createAuthorizeURL(config.spotifyAuth.scopes);
};

exports.callback = function callback(request, response) {
  let code = request.query.code || null;
  if (code) {
    spotifyApiInterface.authorizationCodeGrant(code).then(function(data) {
      console.log("The token expires in " + data.body["expires_in"]);
      console.log("The access token is " + data.body["access_token"]);
      console.log("The refresh token is " + data.body["refresh_token"]);

      response.render("callback", {
        access_token: data.body["access_token"],
        refresh_token: data.body["refresh_token"]
      });
    });
  } else {
    response
      .status(404) // HTTP status 404: NotFound
      .send(
        "No code parameter, please ensure the authentication went correctly."
      );
  }
};

exports.userLoggedIn = function userLoggedIn(socket, session) {
  let devices = [];
  socket.handshake.session.spotifyApi.getMyDevices().then(function(data) {
    for (device of data.body.devices) {
      console.log(device);
      devices.push(device);
    }
    socket.emit("playback devices fetched", {
      devices: devices
    });
  });
  socket.emit("user logged in", {
    user: socket.handshake.session[sessionConfig.user]
  });
};
