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

	}

	render () {
		
		var lineChart = null;
		if (!!this.state.routing && ( this.state.routing.step === 3 || this.state.routing.step === 4 ) && this.state.routing.chartData && this.state.routing.chartData.length > 1 ) {
			lineChart = (
				<div id="chartContainer">
					<LineChart width={240} height={260} data={ this.state.routing.chartData } >
						<Tooltip />
						<Line type='monotone' dataKey='best' stroke='#8884d8' strokeWidth={2} isAnimationActive={false} />
						<Line type="monotone" dataKey="avg" stroke="#82ca9d" strokeWidth={2} isAnimationActive={false} />
					</LineChart> 
				</div> );
		}

		return (
			<div id="statusLabelContainer">

				<div id="statusMessageContainer">
					<h5>{ (!!this.state.routing && this.state.routing.message) ? this.state.routing.message : "Getting best route.." }</h5>
				</div>
				
				{ lineChart }

			</div>
		);
	}
}

module.exports = StatusLabel;