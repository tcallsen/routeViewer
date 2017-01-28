var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// WEBPACK - compilation of javascript code and serving to frontend
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var webpackConfig = require('./webpack.dev.config');
var compiler = webpack(webpackConfig);
app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    stats: {colors: true}
}));
app.use(webpackHotMiddleware(compiler, {
    log: console.log
}))

// HOMEPAGE - serve static html with includes js bundle
app.get('/', function(req, res){
	res.sendFile(__dirname + '/static/index.html');
});

// WEBSOCKET
io.on('connection', function(socket){
	
	console.log('socket connection established with user');

	socket.on('handshake', function(message){
		console.log('user message recieved: ' + message);
		console.log('replying to user');
		socket.emit('handshake', 'server here');
	});

	socket.on('message', function(message){
		console.log('user message recieved: ' + message);
	});

});

// SERVER
http.listen(3000, function(){
	console.log('listening on *:3000');
});