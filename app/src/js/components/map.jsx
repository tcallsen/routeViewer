import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import uuid from 'uuid';
import request from 'superagent';

import AppStore from '../stores/AppStore.js';
import RouteStore from '../stores/RouteStore.js';
import Actions from '../actions/actions.js';

import RouteControl from '../components/routeControl.jsx';
//import ClearControl from '../components/clearControl.jsx';
import RoutesListControl from '../components/routesListControl.jsx';

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
		
		//register AppState store
		this.store = AppStore;
		
		//register RouteStore updates
		this.mapStoreToState( RouteStore, this.handleRouteStoreUpdate.bind(this) );

		this.clearRoutesLayer = this.clearRoutesLayer.bind(this);

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
				this.refs.routeControl.control,
				//this.refs.clearControl.control,
				this.refs.routesListControl.control
			])
		});

		map.on('click', this.handleMapClick.bind(this));
		map.on('pointermove', this.handleMapPointerMove.bind(this));

		Actions.setMapState({ 
			map: map,
			routesLayer: routesLayer,
			snapToLayer: snapToLayer,
			context: this
		});

	}

	clearRoutesLayer() {

		this.state.map.map.removeLayer( this.state.map.routesLayer );

		this.state.map.routesLayer = new ol.layer.Vector({
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			})
		});

		this.state.map.map.addLayer( this.state.map.routesLayer );

	}

	handleRouteStoreUpdate(args) {
		
		if (args.type === 'newRoute') {

			//console.log('adding routeSequence ' + args.routeSequence + " to map");

			this.state.map.routesLayer.getSource().addFeatures( args.features );

		} else if (args.type === 'routeStart') {

			this.clearRoutesLayer()

		}

	}

	handleMapClick(event) {

		// ROUTING

		if (this.state.routing.active) {

			var clickedPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.to4326(this.state.map.map.getCoordinateFromPixel(event.pixel)) ) );

			if (!this.state.routing.startCoord) this.state.routing.startCoord = clickedPointWkt;
			else {
				
				this.state.routing.endCoord = clickedPointWkt;

				//derive routing REST endpoint from webappConfig
				var routingRestEndpointUrl = this.state.config.routingRestEndpoint.protocol + '://' + this.state.config.routingRestEndpoint.host + ':' + this.state.config.routingRestEndpoint.port + '/' + this.state.config.routingRestEndpoint.path + '/getRoutes/';

				request.post( routingRestEndpointUrl )
					.send( Object.assign( {}, this.state.routing , { datetime: (new Date()).toISOString() , guid: uuid.v1() } ) )
					.set('Accept', 'application/json')
					.end( (err, res) => {
			
						//complete routing sequence
						Actions.completeRouting();
						this.state.map.snapToLayer.getSource().clear();				

					});

				Actions.submitRouting();

			}

		}

	}

	handleMapPointerMove(event) {

		// ROUTING

		if (this.state.routing.active) {

			if (!this.state.routing.startCoord && !this.handleMapPointerMove.requestOut) {

				this.handleMapPointerMove.requestOut = true;

				var hoveredPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.to4326(this.state.map.map.getCoordinateFromPixel(event.pixel)) ) );

				//derive routing REST endpoint from webappConfig
				var routingRestEndpointUrl = this.state.config.routingRestEndpoint.protocol + '://' + this.state.config.routingRestEndpoint.host + ':' + this.state.config.routingRestEndpoint.port + '/' + this.state.config.routingRestEndpoint.path + '/getClosestPoint/';

				request.post( routingRestEndpointUrl )
					.send({
						startCoord: hoveredPointWkt
					})
					.set('Accept', 'application/json')
					.end( (err, res) => {

						this.handleMapPointerMove.requestOut = false;

						var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

						var routeFeatures = geoJsonParser.readFeatures( res.text, { featureProjection: 'EPSG:3857' } );
						this.state.map.snapToLayer.getSource().clear();
						this.state.map.snapToLayer.getSource().addFeatures( routeFeatures ); 

					});

			} else if (!this.handleMapPointerMove.requestOut) {

				this.handleMapPointerMove.requestOut = true;

				var hoveredPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.to4326(this.state.map.map.getCoordinateFromPixel(event.pixel)) ) );

				//derive routing REST endpoint from webappConfig
				var routingRestEndpointUrl = this.state.config.routingRestEndpoint.protocol + '://' + this.state.config.routingRestEndpoint.host + ':' + this.state.config.routingRestEndpoint.port + '/' + this.state.config.routingRestEndpoint.path + '/getRoute/';

				request.post( routingRestEndpointUrl )
					.send( Object.assign( {}, this.state.routing , { datetime: (new Date()).toISOString() , guid: uuid.v1() , endCoord: hoveredPointWkt } ) )
					.set('Accept', 'application/json')
					.end( (err, res) => {

						this.handleMapPointerMove.requestOut = false;

						var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

						var routeFeatures = geoJsonParser.readFeatures( res.text, { featureProjection: 'EPSG:3857' } );
						this.state.map.snapToLayer.getSource().clear();
						this.state.map.snapToLayer.getSource().addFeatures( routeFeatures ); 

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

		//				<ClearControl 
		//			ref="clearControl" />

		return (

			<div>

				<div ref="mapContainer" id="mapContainer" className={ (this.state.routing.active) ? 'crosshair' : '' } >
				</div>

				<RouteControl 
					ref="routeControl" 
					routing={this.state.routing} />
					
				<RoutesListControl 
					ref="routesListControl" />

			</div>

		);
		
	}
}

module.exports = Map;