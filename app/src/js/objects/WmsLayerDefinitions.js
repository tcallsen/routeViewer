import ol from 'openlayers';
import request from 'superagent';

import Actions from '../actions/actions.js';

import xmlDom from 'xmldom';
global.DOMParser = xmlDom.DOMParser;
import WMSCapabilities from 'wms-capabilities';

const { Map } = require('immutable');

class WmsLayerDefinitions {

	constructor( wmsUrl ) {

		//instance variables - provide different ways to access to wms layer objects 
		this.tree = {
            isRoot: true,
            enabled: false,
            layer: null,
            children: []
        };
		this.flatList = [];
	    this.guid = {}; // temporary - deleted after population and replaced with immutable this.store

        //immutable interface to data structures - used during react shouldComponentUpdate functions to 
        // properly detect changes in nested wms layer data objects
        this.store = new Map();

		request.get( wmsUrl )
            .set('Accept', 'application/xml')
            .end( (err, res) => {
    
                var getCapabilitiesObj = new WMSCapabilities(res.text).toJSON();
                var capabilityLayers = getCapabilitiesObj.Capability.Layer.Layer;

                capabilityLayers.forEach( layerNode => this.recurseWmsMapLayers( this.tree , layerNode ) );

                // create immutable Map to store WMS layer definitions and track when they are modified
                //  - store object must only be shallowly immutable since nested map layer definition will contain openlayers 
                //      ol.Layer objects, which we MUST retrain object references too for interactions with openlayers
                this.store = new Map( this.guid );
                delete this.guid;

                console.log( 'recieved wms layers:', this.store );

                //save updates made 
                Actions.updateMapWmsLayerDefinitions( this );

            });

	}

    recurseWmsMapLayers(parentNode, layerNode) {

        //assemble layer information into OL layer object
        var olLayer = new ol.layer.Tile({
            extent: [ layerNode.BoundingBox[0].extent[0] , layerNode.BoundingBox[0].extent[1] , layerNode.BoundingBox[0].extent[2] , layerNode.BoundingBox[0].extent[3] ],
            source: new ol.source.TileWMS(({
                url: 'http://costia.gritto.net:8880/geoserver/route/wms',
                params: {'LAYERS': layerNode.Name , 'TILED': true},
                serverType: 'geoserver'
            })),
            guid: layerNode.Name || layerNode.Title,
            children: []
        });

        var currentNewLayerNode = {
            enabled: false,
            name: layerNode.Name || layerNode.Title,
            title: layerNode.Title || layerNode.Name,
            layer: olLayer,
            children: []
        };

        //update instance accessors
        this.flatList.push( currentNewLayerNode );
        this.guid[currentNewLayerNode.name] = currentNewLayerNode;

        //recurse into child layers
        if (layerNode.Layer && layerNode.Layer.length > 0) {
            layerNode.Layer.forEach( childLayerNode => this.recurseWmsMapLayers( currentNewLayerNode , childLayerNode ) );
        }

        parentNode.children.push( currentNewLayerNode );

    }

    toggleLayerVisibility( layerGuid ) {
        var wmsLayerDefinition = this.store.get(layerGuid);
        wmsLayerDefinition.enabled = !wmsLayerDefinition.enabled;
        this.store = this.store.set( layerGuid , wmsLayerDefinition );
    }

    getByGuid( layerGuid ) {
        return this.store.get(layerGuid);
    }

    getFlatList() {
        return this.flatList;
    }


}

module.exports = WmsLayerDefinitions;