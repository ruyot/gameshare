const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', socket => {
  console.log('Client connected:', socket.id);
  socket.on('offer', offer => socket.broadcast.emit('offer', offer));
  socket.on('answer', ans   => socket.broadcast.emit('answer', ans));
  socket.on('ice-candidate', cand => socket.broadcast.emit('ice-candidate', cand));
});

server.listen(4000, () => console.log('Signaling server listening on port 4000'));