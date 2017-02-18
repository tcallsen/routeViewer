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

// POLL FILE and push any new routes to frontend
var sentRoutes = {};
var sentStartGuids = {};
var sentEndGuids = {};
var filePath = path.join( webappConfig.routesInterface.path );
var watchLock = false; //use watchLock to prevent extra fs.watch events from firing WHILE file is being updated

//check to ensure file exists
var checkFilePromise = new Promise( (resolve,reject) => {
	fs.open(filePath,'r',function(err, fd){
		if (err) {
			fs.writeFile(filePath, '', function(err) {
				if (err) console.log('ERROR WRITING temp routes text file!! Exiting');
				else resolve();
			});
		} else resolve();
	});
});

checkFilePromise.then( () => {

	fs.watch( filePath , {encoding: 'buffer'}, (eventType) => {
		watchLock = true;
		setTimeout(() => {
			//send only new routes forward on file update 
			//var newRoutes = [];
			fs.readFile(filePath, {encoding: 'utf-8'}, function(err,fileData){
			    
			    //read in updated file
			    fileData.split(/\r?\n/).forEach( (message,index) => {
			  
			    	//skip empty lines/routes
			    	if (!message.length) return;

			    	var messageObject = JSON.parse(message);

			    	//parse and send forward new routestart messages
			    	if (messageObject.type === 'routestart' && Object.keys(sentStartGuids).indexOf( messageObject.guid ) == -1) {
			    		sentStartGuids[messageObject.guid] = '';
			    		Object.keys(io.sockets.connected).forEach( socketKey => {
							io.sockets.connected[socketKey].emit('routestart', messageObject.guid );
						});
		    		}

		    		//parse and send forward new routeend messages
			    	if (messageObject.type === 'routeend' && Object.keys(sentEndGuids).indexOf( messageObject.guid ) == -1) {
			    		sentEndGuids[messageObject.guid] = '';
			    		Object.keys(io.sockets.connected).forEach( socketKey => {
							io.sockets.connected[socketKey].emit('routeend', messageObject.guid );
						});
		    		}

			    	//parse and send forward new routes
			    	if (messageObject.type === 'FeatureCollection') {
						//hash route to detect and remove duplicates
				    	var routeHash = crypto.createHash('sha256').update(message).digest('hex');
				    	if (Object.keys(sentRoutes).indexOf( routeHash ) == -1) {
				    		sentRoutes[routeHash] = ''; //track route as sent
				    		//newRoutes.push( message );
				    		Object.keys(io.sockets.connected).forEach( socketKey => {
								io.sockets.connected[socketKey].emit('newRoute', message );
							});
				    	}
			    	}

			    });

				//send new routes to connected sockets
				/* if (newRoutes.length) {
			    	Object.values(io.sockets.connected).forEach( socket => {
						socket.emit('newRoutes', newRoutes );
					});
			    } */

			});
			watchLock = false;
		}, 500);
	});

});
