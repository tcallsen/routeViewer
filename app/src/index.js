//misc requires
var request = require('superagent');
var uuid = require('node-uuid');
require('./css/main.css');

//open layers and styles
var ol = require('openlayers');
require('openlayers/css/ol.css');

var io = require('socket.io-client');

// WEB SOCKET
var socket = io();
socket.on('connect', function(){
	console.log('socket connceted');
});

// JS APP STATE
var appState = {
	DOM: {},
	routing: {
		active: false,
		startCoord: null,
		endCoord: null
	},
	map: {
		map: null,
		routesLayer: null,
		routes: []
	}
};

socket.on('newRoute', function(route){
	
	console.log('newRoute received; length: ', route.length);

	var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

	var routeFeatures = geoJsonParser.readFeatures( route );
	appState.map.routesLayer.getSource().addFeatures( routeFeatures ); 

	//if (appState.map.map) appState.map.map.getView().fit( appState.map.routesLayer.getSource().getExtent(), appState.map.map.getSize() );

});

// OPEN LAYERS map

appState.map.routesLayer = new ol.layer.Vector({
	source: new ol.source.Vector({
		features:[],
		wrapX: false
	}),
});

appState.map.map = new ol.Map({
	target: 'map',
	layers: [
      	new ol.layer.Tile({
	        source: new ol.source.OSM({
	            url: 'http://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
	            attributions: [
	                new ol.Attribution({ html: '© Google' }),
	                new ol.Attribution({ html: '<a href="https://developers.google.com/maps/terms">Terms of Use.</a>' })
	            ]
	        })
	    }),
	    appState.map.routesLayer
	],
	view: new ol.View({
		projection: 'EPSG:4326',
		center: [-89.386311071876291, 43.0767353342079],
		zoom: 13
	})
});

appState.map.map.on('click', (event) => {

	if (appState.routing.active) {

		var clickedPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( appState.map.map.getCoordinateFromPixel(event.pixel) ) );

		if (!appState.routing.startCoord) appState.routing.startCoord = clickedPointWkt;
		else {
			
			appState.routing.endCoord = clickedPointWkt;

			appState.DOM.map.classList.remove('crosshair');

			//derive routing REST endpoint from webappConfig
			var routingRestEndpointUrl = webappConfig.routingRestEndpoint.protocol + '://' + webappConfig.routingRestEndpoint.host + ':' + webappConfig.routingRestEndpoint.port + '/' + webappConfig.routingRestEndpoint.path + '/';

			request.post( routingRestEndpointUrl )
				.send( Object.assign( {}, appState.routing , { datetime: (new Date()).toISOString() , guid: uuid.v1() } ) )
				.set('Accept', 'application/json')
				.end( (err, res) => {
					console.log('route returned from backend', res.body);
				});

			appState.routing = {
				active: false,
				startCoord: null,
				endCoord: null
			};

		}

	}

});

window.addEventListener('load', () => {
	
	//load webappConfig from backend (contains things like routing REST endpoint, etc.)
	request.get('/config.json')
		.set('Accept', 'application/json')
		.end( (err, res) => {
			window.webappConfig = Object.assign( {} , res.body );
			console.log( 'config:' , webappConfig );
		});

	document.getElementById('getRoute').addEventListener('click', () => {
		appState.routing.active = true;
		appState.DOM.map.classList.add('crosshair');
	});

	appState.DOM.map = document.getElementById('map');

	console.log( 'appState:' ,appState );

});

