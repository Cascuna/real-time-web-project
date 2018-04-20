let rooms = {};

function updateUserList(io, room) {
  io.to(room).emit("update userlist", {
    activeUsers: rooms[room]
  });
}

exports.joinRoom = function joinRoom(io, socket, user, room) {
  socket.user = user;
  socket.room = room;

  // Ensure a entry of the room is made
  if (!rooms[room]) {
    rooms[room] = [];
  }

  socket.join(room);
  rooms[room].push(user);

  // Signal the users client to configure
  socket.emit("setup user client", {
    user: user,
    room: room
  });

  socket.to(room).broadcast.emit("user joined", {
    user: user,
    room: room
  });

  updateUserList(io, room);
  io.sockets.emit("update roomlist", {
    rooms: rooms
  });
};

exports.leaveRoom = function leaveRoom(io, socket, user, room) {
  try {
    socket.leave(room);
    socket.to(room).broadcast.emit("user left", {
      user: user
    });
    rooms[room] = rooms[room].filter(u => u !== user);

    updateUserList(io, room);
  } catch (e) {
    // TODO: Make a more descriptive error
    console.log(e);
  }
};
