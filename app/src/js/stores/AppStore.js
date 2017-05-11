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
                scoringData: []
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
                percentComplete: 0,    //would be handled in call to Actions.setRoutingState('routing')
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
                scoringData: []
            };

        //if setting by step (happens via routing status updates from backend; takes priority)
        } else if ( typeof desiredRoutingState.step !== 'undefined' ) {

            routingState = Object.assign( {} , this.state.routing , {
                state: desiredRoutingState.state || this.state.routing.state, //attach state from backend if present
                percentComplete: desiredRoutingState.percentComplete || this.state.routing.percentComplete,
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
                    scoringData: []
                });

            //update to routing state
            } else if (desiredRoutingState.state === 'routing') {

                routingState = Object.assign( {} , this.state.routing , {
                    state: 'routing',
                    percentComplete: 10,
                    step: -1,
                    message: null,
                    scoringData: []
                });

            }

        }

        //accumulate routing data for each generation if present
        if ( !!desiredRoutingState && !!desiredRoutingState.scoringData ) {
            
            // populate generation level and population level scoring data into front end only data structure - need immutable structure (charting library will detect data change)
            var scoringData = (!!this.state.routing && this.state.routing.scoringData && this.state.routing.scoringData.length) ? [].concat(this.state.routing.scoringData) : [] ;
            
            //map backend data into re-charts accepted format
            var populationChartData = Object.values(desiredRoutingState.scoringData.population).map( popEntry => {
                return { length: popEntry[0] , score: popEntry[1] };
            });

            scoringData.push( { name: desiredRoutingState.scoringData.generation , best: desiredRoutingState.scoringData.bestFitness , avg: desiredRoutingState.scoringData.avgFitness , population: populationChartData } );
            routingState.scoringData = scoringData; 

        }

        //clear snap to features once routing is complete
        if (routingState.state === 'complete' || routingState.state === 'failed') {
            Actions.setSnapToFeatures([]);
        }

        console.log( 'percentComplete: ' , routingState.step , routingState.percentComplete );

        this.setState({
            routing: routingState
        });

    }

}

module.exports = AppStore;