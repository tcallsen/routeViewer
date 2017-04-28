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

	shouldComponentUpdate(nextProps, nextState) {
		return true;
		console.log( 'app shouldComponentUpdate' , nextState.routing.percentComplete , nextState.routing.state !== this.state.routing.state ||
			nextState.routing.percentComplete !== this.state.routing.percentComplete);
		return nextState.routing.state !== this.state.routing.state ||
			nextState.routing.percentComplete !== this.state.routing.percentComplete;
	}

	render () {

		return (

			<div>
				<ProgressBar percent={this.state.routing.percentComplete} spinner='right' />
				<Map />
			</div>

		);
	}
}

ReactDOM.render(<App/>, document.getElementById('app'));