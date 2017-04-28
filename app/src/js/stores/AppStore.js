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
                backendStatus: null,
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

        if (this.state.routing.state != false && this.state.routing.state != 'complete' && this.state.routing.state != 'failed') {

            this.setState({
                routing: {
                    state: false,
                    startCoord: null,
                    endCoord: null,
                    backendStatus: null,
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
                    backendStatus: (!!this.state.routing.backendStatus) ? this.state.routing.backendStatus : null,
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
                backendStatus: (!!this.state.routing.backendStatus) ? this.state.routing.backendStatus : null,
                percentComplete: 10
            }
        });
    }

    onRerunPreviousRoutingRequest() {
        this.onSubmitRoutingUI();
    }

    onUpdateRoutingBackendStatus(routingStatus) {

        //confirm this message is most current, otherwise omit
        /* if (!!this.state.routing.backendStatus) { //sometimes reached before backendStatus has been saved
            var messageDate;
            if (routingStatus.time) {
                messageDate = new Date( routingStatus.time );
            }
            if (!!messageDate && this.state.routing.backendStatus.time && messageDate < this.state.routing.backendStatus.time) {
                console.log('dropping old message', routingStatus);
                return;
            } else routingStatus.time = messageDate;
        } */

        //update precent complete
        var percentComplete = this.state.routing.percentComplete;
        if (routingStatus.step) {
            
            if (routingStatus.step == 2) {
                percentComplete = 10 + ( routingStatus.count[0] * (20/25) );
            } else if (routingStatus.step == 3) {
                percentComplete +=  Math.floor(Math.random() * 8) + 2 ;
            }  
            
            //check for ERRORS or COMPLETION from backend - update frontend UI 
            if (routingStatus.step === 4 || routingStatus.step === -1) {

                this.state.map.snapToLayer.getSource().clear();

                percentComplete = 100;
            
            } else if (percentComplete >= 100) percentComplete = 95; //make sure we dont jump ahead too much
        
        }

        //accumulate routing convergence data for each generation
        if ( ( routingStatus.step === 3 || routingStatus.step === 4 ) && routingStatus.fitness.length === 3  ) {
            // get immutable (new) instance of chart data OR new instance array
            var chartData = (!!this.state.routing.backendStatus && this.state.routing.backendStatus.chartData) ? [].concat(this.state.routing.backendStatus.chartData) : [ ] ;
            chartData.push( { name: routingStatus.fitness[0] , best: routingStatus.fitness[1] , avg: routingStatus.fitness[2]} );
            routingStatus.chartData = chartData;
        }

        this.setState({
            routing: Object.assign( this.state.routing , { backendStatus: routingStatus , percentComplete: percentComplete } , (routingStatus.step === 4 || routingStatus.step === -1) ? { state: (routingStatus.step !== -1) ? 'complete' : 'failed' , startCoord: null, endCoord: null, } : {} )
        });

    }

}

module.exports = AppStore;