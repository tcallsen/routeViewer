import Reflux from 'reflux';
import request from 'superagent';

import io from 'socket.io-client';
import ol from 'openlayers';
import uuid from 'uuid';

import AppStore from './AppStore.js';

import Actions from '../actions/actions.js';

const { Map, OrderedMap } = require('immutable');

class RouteStore extends Reflux.Store {

    constructor() {

        super();
    
        //listenables
        this.listenables = Actions;

        // web socket to routes.json
        var socket = io();

        //listener for new Routes & Geo Features sent over WekSocket
        socket.on( 'FeatureCollection' , this.appendNewRoute.bind(this) );
        socket.on( 'newStatus' , this.processNewStatus.bind(this) );

        //set default app state
        this.state = {
            routingConfig: {
                modalVisible: false,
                scoring: { }
            },
            previousRoutingRequest: null,
            socket: socket,
            routes: new OrderedMap(),
            highlightedRoutes: new Map(),
            snapToFeatures: new Map()
        };

    }

    onSetRoutingState(desiredRoutingState) {
        //reset routes if user is no longer routing or is restarting routing (this will clear routes from map / UI)
        if (!desiredRoutingState || desiredRoutingState.state === 'selecting' || desiredRoutingState.state === 'routing') {
            this.setState({
                snapToFeatures: new Map(),
                routes: new OrderedMap(),
                highlightedRoutes: new Map()
            });
        } 
    }

    processNewStatus(status) {
        Actions.setRoutingState( JSON.parse(status) );
    }

    appendNewRoute(route) {

        //memoise to function for quick access
        this.appendNewRoute.geoJsonParser = this.appendNewRoute.geoJsonParser || new ol.format.GeoJSON();

        //parse route features into OpenLayers feature
        var routeFeatures = this.appendNewRoute.geoJsonParser.readFeatures( route , { featureProjection: 'EPSG:3857' } );

        //establish route identifier (usually based on routeSequence from backend, however routing spindles do not have a routeSequence)
        var routeIdentifier = ( typeof routeFeatures[0].get('routeSequence') !== 'undefined' ) ? routeFeatures[0].get('routeSequence') : 'spindle' ;

        //save route features to Immutabale data structure in state at key routeSequence and communicate out to UI
        var routes = this.state.routes;
        routes = routes.set( routeIdentifier , routeFeatures );

        this.setState({
            routes: routes
        });

        //hack for highlighting route - need to delay so that route is available in store prior to highlighting
        if (routeIdentifier !== 'spindle') {
            setTimeout( () => {
                this.onHighlightRoutes([routeIdentifier]);
            },250);
        }

    }

    onHighlightRoutes(highlightedRouteSequences) {

        var highlightedRoutes = this.state.highlightedRoutes;

        //remove any routes that are no longer highlighted
        highlightedRoutes.keySeq().forEach( previouslyHighlightRouteSequence => {
            if ( highlightedRouteSequences.indexOf( previouslyHighlightRouteSequence ) == -1 ) {
                highlightedRoutes = highlightedRoutes.delete( previouslyHighlightRouteSequence );
            }
        });

        //add any newly highlighted routes
        highlightedRouteSequences.forEach( highlightedRouteSequence => {
            if ( !highlightedRoutes.has(highlightedRouteSequence) ) {
                highlightedRoutes = highlightedRoutes.set( highlightedRouteSequence , this.state.routes.get(highlightedRouteSequence) );
            }
        });

        this.setState({
            highlightedRoutes: highlightedRoutes
        });

    }

    onToggleRoutingSettingsVisibility() {

        this.setState({
            routingConfig: Object.assign( this.state.routingConfig , { modalVisible: !this.state.routingConfig.modalVisible } )
        });

    }

    onSetRoutingConfigParameters(scoringMetrics) {

        //add value property to each scoringMetric
        Object.values(scoringMetrics).forEach( metricDefinition => {
            metricDefinition.value = metricDefinition.default;
        });

        this.setState({
            routingConfig: Object.assign( this.state.routingConfig , { scoring: scoringMetrics } )
        });

    }

    onUpdateRouteScoringMetricValue(args) {

        var newScoringObject = this.state.routingConfig.scoring;

        //confirm change is valid
        var metricDefinition = newScoringObject[args.metricName];
        var proposedValue = (typeof metricDefinition.uiScale !== 'undefined') ? args.newValue / metricDefinition.uiScale : args.newValue / 100 ;
        
        if ( isNaN(proposedValue) || proposedValue > metricDefinition.range[1] || proposedValue < metricDefinition.range[0] ) return;
        
        //update model & ui
        metricDefinition.value = proposedValue;
        this.setState({
            routingConfig: Object.assign( this.state.routingConfig , { scoring: newScoringObject } )
        });

    }

    onRerunPreviousRoutingRequest() {
        
        //execute previously saved routing request
        this.onExecuteRoutingRequest( this.state.previousRoutingRequest.routingRequestBody , this.state.previousRoutingRequest.endpointAddition , this.state.previousRoutingRequest.callback );

        //update routing state and UI
        Actions.setRoutingState({ 
            state: 'routing'
        });

    }

    onSetSnapToFeatures(snapToFeatures) {
        
        //convert supplied snapToFeatures array into Immutable Map
        var featuresMap = new Map();
        snapToFeatures.forEach( feature => {
            featuresMap = featuresMap.set( feature.get('id') , feature )
        });

        this.setState({
            snapToFeatures: featuresMap
        });

    }

    onExecuteRoutingRequest(routingRequestBody, endpointAddition, callback) {

        //derive routing REST endpoint from webappConfig
        var routingRestEndpointUrl = AppStore.state.config.routingRestEndpoint.protocol + '://' + AppStore.state.config.routingRestEndpoint.host + ':' + AppStore.state.config.routingRestEndpoint.port + '/' + AppStore.state.config.routingRestEndpoint.path + endpointAddition;

        //append routingConfig to routingRequestBody - need new or immutable object here since original routingRequestBody us modified on Actions.setRoutingState()
        routingRequestBody = Object.assign( {} , routingRequestBody , {  
            routingConfig : this.state.routingConfig.scoring,
            datetime: (new Date()).toISOString(),
            guid: uuid.v1()
        });

        //place routing request to backend
        request.post( routingRestEndpointUrl )
            .send( routingRequestBody )
            .set('Accept', 'application/json')
            .end( (err, res) => {
                if (!!callback && res.ok) callback(err, res);
            });

        //if initiating full routing request, track previousRoutingRequest
        if (endpointAddition === '/getRoutesRandom/') {
            this.setState({
                previousRoutingRequest: {
                    routingRequestBody: routingRequestBody, 
                    endpointAddition: endpointAddition,
                    callback: callback
                }
            });
        }

    }

}

module.exports = RouteStore;