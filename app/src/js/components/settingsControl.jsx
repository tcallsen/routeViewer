import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';
import Modal from 'react-modal';

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
    	//this.clearRoutes = this.clearRoutes.bind(this);

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

		document.getElementById('settingsControl').addEventListener("click", this.toggleModalVisibility.bind(this));


		/* this.slider = this.playerControlDiv.querySelector('#sliderDiv');
        
        noUiSlider.create(this.slider, {
          start: 0,
          range: {
              min: 0,
              max: this.wamiLayerDefinition.vcss.endFrame
          }
        }); */

        /*
        
		onAfterOpen={afterOpenFn}
		onRequestClose={requestCloseFn}

         */

	}	

	toggleModalVisibility() {
		
		Actions.toggleRoutingSettingsVisibility();

	}

	buildConfigOptions() {

		var sliderElements = [];

		console.log(this.state);

		this.state.routingConfig.scoring.forEach( scoringKey => {

			sliderElements.push( <div className="routingConfigSlider" id={ "slider-" + scoringKey } key={ "slider-" + scoringKey } > </div> );

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
						handleCloseFunc={ this.toggleModalVisibility }
						shouldCloseOnOverlayClick={false}
						contentLabel="No Overlay Click Modal"
					>

						<h3>Routing Config Options</h3>
						
						{ this.buildConfigOptions() }

						<button onClick={this.toggleModalVisibility}>Close Modal...</button>
					

					</Modal>

				</div>

			</div>

		);
	}
}

module.exports = SettingsControl;