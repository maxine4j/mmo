import express from 'express';
import * as socketio from 'socket.io';
import * as path from 'path';

const app = express();
app.set('port', process.env.PORT || 3000);

const http = require('http').Server(app);
// set up socket.io and bind it to our
// http server.
const io = require('socket.io')(http);

// whenever a user connects on port 3000 via
// a websocket, log that a user has connected
io.on('connection', (socket: any) => {
    console.log('a user connected its working!!');
    // whenever we receive a 'message' we log it out
    socket.on('message', (message: any) => {
        console.log('got a message:', message);
    });
});

const server = http.listen(3000, () => {
    console.log('listening on *:3000');
});
