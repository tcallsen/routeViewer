import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import uuid from 'uuid';
import request from 'superagent';

import AppStore from '../stores/AppStore.js';
import Actions from '../actions/actions.js';

import RouteControl from '../components/routeControl.jsx';

//open layers and styles
var ol = require('openlayers');
require('openlayers/css/ol.css');

class Map extends Reflux.Component {
	
	constructor(props) {
		super(props);
		this.state = {
			map: null,
			routesLayer: null
		};
		this.store = AppStore;
	}

	componentDidMount() {

		var routesLayer = new ol.layer.Vector({
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			})
		});

		var snapToLayer = new ol.layer.Vector({
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			})
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
			    
			    routesLayer,

			    snapToLayer

			],
			view: new ol.View({
				//projection: 'EPSG:4326',
				center: this.to3857( [-89.386311071876291, 43.0767353342079] ),
				zoom: 13
			}),
			controls: ol.control.defaults({ rotate: false }).extend([
				this.refs.routeControl.control 
			])
		});

		map.on('click', this.handleMapClick.bind(this));
		map.on('pointermove', this.handleMapPointerMove.bind(this));

		this.setState({ 
			map : map,
			routesLayer: routesLayer,
			snapToLayer: snapToLayer
		});

	}

	handleMapClick(event) {

		// ROUTING

		if (this.state.routing.active) {

			var clickedPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.to4326(this.state.map.getCoordinateFromPixel(event.pixel)) ) );

			if (!this.state.routing.startCoord) this.state.routing.startCoord = clickedPointWkt;
			else {
				
				this.state.routing.endCoord = clickedPointWkt;

				//derive routing REST endpoint from webappConfig
				var routingRestEndpointUrl = this.state.config.routingRestEndpoint.protocol + '://' + this.state.config.routingRestEndpoint.host + ':' + this.state.config.routingRestEndpoint.port + '/' + this.state.config.routingRestEndpoint.path + '/';

				request.post( routingRestEndpointUrl )
					.send( Object.assign( {}, this.state.routing , { datetime: (new Date()).toISOString() , guid: uuid.v1() } ) )
					.set('Accept', 'application/json')
					.end( (err, res) => {
						
						console.log('route returned from backend', res.body);

						var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

						var routeFeatures = geoJsonParser.readFeatures( res.text, { featureProjection: 'EPSG:3857' } );
						this.state.routesLayer.getSource().addFeatures( routeFeatures ); 

					});

				Actions.toggleRouting();

			}

		}

	}

	handleMapPointerMove(event) {

		// ROUTING

		if (this.state.routing.active) {

			if (!this.state.routing.startCoord && !this.handleMapPointerMove.requestOut) {

				this.handleMapPointerMove.requestOut = true;

				var hoveredPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.to4326(this.state.map.getCoordinateFromPixel(event.pixel)) ) );

				//derive routing REST endpoint from webappConfig
				//var routingRestEndpointUrl = this.state.config.routingRestEndpoint.protocol + '://' + this.state.config.routingRestEndpoint.host + ':' + this.state.config.routingRestEndpoint.port + '/' + this.state.config.routingRestEndpoint.path + '/';
				var routingRestEndpointUrl = 'http://localhost:8080/graphWebApiSpring/getClosestPoint/';

				request.post( routingRestEndpointUrl )
					.send({
						startCoord: hoveredPointWkt
					})
					.set('Accept', 'application/json')
					.end( (err, res) => {

						var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

						var routeFeatures = geoJsonParser.readFeatures( res.text, { featureProjection: 'EPSG:3857' } );
						this.state.snapToLayer.getSource().clear();
						this.state.snapToLayer.getSource().addFeatures( routeFeatures ); 

						this.handleMapPointerMove.requestOut = false;

					});

			} 

		}

	}

	to3857( target ) {
		return ol.proj.transform( target , 'EPSG:4326','EPSG:3857')
	}

	to4326( target ) {
		return ol.proj.transform( target , 'EPSG:3857', 'EPSG:4326')	
	}

	render () {

		return (

			<div>

				<div ref="mapContainer" id="mapContainer" className={ (this.state.routing.active) ? 'crosshair' : '' } >
				</div>

				<RouteControl 
					ref="routeControl" 
					routing={this.state.routing} />

			</div>

		);
		
	}
}

module.exports = Map;