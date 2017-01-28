var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//webpack dev server
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

//home page
app.get('/', function(req, res){
	res.sendFile(__dirname + '/static/index.html');
});

//websocket behavior
io.on('connection', function(socket){
	console.log('a user connected nodemon');
});

//start server
http.listen(3000, function(){
	console.log('listening on *:3000');
});