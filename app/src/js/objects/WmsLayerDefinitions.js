import ol from 'openlayers';
import request from 'superagent';

import Actions from '../actions/actions.js';

import xmlDom from 'xmldom';
global.DOMParser = xmlDom.DOMParser;
import WMSCapabilities from 'wms-capabilities';

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
	    this.guid = {};

		request.get( wmsUrl )
            .set('Accept', 'application/xml')
            .end( (err, res) => {
    
                var getCapabilitiesObj = new WMSCapabilities(res.text).toJSON();
                var capabilityLayers = getCapabilitiesObj.Capability.Layer.Layer;

                capabilityLayers.forEach( layerNode => this.recurseWmsMapLayers( this.tree , layerNode ) );

                console.log( 'recieved wms layers:', this );

                Actions.setMapStoreReferences({ 
                	wmsLayerDefinitions: this
                });

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

    getByGuid( layerGuid ) {
        return this.guid[layerGuid];
    }

    getFlatList() {
        return this.flatList;
    }


}

module.exports = WmsLayerDefinitions;