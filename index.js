var express = require('express'), http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.use(express.static('./'));

var player = 0;
var startAllowed = false;

io.on('connection', function (socket) {
    socket.on("ready", (msg) => {
        player++;
        console.log(`a user ${player} connected`);
        io.emit("player", player);
        if (player != 2) return;

        if (!startAllowed) {
            startAllowed = true;
            console.log("started");

            io.emit("start", true);
        }
    });

    socket.on('disconnect', function () {
        console.log(`user ${player} disconnected`);
        player--;
        if (player == 0) {
            console.log("stoped");
            startAllowed = false;
        }
    });

    socket.on('enemymove', (command) => {
        socket.broadcast.emit('enemymove', command);
    });

    socket.on('enemymousemove', (mousePos) => {
        socket.broadcast.emit('enemymousemove', mousePos);
    });

});

server.listen(3000, function () {
    console.log('listening on *:3000');
});