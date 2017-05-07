import Reflux from 'reflux';
import request from 'superagent';
import uuid from 'uuid';

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
            layerControlVisible: false,
        };

    }

    onSetRoutingCoord( clickedPointWkt ){

        // set initial routing coord if none are present
        if (!this.state.routing.startCoord) {
            
            this.setState({
                routing: Object.assign( this.state.routing , { startCoord: clickedPointWkt } )
            });
        
        // initiate full routing request if first routing coord already set
        } else {
            
            //generate next routing state comeplete with routing coords and state updated
            var nextRoutingState = Object.assign( this.state.routing , {
                state: 'routing',       //would be handled in call to Actions.setRoutingState('routing')
                percentComplete: 10,    //would be handled in call to Actions.setRoutingState('routing')
                endCoord: clickedPointWkt,
                datetime: (new Date()).toISOString(), 
                guid: uuid.v1()
            });

            //set state to store, which will update UI
            this.setState({
                routing: nextRoutingState
            });

            //execute routing request through RouteStore
            Actions.executeRoutingRequest( nextRoutingState , '/getRoutesRandom/' );

        }

    }

    onToggleMapControlVisibility(forceVisibility) {

        if (typeof forceVisibility !== 'undefined') {

            // SET per forceVisibility
            
            this.setState(Object.assign( this.state , { layerControlVisible: forceVisibility } ) );

        } else {

            // TOGGLE layers

            this.setState(Object.assign( this.state , { layerControlVisible: !this.state.layerControlVisible } ) );

        }

    }

    onClearRoutes(args) {
        this.setState({
            routing: {
                state: false,
                startCoord: null,
                endCoord: null,
                percentComplete: -1
            }
        });
    }

    onSetRoutingState(desiredState) {

        var routingState = {};

        //determine current state, or accept forceState
        if (typeof desiredState !== 'undefined') {

            //reset routing to initial statae
            if (desiredState === false) {
                
                routingState = {
                    state: false,
                    startCoord: null,
                    endCoord: null,
                    backendStatus: null,
                    percentComplete: -1
                };
            
            //update to selecting state
            } else if (desiredState === 'selecting') {
                
                routingState =  {
                    state: 'selecting',
                    startCoord: null,
                    endCoord: null,
                    backendStatus: (!!this.state.routing.backendStatus) ? this.state.routing.backendStatus : null,
                    percentComplete: -1
                };

            //update to routing state
            } else if (desiredState === 'routing') {
                
                routingState =  {
                    state: 'routing',
                    startCoord: (!!this.state.routing.startCoord) ? this.state.routing.startCoord : null ,
                    endCoord: (!!this.state.routing.endCoord) ? this.state.routing.endCoord : null ,
                    backendStatus: (!!this.state.routing.backendStatus) ? this.state.routing.backendStatus : null,
                    percentComplete: 10
                };

            }

        }

        this.setState({
            routing: routingState
        });

    }

    onRerunPreviousRoutingRequest() {
        this.onSetRoutingState('routing');
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

                Actions.clearMapLayerSource('snapToLayer');

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