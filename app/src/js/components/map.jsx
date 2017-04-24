import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import uuid from 'uuid';
import request from 'superagent';

import AppStore from '../stores/AppStore.js';
import RouteStore from '../stores/RouteStore.js';
import Actions from '../actions/actions.js';

import LayerControl from '../components/layerControl.jsx';
import RouteControl from '../components/routeControl.jsx';
import RerunControl from '../components/rerunControl.jsx';
import ClearControl from '../components/clearControl.jsx';
import RoutesListControl from '../components/routesListControl.jsx';

//open layers and styles
var ol = require('openlayers');
require('openlayers/css/ol.css');

class Map extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		//register AppState store
		this.store = AppStore;
		
		//register RouteStore updates
		this.mapStoreToState( RouteStore, this.handleRouteStoreUpdate.bind(this) );

		this.clearRoutesLayer = this.clearRoutesLayer.bind(this);
		this.getFeatureStyle = this.getFeatureStyle.bind(this);
		this.executeRoutingRequest = this.executeRoutingRequest.bind(this);
		this.getHighlightedFeatureStyle = this.getHighlightedFeatureStyle.bind(this);
		this.retrieveWmsMapLayers = this.retrieveWmsMapLayers.bind(this);
		this.getWmsLayerDefinitionsFlat = this.getWmsLayerDefinitionsFlat.bind(this);
		this.getWmsLayerDefinitionsByGuid = this.getWmsLayerDefinitionsByGuid.bind(this);

	}

	componentDidMount() {

		var routesLayer = new ol.layer.Vector({
			//style: this.getFeatureStyle,
			source: new ol.source.Vector({
				features:[],
				wrapX: false
			})
		});

		var highlightedRoutesLayer = new ol.layer.Vector({
			style: this.getFeatureStyle,
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
				this.refs.rerunControl.control,
				this.refs.clearControl.control,
				this.refs.routesListControl.control
			])
		});

		map.on('click', this.handleMapClick.bind(this));
		map.on('pointermove', this.handleMapPointerMove.bind(this));

		Actions.setMapState({ 
			map: map,
			wmsLayersGroup: wmsLayersGroup,
			layerControlVisible: false,
			routesLayer: routesLayer,
			highlightedRoutesLayer: highlightedRoutesLayer,
			snapToLayer: snapToLayer,
			wmsLayerDefinitions: {},
			context: this
		});

		//retrieve wms map layers
		this.retrieveWmsMapLayers();

	}

	componentDidUpdate(prevProps, prevState) {

		//RECONCILE IF wmsMapLayers has been updated

	    	//console.log('map componentDidUpdate');

			var existingEnabled = [];
			var existingDisabled = [];
			this.state.map.wmsLayersGroup.getLayers().getArray().forEach( layer => {
				existingEnabled.push( layer.get('guid') );
			});

			var updateEnabled = [];
			var updateDisabled = [];
			Object.keys(this.getWmsLayerDefinitionsFlat()).forEach( layerDefinitionKey => {
				var layerDefinition = this.getWmsLayerDefinitionsByGuid(layerDefinitionKey);
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
					this.state.map.wmsLayersGroup.getLayers().push( this.state.map.wmsLayerDefinitions[layerGuid].layer );
				}
			});

			updateDisabled.forEach( layerGuid => {
				if (existingEnabled.indexOf(layerGuid) != -1) {
					this.state.map.wmsLayersGroup.getLayers().remove( this.state.map.wmsLayerDefinitions[layerGuid].layer );
				}
			});

	}

    getWmsLayerDefinitionsFlat() {
        
        var returnDefinitions= {};

        var recurseWmsLayerDefinition = function ( wmsLayerDef ) {
            returnDefinitions[ wmsLayerDef.name ] = wmsLayerDef;
            wmsLayerDef.children.forEach( childWmsLayerDef => recurseWmsLayerDefinition(childWmsLayerDef) );
        }

        //recurse through chilren @ root
        if (this.state.map.wmsLayerDefinitions.children) this.state.map.wmsLayerDefinitions.children.forEach( wmsLayerDef => recurseWmsLayerDefinition( wmsLayerDef ) );

        return returnDefinitions;
    }

    getWmsLayerDefinitionsByGuid(wmsGuid) {
    	var flatWmsLayers = this.getWmsLayerDefinitionsFlat();
    	var layerNeedle = false;
    	Object.values(flatWmsLayers).forEach( layerDefinition => {
    		if (!!layerNeedle) return;
    		if (layerDefinition.name === wmsGuid) layerNeedle = layerDefinition;
    	});
    	return layerNeedle;
    }

	retrieveWmsMapLayers() {

		var DOMParser = global.DOMParser = require('xmldom').DOMParser;
		var WMSCapabilities = require('wms-capabilities');

		request.get( 'http://costia.gritto.net:8880/geoserver/ows?service=wms&version=1.1.1&request=GetCapabilities' )
			.set('Accept', 'application/xml')
			.end( (err, res) => {
	
				var getCapabilitiesObj = new WMSCapabilities(res.text).toJSON();
				var capabilityLayers = getCapabilitiesObj.Capability.Layer.Layer;

				var layersTree = {
					isRoot: true,
					enabled: false,
					layer: null,
					children: []
				}

				capabilityLayers.forEach( layerNode => this.recurseWmsMapLayers(layersTree, layerNode) );

				console.log( 'recieved wms layers:', layersTree );

				Actions.updateMapWmsLayerDefinitions(layersTree);

			});

	}

	recurseWmsMapLayers(parentNode, layerNode) {

		//assemble layer information into OL layer object
		var olLayer = new ol.layer.Tile({
			extent: [ layerNode.BoundingBox[0].extent[0] , layerNode.BoundingBox[0].extent[1] , layerNode.BoundingBox[0].extent[2] , layerNode.BoundingBox[0].extent[3] ],
			source: new ol.source.TileWMS(({
				url: 'http://costia.gritto.net:8880/geoserver/route/wms',
				params: {'LAYERS': layerNode.Name , 'TILED': true},
				serverType: 'geoserver'
			})),
			guid: layerNode.Name || layerNode.Title,
			children: []
		});

		var currentNewLayerNode = {
			enabled: false,
			name: layerNode.Name || layerNode.Title,
			title: layerNode.Title || layerNode.Name,
			layer: olLayer,
			children: []
		};

		//recurse into child layers
		if (layerNode.Layer && layerNode.Layer.length > 0) {
			layerNode.Layer.forEach( childLayerNode => this.recurseWmsMapLayers( currentNewLayerNode , childLayerNode ) );
		}

		parentNode.children.push( currentNewLayerNode );

	}

	clearRoutesLayer(args) {

		// base routes

		if (!args || (args && args.indexOf(0) > -1) ) {

			this.state.map.map.removeLayer( this.state.map.routesLayer );

			this.state.map.routesLayer = new ol.layer.Vector({
				//style: this.getFeatureStyle,
				source: new ol.source.Vector({
					features:[],
					wrapX: false
				})
			});

			this.state.map.map.addLayer( this.state.map.routesLayer );

		}

		// highlighted routes

		if (!args || (args && args.indexOf(1) > -1) ) {

			this.state.map.map.removeLayer( this.state.map.highlightedRoutesLayer );

			this.state.map.highlightedRoutesLayer = new ol.layer.Vector({
				style: this.getHighlightedFeatureStyle,
				source: new ol.source.Vector({
					features:[],
					wrapX: false
				})
			});

			this.state.map.map.addLayer( this.state.map.highlightedRoutesLayer );

		}

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
			this.state.config.roadScoringProperties.forEach( metricName => {
				
				if (containScoringPriotization) return;
				
				if ( metricName === 'score_highway') {
					if ( feature.get( 'score_highway' ) === '1.0' ) containScoringPriotization = true;
				}
				else if ( typeof feature.get( metricName ) !== 'undefined' ) containScoringPriotization = true;

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

			this.state.map.routesLayer.getSource().addFeatures( args.features );

		} else if (args.type === 'routeStart') {

			this.clearRoutesLayer()

		} else if (args.type === 'highlightedRoutes') {

			//clear only highlightedRoutesLayer
			this.clearRoutesLayer([1]);

			//loop through supplied features and add highlight flag
			Object.values(args.routes).forEach( route => {
				this.state.map.highlightedRoutesLayer.getSource().addFeatures( route.features );
			});

			//if highlight features are present, dim base features layer
			if ( this.state.map.highlightedRoutesLayer.getSource().getFeatures().length > 0 ) {
				this.state.map.routesLayer.setOpacity( .035 );
			} else this.state.map.routesLayer.setOpacity( 1 );

		}

	}

	executeRoutingRequest(routingRequestBody) {

		//derive routing REST endpoint from webappConfig
		var routingRestEndpointUrl = this.state.config.routingRestEndpoint.protocol + '://' + this.state.config.routingRestEndpoint.host + ':' + this.state.config.routingRestEndpoint.port + '/' + this.state.config.routingRestEndpoint.path + '/getRoutesRandom/';

		request.post( routingRestEndpointUrl )
			.send( routingRequestBody )
			.set('Accept', 'application/json')
			.end( (err, res) => {
	
				//complete routing sequence
				Actions.completeRouting();
				this.state.map.snapToLayer.getSource().clear();				

			});

		Actions.submitRouting( routingRequestBody );

	}

	handleMapClick(event) {

		//console.log(this.state.map.map.getView().getCenter(), this.state.map.map.getView().getZoom());
		
		// ROUTING
		if (this.state.routing.state === 'selecting') {

			var clickedPointWkt = (new ol.format.WKT()).writeGeometry( new ol.geom.Point( this.to4326(this.state.map.map.getCoordinateFromPixel(event.pixel)) ) );

			if (!this.state.routing.startCoord) this.state.routing.startCoord = clickedPointWkt;
			else {
				
				this.state.routing.endCoord = clickedPointWkt;

				var routingRequestBody = Object.assign( {}, this.state.routing , { datetime: (new Date()).toISOString() , guid: uuid.v1() } );

				this.executeRoutingRequest( routingRequestBody );

			}

			return;

		}

	}

	handleMapPointerMove(event) {

		// ROUTING
		
		if (this.state.routing.state === 'selecting') {

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

		//highlight road scoring
		

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
		if (this.state.map.layerControlVisible)  className += 'layerControlVisible ';
		if (this.state.routing.state === 'selecting') className += ' routingSelecting ';

		return (

			<div>

				<div ref="mapContainer" id="mapContainer" className={ className } >
				</div>

				<LayerControl
					ref="layerControl" 
					layerDefinitions={ (!!this.state.map) ? this.state.map.wmsLayerDefinitions : {} }
					isVisible={ (!!this.state.map) ? this.state.map.layerControlVisible : false }
					getWmsLayerDefinitionsByGuid={this.getWmsLayerDefinitionsByGuid}
					getWmsLayerDefinitionsFlat={this.getWmsLayerDefinitionsFlat} />

				<RouteControl 
					ref="routeControl" 
					routing={this.state.routing} />
					
				<RoutesListControl 
					ref="routesListControl" />

				<RerunControl
					ref="rerunControl" />

				<ClearControl 
					ref="clearControl" />

			</div>

		);
		
	}
}

module.exports = Map;