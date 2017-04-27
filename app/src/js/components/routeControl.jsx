import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';

//import AppStore from '../stores/AppStore.js';
import Actions from '../actions/actions.js';

class RouteControl extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {};

		//routing values available in this.props.routing

		// This binding is necessary to make `this` work in the callback
    	this.toggleRoutingUI = this.toggleRoutingUI.bind(this);

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

		document.getElementById('routeControl').addEventListener("click", this.toggleRoutingUI.bind(this));

	}	

	toggleRoutingUI() {
		Actions.toggleRoutingUI();
	}

	render () {
		return (
			<div id="routeControl" className="ol-unselectable ol-control custom-control">
				<button>
					<img src={ (this.props.routing.state === 'selecting') ? '/static/img/ic_close_white_24dp_2x.png' : '/static/img/ic_directions_walk_black_24dp_2x.png' }/>
				</button>
			</div>
		);
	}
}

module.exports = RouteControl;