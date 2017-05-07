require('../css/main.css');

// REACT & REFLUX
import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ProgressBar from 'react-progress-bar-plus';
require('react-progress-bar-plus/lib/progress-bar.css');

import AppStore from './stores/AppStore.js';
import Map from './components/map.jsx';

class App extends Reflux.Component {
	
	constructor(props) {
		super(props);
		this.state = { };
		this.store = AppStore;
	}

	render () {

		return (

			<div>
				<ProgressBar percent={this.state.routing.percentComplete} spinner='right' />
				<Map 
					layerControlVisible= {this.state.layerControlVisible}
					routingState={this.state.routing}
					config={this.state.config} />
			</div>

		);
	}
}

ReactDOM.render(<App/>, document.getElementById('app'));