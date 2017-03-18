import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';

import AppStore from '../stores/AppStore.js';
import RouteStore from '../stores/RouteStore.js';

import Actions from '../actions/actions.js';

class RoutesListControl extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {};

		this.store = AppStore;

		//routing values available in this.props.routing

		// This binding is necessary to make `this` work in the callback
    	//this.clearRoutes = this.clearRoutes.bind(this);

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

		//document.getElementById('clearControl').addEventListener("click", this.clearRoutes.bind(this));

	}	

	render () {
		
		//console.log( 'RoutesListControl render' , this.state.routing.percentComplete );

		var displayPanel = this.state.routing.percentComplete === 100;

		var className = "ol-unselectable ol-control custom-control";
		if (displayPanel) className += ' active';

		return (
			<div id="routesListControl" className={className}>
				<h5>Discovered Routes</h5>
			</div>
		);
	}
}

module.exports = RoutesListControl;