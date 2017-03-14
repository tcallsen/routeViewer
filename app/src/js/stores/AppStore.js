import Reflux from 'reflux';
import request from 'superagent';

import io from 'socket.io-client';
import ol from 'openlayers';

import Actions from '../actions/actions.js';

class AppStore extends Reflux.Store {

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

            console.log('newRoute received; length: ', routeFeatures[0].get('routeSequence') );

            this.state.map.routesLayer.getSource().addFeatures( routeFeatures ); 

        });

        //load webappConfig from backend (contains things like routing REST endpoint, etc.)
        request.get('/config.json')
            .set('Accept', 'application/json')
            .end( (err, res) => {
                this.setState({
                    config: Object.assign( {} , this.state.config , res.body )
                });
                console.log( 'config loaded from backend:' , this.state.config );
            });

        //set default app state
        this.state = {
            config: {},
            routing: {
                active: false,
                startCoord: null,
                endCoord: null,
                percentComplete: -1
            },
            map: null,
            socket: socket
        };

    }

    onSetMapState(args) {
        this.setState({
            map: args
        });
    }

    onClearRoutes(args) {
        this.state.map.routesLayer.getSource().clear();
        this.state.map.snapToLayer.getSource().clear();
    }

    onToggleRouting() {

        if (this.state.routing.active) {

            this.setState({
                routing: {
                    active: false,
                    startCoord: null,
                    endCoord: null,
                    percentComplete: -1
                }
            });

        } else {

            this.setState({
                routing: {
                    active: true,
                    startCoord: null,
                    endCoord: null,
                    percentComplete: -1
                }
            });

        }

    }

    onSubmitRouting() {
        this.setState({
            routing: {
                active: false,
                startCoord: null,
                endCoord: null,
                percentComplete: 10
            }
        });
    }

    onCompleteRouting() {
        this.setState({
            routing: {
                active: false,
                startCoord: null,
                endCoord: null,
                percentComplete: 100
            }
        });
    }

}

module.exports = AppStore;