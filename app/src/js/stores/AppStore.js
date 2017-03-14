import Reflux from 'reflux';
import request from 'superagent';

import Actions from '../actions/actions.js';

class AppStore extends Reflux.Store {

    constructor() {

        super();
    
        //listenables
        this.listenables = Actions;

        //set default app state
        this.state = {
        	config: {},
			routing: {
				active: false,
				startCoord: null,
				endCoord: null,
                percentComplete: -1
			}
        }

        //load webappConfig from backend (contains things like routing REST endpoint, etc.)
        request.get('/config.json')
            .set('Accept', 'application/json')
            .end( (err, res) => {
                this.setState({
                    config: Object.assign( {} , this.state.config , res.body )
                });
                console.log( 'config loaded from backend:' , this.state.config );
            });

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