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

        socket.on( 'routestart' , this.processRouteStart.bind(this) );
        socket.on( 'routeend' , this.processRouteEnd.bind(this) );
        socket.on( 'newRoute' , this.processNewRoute.bind(this) );
        socket.on( 'newStatus' , this.processNewStatus.bind(this) );
        socket.on( 'newBestScore' , (message) => {

            var messageJson = JSON.parse(message);

            this.onHighlightRoutes( [messageJson.routeSequence] )

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
            snapToRoutes: {}
        };

    }

    processRouteStart(requestGuid) {

        this.state.routes = [];

        // trigger recieved route down to components
        this.trigger({
            type: 'routeStart',
            requestGuid: requestGuid
        });
        
    }

    processRouteEnd(requestGuid) {

        // trigger recieved route down to components
        this.trigger({
            type: 'routeEnd',
            requestGuid: requestGuid,
            routes: this.state.routes
        });

    }

    processNewStatus(status) {
        Actions.updateRoutingBackendStatus( JSON.parse(status) );
    }

    processNewRoute(route) {

        //parse route into OpenLayers feature
        var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }
        var routeFeatures = geoJsonParser.readFeatures( route , { featureProjection: 'EPSG:3857' } );

        var routeSequence = routeFeatures[0].get('routeSequence');

        //save route into local state
        if (typeof routeSequence !== 'undefined') {
            this.state.routes[routeSequence] = {
                features: routeFeatures,
                json: route
            };
        }

        // trigger recieved route down to components
        this.trigger({
            type: 'newRoute',
            routeSequence: routeSequence,
            features: routeFeatures
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
        this.onExecuteRoutingRequest( this.state.previousRoutingRequest.routingRequestBody , this.state.previousRoutingRequest.endpointAddition , this.state.previousRoutingRequest.callback );
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
                if (!!callback) callback(err, res);
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