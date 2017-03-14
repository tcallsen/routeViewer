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

        socket.on('newRoute', (route) => {

            var geoJsonParser = new ol.format.GeoJSON(); //{ featureProjection: 'EPSG:4326' }

            var routeFeatures = geoJsonParser.readFeatures( route , { featureProjection: 'EPSG:3857' } );

            console.log('recieved routeSequence: ', routeFeatures[0].get('routeSequence') );

            // trigger recieved route down to components
            this.trigger({
                type: 'newRoute',
                features: routeFeatures
            });

        });

        //set default app state
        this.state = {
            socket: socket,
            routes: {}
        };

    }

}

module.exports = RouteStore;