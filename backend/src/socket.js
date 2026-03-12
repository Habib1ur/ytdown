// Singleton to share the Socket.IO instance between index.js and services
let _io = null;

function setIo(io) {
  _io = io;
}

function getIo() {
  return _io;
}

module.exports = { setIo, getIo };
