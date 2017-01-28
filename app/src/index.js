var io = require('socket.io-client');

//initiate socket connection
var socket = io();

socket.on('connect', function(){
	
	console.log('socket connceted');

	console.log('sending message to server');

	socket.emit('handshake', 'browser here');

	socket.on('handshake', () => socket.send('good day'));

});
