import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import { LineChart, Line , Tooltip } from 'recharts';

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
		
		var lineChart = null;
		if (!!this.state.routing.backendStatus && this.state.routing.backendStatus.step === 3 && this.state.routing.backendStatus.chartData ) {
			lineChart = (
				<LineChart width={240} height={300} data={ this.state.routing.backendStatus.chartData }>
					<Tooltip />
					<Line type='monotone' dataKey='best' stroke='#8884d8' strokeWidth={2} isAnimationActive={false} />
					<Line type="monotone" dataKey="avg" stroke="#82ca9d" strokeWidth={2} isAnimationActive={false} />
				</LineChart> );
		}

		return (
			<div id="statusLabelContainer">
				<div id="statusLabel">
					<h5>{ (!!this.state.routing.backendStatus && this.state.routing.backendStatus.message) ? this.state.routing.backendStatus.message : "Getting best route.." }</h5>
					<div id="chartContainer">
						{ lineChart }
					</div>
				</div>
			</div>
		);
	}
}

module.exports = StatusLabel;