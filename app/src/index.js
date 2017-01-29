//open layers and styles
var ol = require('openlayers');
require('openlayers/css/ol.css');

var io = require('socket.io-client');

// WEB SOCKET
var socket = io();
socket.on('connect', function(){
	console.log('socket connceted');
	/*
	console.log('sending message to server');
	socket.emit('handshake', 'browser here');
	socket.on('handshake', () => socket.send('good day'));
	*/
});
socket.on('newRoutes', function(newRoutes){
	console.log('newRoutes', newRoutes.length);
});

// OPEN LAYERS map
var map = new ol.Map({
	target: 'app',
	layers: [
		/* new ol.layer.Tile({
			source: new ol.source.XYZ({
				url: 'https://b.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGRjZG9kZ2VyIiwiYSI6ImNpeWhoemhpMTA1cWgyd212enVrb2lrbGIifQ.ujdf9NaM8L8sYTDP1dWvMw'
			})
		}) */
		/* new ol.layer.Tile({
            source: new ol.source.Stamen({
            	layer: 'terrain'
            })
      	}) */
      	new ol.layer.Tile({
	        source: new ol.source.OSM({
	            url: 'http://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
	            attributions: [
	                new ol.Attribution({ html: '© Google' }),
	                new ol.Attribution({ html: '<a href="https://developers.google.com/maps/terms">Terms of Use.</a>' })
	            ]
	        })
	    })
	],
	view: new ol.View({
		projection: 'EPSG:4326',
		center: [-89.386311071876291, 43.0767353342079],
		zoom: 13
	})
});