
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var users = {};
var rooms = {};


app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});


io.on('connection', function (socket) {

    socket.on('login', function (data, callback) {
        if (data in users) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            io.emit('users', Object.keys(users));
            socket.join('all');
            if (rooms['all'] == undefined) rooms['all'] = [];
            rooms['all'].push(socket.nickname);
        }
    });

    socket.on('join', function (room) {
        socket.join(room);
        if (rooms[room] == undefined) rooms[room] = [];
        rooms[room].push(socket.nickname);
    });


    socket.on('chat', function (msg) {
        io.to(msg.room).emit('chat', { msg: msg.msg, user: socket.nickname, room: msg.room });
    });

    socket.on('getusers', function (data) {
        socket.emit('users', rooms[data]);
    });

    socket.on('disconnect', function (data) {
        delete users[socket.nickname];
        for (var room in rooms) {
            if (rooms.hasOwnProperty(room)) {
                var element = rooms[room];
                var index = element.indexOf(socket.nickname);
                if (index > -1) {
                    element.splice(index, 1);
                }
            }
        }

        io.emit('userleft');
    });
});

http.listen(port, function () {
    console.log('listening on:'+ port);
});