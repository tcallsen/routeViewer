import Reflux from 'reflux';

import io from 'socket.io-client';
import ol from 'openlayers';

import AppStore from './AppStore.js';

import WmsLayerDefinitions from '../objects/WmsLayerDefinitions.js';

import Actions from '../actions/actions.js';

class MapStore extends Reflux.Store {

    constructor() {

        super();
    
        //listenables
        this.listenables = Actions;

        //retrieve wms map layers
        var wmsUrl = 'http://costia.gritto.net:8880/geoserver/ows?service=wms&version=1.1.1&request=GetCapabilities';

        //set default app state
        this.state = {
            wmsLayerDefinitions: new WmsLayerDefinitions(wmsUrl)
        };

    }

    onSetMapStoreReferences(args) {
        this.setState( Object.assign( this.state , args ) );
    }

    onUpdateMapWmsLayerDefinitions(args, guid) {
        if (typeof guid == 'undefined') {
            this.setState( Object.assign( this.state , { wmsLayerDefinitions: args } ) );
        } else {
            var updatedMapLayerDefinitions = this.state.wmsLayerDefinitions;
            var updateMapLayerDefinition = this.state.wmsLayerDefinitions.getByGuid(guid);
            Object.keys(args).forEach( argKey => {
                if (argKey === 'layer') console.log("WARNING - trying to update layer property on wmsLayerDefinitions - may lose track of layer obj reference in map!!")
                updateMapLayerDefinition[argKey] = args[argKey];
            });
            updatedMapLayerDefinitions[guid] = updateMapLayerDefinition;
            this.setState( Object.assign( this.state , { wmsLayerDefinitions: updatedMapLayerDefinitions } ) );
        }
    }

}

module.exports = MapStore;
