import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';

import AppStore from '../stores/AppStore.js';
import Actions from '../actions/actions.js';

class StatusLabel extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {};

		this.store = AppStore;

		//routing values available in this.props.routing

		// This binding is necessary to make `this` work in the callback
    	//this.clearRoutes = this.clearRoutes.bind(this);

	}

	render () {
		return (
			<div id="statusLabelContainer">
				<div id="statusLabel">
					<h5>{ (!!this.state.routing.backendStatus && this.state.routing.backendStatus.message) ? this.state.routing.backendStatus.message : "Getting best route.." }</h5>
				</div>
			</div>
		);
	}
}

module.exports = StatusLabel;