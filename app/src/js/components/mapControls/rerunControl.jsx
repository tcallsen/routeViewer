import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';

import AppStore from '../../stores/AppStore.js';
import Actions from '../../actions/actions.js';

class RerunControl extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {};

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

		document.getElementById('rerunControl').addEventListener("click", this.rerunRouting.bind(this));

	}	

	rerunRouting() {
		Actions.rerunPreviousRoutingRequest();
	}

	render () {
		return (
			<div id="rerunControl" className="ol-unselectable ol-control custom-control">
				<button><img src='/static/img/ic_autorenew_white_24dp_2x.png'/></button>
			</div>
		);
	}
}

module.exports = RerunControl;