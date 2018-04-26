(function() {
  const tempUser = document.querySelector(".tempUser");
  const loginTempUser = document.querySelector(".loginTempUser");

  var socket = io();

  loginTempUser.addEventListener("click", function() {
    socket.emit("login temp user", {
      username: tempUser.value
    });
  });
})();
