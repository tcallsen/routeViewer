//misc requires
var request = require('superagent');

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

socket.on('newRoutes', function(newRoutes){
	
	console.log('newRoutes received:', newRoutes.length);

	var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

	newRoutes.forEach( route => {
		var routeFeature = geoJsonParser.readFeature( route );
		appState.map.routesLayer.getSource().addFeature( routeFeature ); 
	}); 

	if (appstate.map.map) appState.map.map.getView().fit( appState.map.routesLayer.getSource().getExtent(), appState.map.map.getSize() );

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
		
		appState.DOM.map.classList.add('crosshair');

		var clickedPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( appState.map.map.getCoordinateFromPixel(event.pixel) ) );

		if (!appState.routing.startCoord) appState.routing.startCoord = clickedPointWkt;
		else {
			
			appState.routing.endCoord = clickedPointWkt;

			appState.DOM.map.classList.remove('crosshair');

			request.post('http://localhost:8080/graphWebApiSpring/')
				.send( appState.routing )
				.set('Accept', 'application/json')
				.end( (err, res) => {
					
					console.log('route returned from backend');
					var geoJsonParser = new ol.format.GeoJSON();
					var routeFeature = geoJsonParser.readFeature( res.body.features[0] );
					appState.map.routesLayer.getSource().addFeature( routeFeature ); 

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
	
	document.getElementById('getRoute').addEventListener('click', () => {
		appState.routing.active = true;
	});

	appState.DOM.map = document.getElementById('map');

	console.log( appState );

});

