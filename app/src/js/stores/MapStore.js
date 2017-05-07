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
            wmsLayerDefinitions: new WmsLayerDefinitions(wmsUrl),
            map: null,
            wmsLayersGroup: null,
            routesLayer: null,
            highlightedRoutesLayer: null,
            snapToLayer: null,
            context: null
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

    onClearMapLayerSource(layerName, args = false) {

        console.log( 'onClearMapLayerSource clearing' , layerName );

        /* if (layerName === 'routesLayer') {

            // base routes

            if (!args || (args && args.indexOf(0) > -1) ) {

                this.state.map.removeLayer( this.state.routesLayer );

                this.state.routesLayer = new ol.layer.Vector({
                    name: 'routesLayer',
                    //style: this.getFeatureStyle,
                    source: new ol.source.Vector({
                        features:[],
                        wrapX: false
                    })
                });

                this.state.map.addLayer( this.state.routesLayer );

            }

            // highlighted routes

            if (!args || (args && args.indexOf(1) > -1) ) {

                this.state.map.removeLayer( this.state.highlightedRoutesLayer );

                this.state.highlightedRoutesLayer = new ol.layer.Vector({
                    name: 'highlightedRoutesLayer',
                    style: this.getHighlightedFeatureStyle,
                    source: new ol.source.Vector({
                        features:[],
                        wrapX: false
                    })
                });

                this.state.map.addLayer( this.state.highlightedRoutesLayer );

            }

        } else { */

            this.state.map.getLayers().forEach( layer => {
                if (layerName === layer.get('name')) {
                    layer.getSource().clear();
                }
            });

        //}

    }

}

module.exports = MapStore;
