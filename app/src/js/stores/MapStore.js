import Reflux from 'reflux';

import io from 'socket.io-client';
import ol from 'openlayers';

import WmsLayerDefinitions from '../objects/WmsLayerDefinitions.js';

import Actions from '../actions/actions.js';

class MapStore extends Reflux.Store {

    constructor() {

        super();
    
        //listenables
        this.listenables = Actions;

        //set default app state
        this.state = {
            wmsLayerDefinitions: new WmsLayerDefinitions()
        };

    }

    onUpdateMapWmsLayerDefinitions(args, guid) {
        
        // no guid supplied on initial population of wmsLayerDefinitions at app start - treat as complete overwrite
        if (typeof guid === 'undefined') {
            
            this.setState( Object.assign( this.state , { wmsLayerDefinitions: args } ) );
        
        // guid will be supplied in operation to toggle WMS layer visibility
        } else {

            this.state.wmsLayerDefinitions.toggleLayerVisibility(guid);

            this.trigger(this.state);

        }
    }

}

module.exports = MapStore;
