import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';

//import AppStore from '../stores/AppStore.js';
import Actions from '../actions/actions.js';

class LayerControl extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {};

		//routing values available in this.props.routing

		// This binding is necessary to make `this` work in the callback
    	this.toggleLayerControl = this.toggleLayerControl.bind(this);
    	this.buildLayerListItems = this.buildLayerListItems.bind(this);
    	this.toggleWmsLayerVisibility = this.toggleWmsLayerVisibility.bind(this);

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

		//document.getElementById('layerControl').addEventListener("click", this.toggleLayerControl.bind(this));

	}	

	toggleLayerControl() {
		
		console.log( 'toggleLayerControl clicked' , this.props );

	}

	buildLayerListItems() {

		var buildChildrenList = function( parentWmsLayerDef ) {

			var childDefinitionElements = [];

			parentWmsLayerDef.children.forEach( childLayerDefinition => {

				var childLayerElement = (
					<li className="wmsLayerListItem" key={childLayerDefinition.name}>
						<p data-wmslayerguid={childLayerDefinition.name}>{childLayerDefinition.name}</p>
						{ (childLayerDefinition.children.length > 0) ? buildChildrenList( childLayerDefinition ) : null }
					</li>
				);

				childDefinitionElements.push( childLayerElement )

			});

			return <ul className="wmsLayerList">{childDefinitionElements}</ul>;

		};

		var rootDomNode = (
			<div>
				<h5>Route Enrichment Data Layers</h5>
				{ (Object.keys(this.props.layerDefinitions).length > 0) ? buildChildrenList( this.props.layerDefinitions ) : null }
			</div>
		);

		return rootDomNode;

	}

	componentDidUpdate(prevProps, prevState) {
		
		//strage issues setting event handlers with react when element within OpenLayers - here is my hack
		document.querySelectorAll('div#mapContainer div#layerControl p').forEach( domElement => {

			if (typeof domElement.onclick !== "function") {
				domElement.addEventListener('click', this.toggleWmsLayerVisibility);
			} else console.log('encountered DOM element with onclick');

		});

	}

	toggleWmsLayerVisibility(event) {
		var wmsLayerGuid = event.target.getAttribute('data-wmslayerguid');
		Actions.updateMapWmsLayerDefinitions({
			enabled: !this.props.getWmsLayerDefinitionsByGuid(wmsLayerGuid).enabled
		}, wmsLayerGuid);
	}

	render () {
		return (
			<div id="layerControl" className="ol-unselectable ol-control custom-control">
				<button><img src='/static/img/ic_layers_white_24dp_2x.png'/></button>
				{ this.buildLayerListItems() }
			</div>
		);
	}
}

module.exports = LayerControl;