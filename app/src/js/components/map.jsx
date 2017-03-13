import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import AppStore from '../stores/AppStore.js';

//open layers and styles
var ol = require('openlayers');
require('openlayers/css/ol.css');

class Map extends Reflux.Component {
	
	constructor(props) {
		console.log('Map constructor');
		super(props);
		this.state = {};
		this.store = AppStore;
	}

	componentDidMount() {

		var routesLayer = new ol.layer.Vector({
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			}),
		});

		var map = new ol.Map({
			target: this.refs.mapContainer,
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
			    
			    routesLayer
			],
			view: new ol.View({
				//projection: 'EPSG:4326',
				center: this.to3857( [-89.386311071876291, 43.0767353342079] ),
				zoom: 13
			})
		});

	}	


	to3857( target ) {
		return ol.proj.transform( target , 'EPSG:4326','EPSG:3857')
	}

	to4326( target ) {
		return ol.proj.transform( target , 'EPSG:3857', 'EPSG:4326')	
	}

	render () {
		console.log('Map render' , this );
		return (

			<div ref="mapContainer" id="mapContainer">
				
			</div>

		);
	}
}

module.exports = Map;