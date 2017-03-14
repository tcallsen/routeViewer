/* //misc requires
var request = require('superagent');
var uuid = require('uuid');

        document.getElementById('getRoute').addEventListener('click', () => {
            appState.routing.active = true;
            appState.DOM.map.classList.add('crosshair');
        });

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
		super(props);
		this.state = {};
		this.store = AppStore;
	}

	render () {
		
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

*/