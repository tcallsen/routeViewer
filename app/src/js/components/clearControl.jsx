import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';

import AppStore from '../stores/AppStore.js';
import Actions from '../actions/actions.js';

class ClearControl extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {};

		// This binding is necessary to make `this` work in the callback
    	this.clearRouting = this.clearRouting.bind(this);

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

		document.getElementById('clearControl').addEventListener("click", this.clearRouting.bind(this));

	}	

	clearRouting() {
		Actions.setRoutingState();
	}

	render () {
		
		var style = {
			display: (this.props.routingState.state === 'complete' || this.props.routingState.state === 'failed') ? 'block' : 'none'
		};

		return (
			<div id="clearControl" style={style} className="ol-unselectable ol-control custom-control">
				<button><img src='/static/img/ic_close_white_24dp_2x.png'/></button>
			</div>
		);
	}
}

module.exports = ClearControl;