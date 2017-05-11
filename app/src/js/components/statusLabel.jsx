import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import { LineChart, Line , Tooltip, ScatterChart, XAxis, YAxis, Scatter, CartesianGrid } from 'recharts';

import AppStore from '../stores/AppStore.js';
import Actions from '../actions/actions.js';

class StatusLabel extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			displayedPopulation: -1
		};

		this.store = AppStore;

		this.handleGenerationClick = this.handleGenerationClick.bind(this);

	}

	shouldComponentUpdate(nextProps, nextState) {
		return this.state.routing.message !== nextState.routing.message ||
			this.state.displayedPopulation !== nextState.displayedPopulation ||
			this.state.routing.scoringData.length !== nextState.routing.scoringData.length;
	}

	componentWillUpdate(nextProps, nextState) {
		//reset displayedPopulation back to empty in between routing requests
		if (this.state.displayedPopulation !== -1 && (!this.state.routing.scoringData || !this.state.routing.scoringData.length) ) {
			nextState.displayedPopulation = -1;
		}
	}

	handleGenerationClick (event) {
		//set population chart to render clicked generation unless same generation is clicked (in which case toggle pop graph off)
		this.setState({
			displayedPopulation: (event.activeLabel !== this.state.displayedPopulation) ? event.activeLabel : -1
		});
	}

	render () {

		var generationChart = null;
		if (!!this.state.routing && ( this.state.routing.step === 3 || this.state.routing.step === 4 ) && this.state.routing.scoringData && this.state.routing.scoringData.length > 1 ) {
			generationChart = (
				<div id="generationChartContainer" className="chartContainer">
					<LineChart width={240} height={260} data={ this.state.routing.scoringData } onClick={this.handleGenerationClick} >
						<Tooltip />
						<Line type='monotone' dataKey='best' stroke='#8884d8' strokeWidth={2} isAnimationActive={false} />
						<Line type="monotone" dataKey="avg" stroke="#82ca9d" strokeWidth={2} isAnimationActive={false} />
					</LineChart> 
				</div> );
		}

		var populationChart = null;
		if ( this.state.routing.scoringData.length && this.state.displayedPopulation !== -1 ) {
			populationChart = (
				<div id="populationChartContainer" className="chartContainer">
					<ScatterChart width={240} height={260} >
				      	<XAxis hide={true} dataKey={'length'} type="number" domain={['dataMin', 'dataMax']}/>
				      	<YAxis hide={true} dataKey={'score'} type="number" domain={['dataMin', 'dataMax']} />
				      	<Scatter name='Population' data={ this.state.routing.scoringData[this.state.displayedPopulation].population } fil='#8884d8'/>
				      	<CartesianGrid />
				      	<Tooltip cursor={{strokeDasharray: '3 3'}}/>
			        </ScatterChart>
				</div> );
		}

		return (
			<div id="statusLabelContainer">

				<div id="statusMessageContainer">
					<h5>{ (!!this.state.routing && this.state.routing.message) ? this.state.routing.message : "Getting best route.." }</h5>
				</div>
				
				{ generationChart }

				{ populationChart }

			</div>
		);
	}
}

module.exports = StatusLabel;