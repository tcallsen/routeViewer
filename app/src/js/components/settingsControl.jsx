import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';
import Modal from 'react-modal'; //https://github.com/reactjs/react-modal
import noUiSlider from 'nouislider';
require('../../css/nouislider.min.css');

import RouteStore from '../stores/RouteStore.js';
import Actions from '../actions/actions.js';

class SettingsControl extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			sliders: {}
		};

		this.store = RouteStore;

		//routing values available in this.props.routing

		// This binding is necessary to make `this` work in the callback
    	this.afterOpenFn = this.afterOpenFn.bind(this);

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

		document.getElementById('settingsControl').addEventListener("click", this.toggleModalVisibility.bind(this));

	}	

	componentDidUpdate(prevProps, prevState) {
		
		Object.keys(this.state.routingConfig.scoring).forEach( metricName => {

			if (!this.state.sliders[metricName]) return;

			var metricDefinition = this.state.routingConfig.scoring[metricName];
			var sliderDefinition = this.state.sliders[metricName];

			//apply scale if necessary
			if (typeof metricDefinition.uiScale !== 'undefined') {
				if (metricDefinition.value !== sliderDefinition.noUiSlider.get() / metricDefinition.uiScale ) {
					sliderDefinition.noUiSlider.set( metricDefinition.value * metricDefinition.uiScale );
				}
			} else { //default of 100
				if (metricDefinition.value !== sliderDefinition.noUiSlider.get() / 100 ) {
					sliderDefinition.noUiSlider.set( metricDefinition.value * 100 );
				}
			}

		});

	}

	afterOpenFn() {
		
		console.log(this);

		var sliders = {};

		Object.keys(this.state.routingConfig.scoring).forEach( metricName => {

			var metricDefinition = this.state.routingConfig.scoring[metricName];

			sliders[metricName] = ReactDOM.findDOMNode( this.refs[ 'slider-' + metricName ] );
    
			//create slider with scale if necessary
			if (typeof metricDefinition.uiScale !== 'undefined') {
				noUiSlider.create( sliders[metricName], {
					start: metricDefinition.value * metricDefinition.uiScale,
					range: {
						min: metricDefinition.range[0] * metricDefinition.uiScale,
						max: metricDefinition.range[1] * metricDefinition.uiScale
					}
				});
			} else {
				noUiSlider.create( sliders[metricName], {
					start: metricDefinition.value * 100,
					range: {
						min: metricDefinition.range[0] * 100,
						max: metricDefinition.range[1] * 100
					}
				});
			}

			sliders[metricName].noUiSlider.on('change', function( values, handle ) {
				var value = Math.round(values[handle]);
				Actions.updateRouteScoringMetricValue({
					metricName: metricName,
					newValue: value
				});
			});

		});

		this.setState({
			sliders: sliders
		});

	}

	toggleModalVisibility() {
		Actions.toggleRoutingSettingsVisibility();
	}

	handleSliderChange(event, sliderId) {
		Actions.updateRouteScoringMetricValue({
			metricName: sliderId,
			newValue: event.target.value
		});
	}

	buildConfigOptions() {

		var sliderElements = [];

		Object.keys(this.state.routingConfig.scoring).forEach( metricName => {
				
			var metricDefinition = this.state.routingConfig.scoring[metricName];

			var prettyTitle = metricName.replace('score_','');
			prettyTitle = prettyTitle.charAt(0).toUpperCase() + prettyTitle.slice(1);

			sliderElements.push( 
				<div className="routingConfigSliderContainer" key={ "slider-" + metricName }>
					<label className="routingConfigSliderLabel">{prettyTitle}</label>
					<input className="routingConfigInput" type="number" onChange={ (event) => this.handleSliderChange( event, metricName ) } value={ (typeof metricDefinition.uiScale !== 'undefined') ? metricDefinition.value * metricDefinition.uiScale : metricDefinition.value * 100 }/>
					<div className="routingConfigSliderParent" >
						<div className="routingConfigSlider" ref={ "slider-" + metricName } id={ "slider-" + metricName } > </div> 
					</div>
				</div>
			);

		});

		return (
			<div>
				{ sliderElements }
			</div>
		);

	}

	render () {
		
		var modalStyle = {
			content : {
			    position                   : 'absolute',
			    left                       : '40px',
			    top  					   : 'auto',
			    right  					   : 'auto',
			    bottom                     : '44px',
			    border                     : '1px solid rgb(204,204,204)',
			    background                 : '#fff',
			    overflow                   : 'auto',
			    WebkitOverflowScrolling    : 'touch',
			    borderRadius               : '4px',
			    outline                    : 'none',
			    padding                    : '20px'
			  }
		}

		return (
			<div>
				
				<div id="settingsControl" className="ol-unselectable ol-control custom-control">
					<button><img src='/static/img/ic_settings_white_24dp_2x.png'/></button>
				</div>

				<div>

					<Modal
						isOpen={this.state.routingConfig.modalVisible}
						style={modalStyle}
						onAfterOpen={this.afterOpenFn}
						handleCloseFunc={ this.toggleModalVisibility }
						shouldCloseOnOverlayClick={false}
						contentLabel="No Overlay Click Modal"
					>

						<div id="routingConfigModalContent">

							<h3>Routing Preferences</h3>
							
							{ this.buildConfigOptions() }

							<button onClick={this.toggleModalVisibility}>Save & Close</button>
					
						</div>

					</Modal>

				</div>

			</div>

		);
	}
}

module.exports = SettingsControl;