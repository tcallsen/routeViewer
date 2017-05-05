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

		document.getElementById('layerControlButton').addEventListener("click", this.toggleLayerControl.bind(this));

	}	

	toggleLayerControl() {
		Actions.toggleMapControlVisibility();
	}

	buildLayerListItems() {

		var buildChildrenList = function( parentWmsLayerDef ) {

			var childDefinitionElements = [];

			parentWmsLayerDef.children.forEach( childLayerDefinition => {

				var childLayerElement = (
					<li className="wmsLayerListItem" data-wmslayerguid={childLayerDefinition.name} key={childLayerDefinition.name}>
						<input type="checkbox" checked={ childLayerDefinition.enabled } />
						<p>{childLayerDefinition.title}</p>
						{ (childLayerDefinition.children.length > 0) ? buildChildrenList( childLayerDefinition ) : null }
					</li>
				);

				childDefinitionElements.push( childLayerElement )

			});

			return <ul className="wmsLayerList">{childDefinitionElements}</ul>;

		};

		var rootDomNode = (
			<div>
				{ (Object.keys(this.props.layerDefinitions.tree).length > 0) ? buildChildrenList( this.props.layerDefinitions.tree ) : null }
			</div>
		);

		return rootDomNode;

	}

	componentDidUpdate(prevProps, prevState) {
		
		//TODO - strip event handles on componentWillUpdate

		//strage issues setting event handlers with react when element within OpenLayers - here is my hack
		var toggleElements = [];
		document.querySelectorAll('div#mapContainer div#layerControl p').forEach( domElement => toggleElements.push(domElement) ); //add labels
		document.querySelectorAll('div#mapContainer div#layerControl input[type=checkbox]').forEach( domElement => toggleElements.push(domElement) ); //add checkboxes

		toggleElements.forEach( domElement => {

			if (typeof domElement.onclick !== "function" && typeof domElement.onchange !== "function") {
				if (domElement.tagName === 'input') domElement.addEventListener('change', this.toggleWmsLayerVisibility);
				else domElement.addEventListener('click', this.toggleWmsLayerVisibility);
			} else console.log('encountered DOM element with onclick');

		});

	}

	toggleWmsLayerVisibility(event) {
		var wmsLayerGuid = event.target.parentNode.getAttribute('data-wmslayerguid');
		Actions.updateMapWmsLayerDefinitions({
			enabled: !this.props.layerDefinitions.getByGuid(wmsLayerGuid).enabled
		}, wmsLayerGuid);
	}

	render () {
		return (
			<div id="layerControl" className="ol-unselectable ol-control custom-control">
				<button id="layerControlButton"><img src={ (this.props.isVisible) ? '/static/img/ic_close_white_24dp_2x.png' : '/static/img/ic_layers_white_24dp_2x.png' }/></button>
				<h5>Route Enrichment Data Layers</h5>
				<div id="layerControlListContainer">
					{ this.buildLayerListItems() }
				</div>
			</div>
		);
	}
}

module.exports = LayerControl;