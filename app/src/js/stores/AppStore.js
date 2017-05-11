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
                percentComplete: -1,
                step: -1,
                message: null,
                chartData: []
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
                endCoord: clickedPointWkt
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

    onSetRoutingState(desiredRoutingState) {

        var routingState = {};

        //handle cases where no desiredRoutingState is supplied - reset routing state
        if (!desiredRoutingState || typeof desiredRoutingState.state !== 'undefined' && !desiredRoutingState.state) {
            
            routingState = {
                state: false,
                startCoord: null,
                endCoord: null,
                percentComplete: -1,
                step: -1,
                message: null,
                chartData: []
            };

        //if setting by step (happens via routing status updates from backend; takes priority)
        } else if ( typeof desiredRoutingState.step !== 'undefined' ) {

            var percentComplete = this.state.routing.percentComplete;

            if (desiredRoutingState.step == 2) {
                percentComplete = 10 + ( desiredRoutingState.count[0] * (20/25) );
            } else if (desiredRoutingState.step == 3) {
                percentComplete +=  Math.floor(Math.random() * 8) + 2 ;
            }  
            
            //check for ERRORS or COMPLETION from backend - update frontend UI 
            if (desiredRoutingState.step === 4 || desiredRoutingState.step === -1) {
                percentComplete = 100;
                Actions.setSnapToFeatures([]);
            } else if (percentComplete >= 100) percentComplete = 95; //make sure we dont jump ahead too much

            routingState = Object.assign( {} , this.state.routing , {
                state: desiredRoutingState.state || this.state.routing.state, //attach state from backend if present
                percentComplete: percentComplete,
                step: desiredRoutingState.step,
                message: desiredRoutingState.message
            });

        //if setting by state (happens via UI interactions)
        } else if ( !!desiredRoutingState.state ) {

            //update to selecting state
            if (desiredRoutingState.state === 'selecting') {
                
                routingState = Object.assign( {} , this.state.routing , {
                    state: 'selecting',
                    startCoord: null,
                    endCoord: null,
                    percentComplete: -1,
                    step: -1,
                    message: null,
                    chartData: []
                });

            //update to routing state
            } else if (desiredRoutingState.state === 'routing') {

                routingState = Object.assign( {} , this.state.routing , {
                    state: 'routing',
                    percentComplete: 10,
                    step: -1,
                    message: null,
                    chartData: []
                });

            }

        }

        //accumulate routing convergence data for each generation
        if ( desiredRoutingState && !!desiredRoutingState.step && ( desiredRoutingState.step === 3 || desiredRoutingState.step === 4 ) && desiredRoutingState.fitness.length === 3  ) {
            // get immutable (new) instance of chart data OR new instance array
            var chartData = (!!this.state.routing && this.state.routing.chartData && this.state.routing.chartData.length) ? [].concat(this.state.routing.chartData) : [] ;
            chartData.push( { name: desiredRoutingState.fitness[0] , best: desiredRoutingState.fitness[1] , avg: desiredRoutingState.fitness[2]} );
            routingState.chartData = chartData;
        }

        this.setState({
            routing: routingState
        });

    }

}

module.exports = AppStore;