import Reflux from 'reflux';
import request from 'superagent';

import Actions from '../actions/actions.js';

class AppStore extends Reflux.Store {

    constructor() {

        super();
    
        //listenables
        this.listenables = Actions;

        //load webappConfig from backend (contains things like routing REST endpoint, etc.)
        request.get('/config.json')
            .set('Accept', 'application/json')
            .end( (err, res) => {
                this.setState({
                    config: Object.assign( {} , this.state.config , res.body )
                });
                Actions.setRoutingConfigParameters( res.body.roadScoringProperties );
                console.log( 'config loaded from backend:' , this.state.config );
            });

        //set default app state
        this.state = {
            config: {},
            routing: {
                state: false,
                startCoord: null,
                endCoord: null,
                percentComplete: -1
            },
            map: {
                wmsLayerDefinitions: []
            }
        };

    }

    onSetMapState(args) {
        this.setState({
            map: args
        });
    }

    onUpdateMapWmsLayerDefinitions(args, guid) {
        if (typeof guid == 'undefined') {
            this.setState({
                map: Object.assign( this.state.map , { wmsLayerDefinitions: args } )
            });
        } else {
            var updatedMapLayerDefinitions = this.state.map.wmsLayerDefinitions;
            var updateMapLayerDefinition = this.state.map.context.getWmsLayerDefinitionsByGuid(guid);
            Object.keys(args).forEach( argKey => {
                if (argKey === 'layer') console.log("WARNING - trying to update layer property on wmsLayerDefinitions - may lose track of layer obj reference in map!!")
                updateMapLayerDefinition[argKey] = args[argKey];
            });
            updatedMapLayerDefinitions[guid] = updateMapLayerDefinition;
            this.setState({
                map: Object.assign( this.state.map , { wmsLayerDefinitions: updatedMapLayerDefinitions } )
            });
        }
    }

    onToggleMapControlVisibility(forceVisibility) {

        if (typeof forceVisibility !== 'undefined') {

            // SET per forceVisibility
            
            this.setState({
                map: Object.assign( this.state.map , { layerControlVisible: forceVisibility } )
            });

        } else if (this.state.map.layerControlVisible ) {

            // HIDE layers

            this.setState({
                map: Object.assign( this.state.map , { layerControlVisible: !this.state.map.layerControlVisible } )
            });

        } else {

            // SHOW layers

            this.setState({
                map: Object.assign( this.state.map , { layerControlVisible: !this.state.map.layerControlVisible } )
            });

        }

    }

    onClearRoutes(args) {
        this.state.map.context.clearRoutesLayer();
        this.setState({
            routing: {
                state: false,
                startCoord: null,
                endCoord: null,
                percentComplete: -1
            }
        });
    }

    onToggleRoutingUI() {

        if (this.state.routing.state != false && this.state.routing.state != 'complete') {

            this.setState({
                routing: {
                    state: false,
                    startCoord: null,
                    endCoord: null,
                    percentComplete: -1
                }
            });

        } else {

            //hide layers list
            Actions.toggleMapControlVisibility(false);

            this.setState({
                routing: {
                    state: 'selecting',
                    startCoord: null,
                    endCoord: null,
                    percentComplete: -1
                }
            });

            this.state.map.context.clearRoutesLayer();

        }

    }

    onSubmitRoutingUI() {
        this.setState({
            routing: {
                state: 'routing',
                startCoord: null,
                endCoord: null,
                percentComplete: 10
            }
        });
    }

    onRerunPreviousRoutingRequest() {
        this.onSubmitRoutingUI();
    }

    onCompleteRoutingUI() {
        
        this.state.map.snapToLayer.getSource().clear();

        this.setState({
            routing: {
                state: 'complete',
                startCoord: null,
                endCoord: null,
                percentComplete: 100
            }
        });
    }

}

module.exports = AppStore;