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

	afterOpenFn() {
		
		console.log(this);

		var sliders = {};

		Object.keys(this.state.routingConfig.scoring).forEach( metricName => {

			var metricDefinition = this.state.routingConfig.scoring[metricName];

			sliders[metricName] = ReactDOM.findDOMNode( this.refs[ 'slider-' + metricName ] );
    
			noUiSlider.create( sliders[metricName], {
				start: metricDefinition.default,
				range: {
					min: metricDefinition.range[0],
					max: metricDefinition.range[1]
				}
			});

		});

	}

	toggleModalVisibility() {
		
		Actions.toggleRoutingSettingsVisibility();

	}

	buildConfigOptions() {

		var sliderElements = [];

		Object.keys(this.state.routingConfig.scoring).forEach( metricName => {
				
			var prettyTitle = metricName.replace('score_','');
			prettyTitle = prettyTitle.charAt(0).toUpperCase() + prettyTitle.slice(1);

			sliderElements.push( 
				<div className="routingConfigSliderContainer" key={ "slider-" + metricName }>
					<label className="routingConfigSliderLabel">{prettyTitle}</label>
					<div className="routingConfigSlider" ref={ "slider-" + metricName } id={ "slider-" + metricName } > </div> 
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

							<button onClick={this.toggleModalVisibility}>Close Modal...</button>
					
						</div>

					</Modal>

				</div>

			</div>

		);
	}
}

module.exports = SettingsControl;