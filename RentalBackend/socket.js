const { Server } = require("socket.io");

let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });
    console.log("WebSocket Server Initialized");
    return io;
  },
  getIo: () => {
    if (!io) {
      console.error("WebSocket (Socket.io) is not initialized!");
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
