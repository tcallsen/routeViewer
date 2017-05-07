import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import request from 'superagent';

import AppStore from '../stores/AppStore.js';
import MapStore from '../stores/MapStore.js';
import RouteStore from '../stores/RouteStore.js';
import Actions from '../actions/actions.js';

import LayerControl from '../components/layerControl.jsx';
import RouteControl from '../components/routeControl.jsx';
import SettingsControl from '../components/settingsControl.jsx';
import RerunControl from '../components/rerunControl.jsx';
import ClearControl from '../components/clearControl.jsx';
import RoutesListControl from '../components/routesListControl.jsx';
import StatusLabel from './statusLabel.jsx';

//open layers and styles
var ol = require('openlayers');
require('openlayers/css/ol.css');

class Map extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		//register AppState store
		this.store = MapStore;
		
		//register RouteStore updates
		this.mapStoreToState( RouteStore, this.handleRouteStoreUpdate.bind(this) );

		this.getFeatureStyle = this.getFeatureStyle.bind(this);
		this.getHighlightedFeatureStyle = this.getHighlightedFeatureStyle.bind(this);
	
	}

	componentDidMount() {

		var routesLayer = new ol.layer.Vector({
			name: 'routesLayer',
			//style: this.getFeatureStyle,
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			})
		});

		var highlightedRoutesLayer = new ol.layer.Vector({
			name: 'highlightedRoutesLayer',
			style: this.getFeatureStyle,
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			})
		});

		var snapToLayer = new ol.layer.Vector({
			name: 'snapToLayer',
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			})
		});

		var wmsLayersGroup = new ol.layer.Group();

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

				wmsLayersGroup,

			    routesLayer,

			    highlightedRoutesLayer,

			    snapToLayer

			],
			view: new ol.View({
				//projection: 'EPSG:4326',
				//sfcenter: [-13626306.53671995, 4549638.757784466], 
				//madcenter: [-9947818.324464286, 5324462.825544785], //this.to3857( [-89.386311071876291, 43.0767353342079] ),
				center: [-8573106.89777416, 4706908.00530346],
				zoom: 13, //13
			}),
			controls: ol.control.defaults({ rotate: false }).extend([
				this.refs.layerControl.control,
				this.refs.routeControl.control,
				this.refs.settingsControl.control,
				this.refs.rerunControl.control,
				this.refs.clearControl.control,
				this.refs.routesListControl.control
			])
		});

		map.on('click', this.handleMapClick.bind(this));
		map.on('pointermove', this.handleMapPointerMove.bind(this));

		Actions.setMapStoreReferences({ 
			map: map,
			wmsLayersGroup: wmsLayersGroup,
			routesLayer: routesLayer,
			highlightedRoutesLayer: highlightedRoutesLayer,
			snapToLayer: snapToLayer,
			context: this
		});

	}

	componentDidUpdate(prevProps, prevState) {

		//RECONCILE IF wmsMapLayers has been updated

	    	//console.log('map componentDidUpdate');

			var existingEnabled = [];
			var existingDisabled = [];
			this.state.wmsLayersGroup.getLayers().getArray().forEach( layer => {
				existingEnabled.push( layer.get('guid') );
			});

			var updateEnabled = [];
			var updateDisabled = [];
			this.state.wmsLayerDefinitions.getFlatList().forEach( layerDefinition => {
				if (layerDefinition.enabled) updateEnabled.push( layerDefinition.layer.get('guid') );
				else updateDisabled.push( layerDefinition.layer.get('guid') );
			});

			//console.log( 'existingEnabled' , existingEnabled );
			//console.log( 'existingDisabled' , existingDisabled );

			//console.log( 'updateEnabled' , updateEnabled );
			//console.log( 'updateDisabled' , updateDisabled );

			//add any enabled to map
			updateEnabled.forEach( layerGuid => {
				if (existingEnabled.indexOf(layerGuid) == -1) {
					this.state.wmsLayersGroup.getLayers().push( this.state.wmsLayerDefinitions[layerGuid].layer );
				}
			});

			updateDisabled.forEach( layerGuid => {
				if (existingEnabled.indexOf(layerGuid) != -1) {
					this.state.wmsLayersGroup.getLayers().remove( this.state.wmsLayerDefinitions[layerGuid].layer );
				}
			});

	}

	getFeatureStyle(feature, resolution) {

		//console.log('getting base style for ' + feature.get('routeSequence'));

		//starting with default style
		var fill = new ol.style.Fill({
			color: 'rgba(255,255,255,0.4)'
		});
		var stroke = new ol.style.Stroke({
			color: '#3399CC',
			width: 1.25
		});
		var styles = [
			new ol.style.Style({
				image: new ol.style.Circle({
					fill: fill,
					stroke: stroke,
					radius: 5
				}),
				fill: fill,
				stroke: stroke
			})
		];

		return styles;

	}

	getHighlightedFeatureStyle(feature, resolution) {

		var baseStyle = this.getFeatureStyle(feature, resolution);

		if (feature.getGeometry().getType() === 'LineString') {
			
			//check if special scoring exists on feature / road - if so highlight

			var containScoringPriotization = false;
			Object.keys(this.props.config.roadScoringProperties).forEach( metricName => {
				
				if (containScoringPriotization) return;
				
				var metricDefinition = this.props.config.roadScoringProperties[metricName];

				/* if ( metricName === 'score_highway') {
					if ( feature.get( 'score_highway' ) === '1.0' ) containScoringPriotization = true;
				}
				else */

				if ( typeof feature.get( metricName ) !== 'undefined' && feature.get( metricName ) !== 0 && metricDefinition.value !== 0 ) containScoringPriotization = true;

				/* //debug
				if ( typeof feature.get( metricName ) !== 'undefined' && metricName !== 'score_highway' ) {
					console.log( metricName + " scoring encountered!" );
				} */

			});

			if ( containScoringPriotization ) {

				// SPECIAL highlighting - road has socring priorities
				
				var innerStyle = baseStyle[0];
				innerStyle.setStroke(  
					new ol.style.Stroke({
						color: 'rgb(253,141,1)',
						width: 2.5
					})
				);

				var outerStyle = innerStyle.clone();
				outerStyle.setStroke(  
					new ol.style.Stroke({
						color: '#4a9aff',
						width: 7
					})
				);

				baseStyle = [outerStyle, innerStyle];

			} else {

				// DEFAULT highlighting - nothing special about road
				
				baseStyle[0].setStroke(  

					new ol.style.Stroke({
						color: 'rgb(253,141,1)',
						width: 2.5
					})

				);

			}

		} else if (feature.getGeometry().getType() === 'Point') {

			baseStyle[0].setImage(  

				new ol.style.Circle({
					fill: new ol.style.Fill({
						color: 'rgba(253,141,1,.5)'
					}),
					stroke: new ol.style.Stroke({
						color: 'rgb(29,142,53)',
						width: 1.25
					}),
					radius: 5
				})

			);

		} 

		return baseStyle;

	}

	handleRouteStoreUpdate(args) {
		
		if (args.type === 'newRoute') {

			this.state.routesLayer.getSource().addFeatures( args.features );

		} else if (args.type === 'routeStart') {

			Actions.clearMapLayerSource('routesLayer');

		} else if (args.type === 'highlightedRoutes') {

			//clear only highlightedRoutesLayer
			//Actions.clearMapLayerSource('highlightedRoutesLayer');

			//loop through supplied features and add highlight flag
			Object.values(args.routes).forEach( route => {
				this.state.highlightedRoutesLayer.getSource().addFeatures( route.features );
			});

			//if highlight features are present, dim base features layer
			if ( this.state.highlightedRoutesLayer.getSource().getFeatures().length > 0 ) {
				this.state.routesLayer.setOpacity( .035 );
			} else this.state.routesLayer.setOpacity( 1 );

		}

	}

	handleMapClick(event) {

		// ROUTING
		if (this.props.routingState === 'selecting') {

			var clickedPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.to4326(this.state.map.getCoordinateFromPixel(event.pixel)) ) );

			Actions.setRoutingCoord( clickedPointWkt );

		}

	}

	handleMapPointerMove(event) {
		return;
		// ROUTING
		
		if (this.props.routingState === 'selecting') {

			if (!this.state.routing.startCoord && !this.handleMapPointerMove.requestOut) {

				this.handleMapPointerMove.requestOut = true;
				var hoveredPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.to4326(this.state.map.getCoordinateFromPixel(event.pixel)) ) );
				var routingRequestBody = {startCoord: hoveredPointWkt };

				Actions.executeRoutingRequest( routingRequestBody , '/getClosestPoint/' , function(err,res) {
					
					this.handleMapPointerMove.requestOut = false;

					var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

					var routeFeatures = geoJsonParser.readFeatures( res.text, { featureProjection: 'EPSG:3857' } );
					Actions.clearMapLayerSource('snapToLayer');
					this.state.snapToLayer.getSource().addFeatures( routeFeatures ); 

				}.bind(this) );

			} else if (!this.handleMapPointerMove.requestOut) {

				this.handleMapPointerMove.requestOut = true;
				var hoveredPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.to4326(this.state.map.getCoordinateFromPixel(event.pixel)) ) );
				var routingRequestBody = Object.assign( {}, this.state.routing , { datetime: (new Date()).toISOString() , guid: uuid.v1() , endCoord: hoveredPointWkt } );

				Actions.executeRoutingRequest( routingRequestBody , '/getRoute/' , function(err,res) {
					
					this.handleMapPointerMove.requestOut = false;

					var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

					var routeFeatures = geoJsonParser.readFeatures( res.text, { featureProjection: 'EPSG:3857' } );
					Actions.clearMapLayerSource('snapToLayer');
					this.state.snapToLayer.getSource().addFeatures( routeFeatures ); 

				}.bind(this) );

			}

		}

		//highlight road scoring
		if (this.props.routingState === 'routing' || this.props.routingState === 'complete') {

			this.state.map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
				
				if ( layer.get('name') !== 'highlightedRoutesLayer' ) return;
				
				Object.keys(this.props.config.roadScoringProperties).forEach( metricName => {
					
					var metricDefinition = this.props.config.roadScoringProperties[metricName];

					//skip non score metrics (e.g. population size) and deactivated metrics
					if ( typeof metricDefinition.isScore !== 'undefined' && !metricDefinition.isScore || metricDefinition.value === 0 ) return;

					if ( typeof feature.get( metricName ) !== 'undefined' && feature.get( metricName ) !== 0 ) {
						console.log( metricName + ":  " + feature.get( metricName ) );
					}

				});

			});

		}
		

	}

	to3857( target ) {
		return ol.proj.transform( target , 'EPSG:4326','EPSG:3857')
	}

	to4326( target ) {
		return ol.proj.transform( target , 'EPSG:3857', 'EPSG:4326')	
	}

	render () {

		//derive mapContainer className
		var className = "";
		if (this.props.layerControlVisible)  className += 'layerControlVisible ';
		if (this.props.routingState) className += 'routing-' + this.props.routingState;

		return (

			<div id="mapContainerParent" className={ className }>

				<div ref="mapContainer" id="mapContainer"> </div>

				<StatusLabel />

				<LayerControl
					ref="layerControl" 
					layerDefinitions={ this.state.wmsLayerDefinitions }
					isVisible={ this.props.layerControlVisible } />

				<RouteControl 
					ref="routeControl" 
					routingState={this.props.routingState} />

				<SettingsControl 
					ref="settingsControl" />
					
				<RoutesListControl 
					ref="routesListControl" />

				<RerunControl
					ref="rerunControl" />

				<ClearControl 
					ref="clearControl"
					routingState={this.props.routingState} />

			</div>

		);
		
	}
}

module.exports = Map;