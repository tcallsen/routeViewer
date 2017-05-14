// imports and initialization

	//load app config
	var webappConfig = require('/etc/gritto/graphWebApi.conf.json');

	//load web framework
	var express = require('express');
	var app = express();
	var http = require('http').Server(app);
	var io = require('socket.io')(http);
	var path = require('path');

	// webpack - compilation of javascript code and serving to frontend
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

// http server

	// server
	http.listen(3000, function(){
		console.log('listening on *:3000');
		console.log('configuration:');
		console.log(webappConfig);
	});

	// routes

		// index.html - static html with includes react js bundle
		app.get('/', function(req, res){
			res.sendFile(__dirname + '/static/index.html');
		});

		// static files
		app.use('/static', express.static(path.join(__dirname, 'static')))

		// web app config - expose web app config to frontend (with certain server-only properties redacted)
		app.get('/config.json', function(req, res){
	
			var outgoingConfid = Object.assign( {} , webappConfig );
			
			//trim non relevate webappConfig options before sending	
			delete outgoingConfid.routesInterface;
			delete outgoingConfid.graphDbLocation;
			delete outgoingConfid.graphScoreDbLocation;
			delete outgoingConfid.redisInformation;

			//write response
			res.writeHead(200, {"Content-Type": "application/json"});
			res.end( JSON.stringify( outgoingConfid ) );

		});

// redis

	// iniatiate redis client to relay redis queue entries down to frontend via Socket.io / WebSocket
	var redisClient = require('redis').createClient();
	function checkForRoutes() {
		redisClient.blpop(['routes',0], function (listName, item) {
			var messageObject = JSON.parse( item[1] );
			//pass message on down websocket to frontend
			Object.keys(io.sockets.connected).forEach( socketKey => {
				io.sockets.connected[socketKey].emit( messageObject.type , item[1] );
			});
			checkForRoutes();
		});
	}
	
	// invoke redis listener
	checkForRoutes();
	