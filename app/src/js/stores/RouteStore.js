import Reflux from 'reflux';
import request from 'superagent';

import io from 'socket.io-client';
import ol from 'openlayers';
import uuid from 'uuid';

import AppStore from './AppStore.js';

import Actions from '../actions/actions.js';

class RouteStore extends Reflux.Store {

    constructor() {

        super();
    
        //listenables
        this.listenables = Actions;

        // web socket to routes.json
        var socket = io();
        socket.on('connect', function(){
            console.log('socket connceted');
        });

        socket.on( 'newRoute' , this.appendNewRoute.bind(this) );
        socket.on( 'newStatus' , this.processNewStatus.bind(this) );
        socket.on( 'newBestScore' , (message) => {

            var messageJson = JSON.parse(message);

            //this.onHighlightRoutes( [messageJson.routeSequence] )

            //console.log('newBestScore recieved: ' + messageJson.routeSequence);

        });

        //set default app state
        this.state = {
            routingConfig: {
                modalVisible: false,
                scoring: { }
            },
            previousRoutingRequest: null,
            socket: socket,
            routes: {},
            highlightedRoutes: {},
            snapToFeatures: {}
        };

    }

    onSetRoutingState(desiredState) {
        //reset routes if user is no longer routing or is restarting routing (this will clear routes from map / UI)
        if (!desiredState || desiredState === 'selecting' || desiredState === 'routing') {
            this.setState({
                routes: {},
                snapToFeatures: {}
            });
        } 
    }


    processNewStatus(status) {
        Actions.updateRoutingBackendStatus( JSON.parse(status) );
    }

    appendNewRoute(route) {

        //memoise to function for quick access
        this.appendNewRoute.geoJsonParser = this.appendNewRoute.geoJsonParser || new ol.format.GeoJSON();

        //parse route features into OpenLayers feature
        var routeFeatures = this.appendNewRoute.geoJsonParser.readFeatures( route , { featureProjection: 'EPSG:3857' } );

        //establish route identifier (usually based on routeSequence from backend, however routing spindles do not have a routeSequence)
        var routeIdentifier = ( typeof routeFeatures[0].get('routeSequence') !== 'undefined' ) ? routeFeatures[0].get('routeSequence') : 'spindle' ;

        //save features to RouteStore state at routeSequence and communicate out to UI
        var routes = this.state.routes;
        routes[ routeIdentifier ] = routeFeatures;
        this.setState({
            routes: routes
        });

    }

    onHighlightRoutes(highlightedRouteSequences) {

        this.setState.highlightedRoutes = highlightedRoutes;
        
        var highlightedRoutes = {};
        highlightedRouteSequences.forEach( highlightedRouteSequence => {
            highlightedRoutes[highlightedRouteSequences] = this.state.routes[highlightedRouteSequences]
        });

        // trigger recieved route down to components
        this.trigger({
            type: 'highlightedRoutes',
            routes: highlightedRoutes
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
        Actions.setRoutingState('routing');

    }

    onSetSnapToFeatures(snapToFeatures) {
        this.setState({
            snapToFeatures: this.featureArrayToObject( snapToFeatures )
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

    featureArrayToObject( features , property = 'id' ) {
        var featuresObject = {};
        features.forEach( feature => {
            featuresObject[feature.get(property)] = feature;
        });
        return featuresObject;
    }

}

module.exports = RouteStore;