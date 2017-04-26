import Reflux from 'reflux';
import request from 'superagent';

import io from 'socket.io-client';
import ol from 'openlayers';

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
        socket.on( 'newBestScore' , (message) => {

            var messageJson = JSON.parse(message);

            this.onHighlightRoutes( [messageJson.routeSequence] )

            //console.log('newBestScore recieved: ' + messageJson.routeSequence);

        });

        //set default app state
        this.state = {
            routingConfig: {
                modalVisible: false,
                population: 550,
                scoring: { }
            },
            socket: socket,
            routes: {},
            highlightedRoutes: {}
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
        } else console.log( 'omitting spindles from routesStore' );

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

    onSetRoutingConfigParameters(args) {

        this.setState({
            routingConfig: Object.assign( this.state.routingConfig , { scoring: args } )
        })

    }

}

module.exports = RouteStore;