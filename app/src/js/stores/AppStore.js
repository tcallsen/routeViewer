import Reflux from 'reflux';

//var Actions = Reflux.createActions(['firstAction', 'secondAction']);

class AppStore extends Reflux.Store {
    
    constructor() {
        console.log( 'AppStore constructor' );
        super();
        this.state = {
        	DOM: {},
			routing: {
				active: false,
				startCoord: null,
				endCoord: null
			},
			map: {
				map: null,
				routesLayer: null,
				routes: []
			}
        }
        //this.listenTo(statusUpdate, this.onStatusUpdate); // listen to the statusUpdate action
    }

    /* onStatusUpdate(status) {
        var newFlag = status ? 'ONLINE' : 'OFFLINE';
        this.setState({flag:newFlag});
    } */

}

module.exports = AppStore;