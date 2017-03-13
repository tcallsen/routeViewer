/* //misc requires
var request = require('superagent');
var uuid = require('uuid');


 */

require('../css/main.css');

// REACT & REFLUX
import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import AppStore from './stores/AppStore.js';
import Map from './components/map.jsx';

class App extends Reflux.Component {
	
	constructor(props) {
		console.log('App constructor');
		super(props);
		this.state = {};
		this.store = AppStore;
	}

	render () {
		
		console.log('App render');

		return (

			<div>
				<Map />
			</div>

		);
	}
}


ReactDOM.render(<App/>, document.getElementById('app'));


/*
console.log( 'BaseStore' , BaseStore );

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

var io = require('socket.io-client');

// WEB SOCKET
var socket = io();
socket.on('connect', function(){
	console.log('socket connceted');
});

socket.on('newRoute', function(route){
	
	console.log('newRoute received; length: ', route.length);

	var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

	var routeFeatures = geoJsonParser.readFeatures( route );
	appState.map.routesLayer.getSource().addFeatures( routeFeatures ); 

	//if (appState.map.map) appState.map.map.getView().fit( appState.map.routesLayer.getSource().getExtent(), appState.map.map.getSize() );

});

// OPEN LAYERS map



appState.map.map.on('click', (event) => {

	if (appState.routing.active) {

		var clickedPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( to4326(appState.map.map.getCoordinateFromPixel(event.pixel)) ) );

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

					var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

					var routeFeatures = geoJsonParser.readFeatures( res.text, { featureProjection: 'EPSG:3857' } );
					appState.map.routesLayer.getSource().addFeatures( routeFeatures ); 

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


*/