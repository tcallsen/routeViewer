//load config
var webappConfig = require('/etc/gritto/graphWebApi.conf.json');

//web and framework
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//file IO
var fs = require('fs');
var path = require('path');
var readline = require('readline');
var crypto = require('crypto');

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

// STATIC FILES
app.use('/static', express.static(path.join(__dirname, 'static')))

// CONFIG - serve config options to frontend
app.get('/config.json', function(req, res){
	
	var outgoingConfid = Object.assign( {} , webappConfig );
	
	//trim non relevate webappConfig options before sending	
	delete outgoingConfid.routesInterface;
	delete outgoingConfid.graphDbLocation;

	//write response
	res.writeHead(200, {"Content-Type": "application/json"});
	res.end( JSON.stringify( outgoingConfid ) );

});

// SERVER
http.listen(3000, function(){

	console.log('listening on *:3000');

	console.log('configuration:');
	console.log(webappConfig);

});

// REDIS
var Redis = require('redis');
var client = Redis.createClient();
function checkForRoutes() {
	client.blpop(['scored_routes',0], function (listName, item) {
		
		var messageObject = JSON.parse( item[1] );

		//parse and send forward new routes
		if (messageObject.type === 'FeatureCollection') {
    		Object.keys(io.sockets.connected).forEach( socketKey => {
				io.sockets.connected[socketKey].emit('newRoute', item[1] );
			});
    	}

		//parse and send forward new routestart messages
		else if (messageObject.type === 'routestart') {
			Object.keys(io.sockets.connected).forEach( socketKey => {
				io.sockets.connected[socketKey].emit('routestart', messageObject.guid );
			});
		}

		//parse and send forward new routeend messages
		else if (messageObject.type === 'routeend') {
			Object.keys(io.sockets.connected).forEach( socketKey => {
				io.sockets.connected[socketKey].emit('routeend', messageObject.guid );
			});
		}

		//prase and send foward new score updates
		else if (messageObject.type === 'newBestScore') {
			Object.keys(io.sockets.connected).forEach( socketKey => {
				io.sockets.connected[socketKey].emit('newBestScore', item[1] );
			});
		}

		checkForRoutes();

	});
}
checkForRoutes();