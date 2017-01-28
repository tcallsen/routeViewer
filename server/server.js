var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//static files
app.use('/static', express.static('static'))

//home page
app.get('/', function(req, res){
	res.sendFile(__dirname + '/static/index.html');
});

//websocket behavior
io.on('connection', function(socket){
	console.log('a user connected');
});

//start server
http.listen(3000, function(){
	console.log('listening on *:3000');
});