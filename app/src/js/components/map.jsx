//externals
import request from 'superagent';
import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

//internals
import Actions from '../actions/actions.js';
import StatusLabel from './statusLabel.jsx';
import MapStore from '../stores/MapStore.js';
import RouteStore from '../stores/RouteStore.js';
import MapLibrary from '../objects/MapLibrary.js';

//import map controls
import LayerControl from '../components/mapControls/layerControl.jsx';
import RouteControl from '../components/mapControls/routeControl.jsx';
import SettingsControl from '../components/mapControls/settingsControl.jsx';
import RerunControl from '../components/mapControls/rerunControl.jsx';
import ClearControl from '../components/mapControls/clearControl.jsx';
import RoutesListControl from '../components/mapControls/routesListControl.jsx';

//open layers and styles
var ol = require('openlayers');
require('openlayers/css/ol.css');

class Map extends Reflux.Component {
	
	constructor(props) {
		
		super(props);
		
		//register MapStore for wms layer information and RouteStore for route vector feature information
		this.stores = [MapStore, RouteStore];

		//bind map component as calling context for all functions in MapLibrary
		this.library = new MapLibrary();
		Object.keys( this.library ).forEach( libraryFunctionName => {
			this.library[libraryFunctionName] = this.library[libraryFunctionName].bind(this);
		});

	}

	componentDidMount() {

		// displays routes generated during routing
		var routesLayer = new ol.layer.Vector({
			name: 'routesLayer',
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			})
		});

		// displays highlighted routes - i.e. those selected be user for closer examination
		var highlightedRoutesLayer = new ol.layer.Vector({
			name: 'highlightedRoutesLayer',
			style: this.library.getHighlightedFeatureStyle,
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			})
		});

		// displays snap-to features - i.e. closest point and sample single route produced by backed
		// 	- included to enhance user experience
		var snapToLayer = new ol.layer.Vector({
			name: 'snapToLayer',
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			})
		});

		// proper grouping to contain WMS layers - enforces consistent layer ordering throughout toggling of WMS layers
		var wmsLayersGroup = new ol.layer.Group();

		// instantiate map object to tie everythig together
		var map = new ol.Map({
			target: this.refs.mapContainer,
			layers: [
		      	
		      	// Google maps base layer
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
				center: [-8573106.89777416, 4706908.00530346], // Washington DC
				zoom: 13,
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

		//set event listeners on map click and hover - listeners will trgger routing
		map.on('click', this.handleMapClick.bind(this));
		map.on('pointermove', this.handleMapPointerMove.bind(this));

		//save map and layer references to local state
		this.setState({ 
			map: map,
			wmsLayersGroup: wmsLayersGroup,
			routesLayer: routesLayer,
			highlightedRoutesLayer: highlightedRoutesLayer,
			snapToLayer: snapToLayer
		});

	}

	componentDidUpdate(prevProps, prevState) {

		// WMS LAYERS has been updated

			if ( true || this.state.wmsLayerDefinitions.store !== prevState.wmsLayerDefinitions.store ) {

				var existingEnabled = [];
				this.state.wmsLayersGroup.getLayers().getArray().forEach( layer => {
					existingEnabled.push( layer.get('guid') );
				});

				//determine currently enabled map layers
				var updateEnabled = [];
				this.state.wmsLayerDefinitions.getFlatList().forEach( layerDefinition => {
					if (layerDefinition.enabled) updateEnabled.push( layerDefinition.layer.get('guid') );
				});

				//add any newly-enabled to map
				updateEnabled.forEach( layerGuid => {
					if (existingEnabled.indexOf(layerGuid) === -1) {
						this.state.wmsLayersGroup.getLayers().push( this.state.wmsLayerDefinitions.getByGuid(layerGuid).layer );
					}
				});

				//remove any no-longer enabled from map
				existingEnabled.forEach( layerGuid => {
					if (updateEnabled.indexOf(layerGuid) === -1) {
						this.state.wmsLayersGroup.getLayers().remove( this.state.wmsLayerDefinitions.getByGuid(layerGuid).layer );
					}
				});

			}

		// MAP FEATURES - updates only if respective Immutable data structure has been changed

			// snap to features (when selecting routing start and end points)
			if ( prevState.snapToFeatures !== this.state.snapToFeatures ) {
				console.log('map componentDidUpate snapToFeatures' );
				this.state.snapToLayer.setSource(
					new ol.source.Vector({
						features: [].concat.apply( [], this.state.snapToFeatures.valueSeq().toArray() ), //flatten routing features into single array
						wrapX: false
					})
				);
			}

			// route features (routes returned from routing)
			if ( prevState.routes !== this.state.routes ) {
				console.log('map componentDidUpate routes' );
				this.state.routesLayer.setSource(
					new ol.source.Vector({
						features: [].concat.apply( [], this.state.routes.valueSeq().toArray() ), //flatten routing features into single array
						wrapX: false
					})
				);
			}

			// highlighted route features (routes hovered orselected from discovered routes list)
			if ( prevState.highlightedRoutes !== this.state.highlightedRoutes ) {
				console.log('map componentDidUpate highlightedRoutes' );

				this.state.highlightedRoutesLayer.setSource(
					new ol.source.Vector({
						features: [].concat.apply( [], this.state.highlightedRoutes.valueSeq().toArray() ), //flatten routing features into single array
						wrapX: false
					})
				);

				// dim base routing features if highlighted features are present
				if ( this.state.highlightedRoutes.size > 0 ) {
					this.state.routesLayer.setOpacity( .40 );
					this.state.snapToLayer.setOpacity( .40 );
				} else {
					this.state.routesLayer.setOpacity( 1 );
					this.state.snapToLayer.setOpacity( 1 );
				}

			}

	}

	handleMapClick(event) {

		// ROUTING
		if (this.props.routingState.state === 'selecting') {

			var clickedPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.library.to4326(this.state.map.getCoordinateFromPixel(event.pixel)) ) );

			Actions.setRoutingCoord( clickedPointWkt );

		}

	}

	handleMapPointerMove(event) {

		//memoise to function for quick access
		this.handleMapPointerMove.geoJsonParser = this.handleMapPointerMove.geoJsonParser || new ol.format.GeoJSON();
		this.handleMapPointerMove.requestOut = this.handleMapPointerMove.requestOut || false;

		//Finds closest point or single route between two points if
		if (this.props.routingState.state === 'selecting') {

			//check to make sure request has not already been dispatched to server (prevents flooding of server with requests)
			if (this.handleMapPointerMove.requestOut) return

			this.handleMapPointerMove.requestOut = true;
			var hoveredPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.library.to4326(this.state.map.getCoordinateFromPixel(event.pixel)) ) );

			//prepare request based on if retrieving closest point or requesting single route
			var urlSuffix;
			var routingRequestBody;
			if (!this.props.routingState.startCoord) {
				routingRequestBody = { startCoord: hoveredPointWkt };
				urlSuffix = '/getClosestPoint/';
			} else {
				routingRequestBody = Object.assign( this.props.routingState , { endCoord: hoveredPointWkt } );
				urlSuffix = '/getRoute/';
			}

			//invoke routing requests from RouteStore - define callback to set returned features to snapToLayer
			Actions.executeRoutingRequest( routingRequestBody , urlSuffix , (err,res) => {

				var snapToFeatures = this.handleMapPointerMove.geoJsonParser.readFeatures( res.text, { featureProjection: 'EPSG:3857' } );

				this.handleMapPointerMove.requestOut = false;

				Actions.setSnapToFeatures( snapToFeatures );

			});

		}

		//highlight road scoring
		if (this.props.routingState.state === 'routing' || this.props.routingState.state === 'complete') {

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

	render () {

		//derive mapContainer className
		var className = "";
		if (this.props.layerControlVisible)  className += 'layerControlVisible ';
		if (this.props.routingState.state) className += 'routing-' + this.props.routingState.state;

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
					ref="routesListControl"
					routingState={this.props.routingState} />

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