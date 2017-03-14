import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';

//import AppStore from '../stores/AppStore.js';
import Actions from '../actions/actions.js';

class ClearControl extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {};

		//routing values available in this.props.routing

		// This binding is necessary to make `this` work in the callback
    	this.clearRoutes = this.clearRoutes.bind(this);

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

		document.getElementById('clearControl').addEventListener("click", this.clearRoutes.bind(this));

	}	

	clearRoutes() {
		Actions.clearRoutes();
	}

	render () {
		return (
			<div id="clearControl" className="ol-unselectable ol-control custom-control">
				<button><img src='/static/img/ic_blur_off_white_24dp_2x.png'/></button>
			</div>
		);
	}
}

module.exports = ClearControl;