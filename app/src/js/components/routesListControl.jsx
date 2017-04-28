import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';

import AppStore from '../stores/AppStore.js';
import RouteStore from '../stores/RouteStore.js';

import Actions from '../actions/actions.js';

class RoutesListControl extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			routes: {},
			selectedRoute: false
		};

		this.store = AppStore;

		//register RouteStore updates
		this.mapStoreToState( RouteStore, this.handleRouteStoreUpdate.bind(this) );

		//routing values available in this.props.routing

		// This binding is necessary to make `this` work in the callback
    	this.toggleRoutesSelected = this.toggleRoutesSelected.bind(this);

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

		//document.getElementById('clearControl').addEventListener("click", this.clearRoutes.bind(this));

	}	

	componentDidUpdate(prevProps, prevState) {
		
		//strage issues setting event handlers with react when element within OpenLayers - here is my hack
		document.querySelectorAll('li.routesListItem p').forEach( domElement => {

			if (typeof domElement.onclick !== "function") {
				domElement.addEventListener('click', this.toggleRoutesSelected);
			} else console.log('encountered DOM element with onclick');

		});

	}

	handleRouteStoreUpdate(args) {

		if (args.type === 'routeEnd') {

			this.setState({
				routes: args.routes,
				selectedRoute: false
			});

		}

	}

	getRoutesListElements() {

		var routeListElements = Object.keys(this.state.routes).map( (routeSequence) => {
			var route = this.state.routes[routeSequence];
 			var liClassName = ( this.state.selectedRoute !== false && this.state.selectedRoute == routeSequence ) ? 'routesListItem selected' : 'routesListItem' ;
		 	return (
		 		<li className={liClassName} key={'routesListItem-'+routeSequence} >
		 			<p data-routeSequence={routeSequence} onMouseOver={ () => this.handleRouteHover(routeSequence) } >Route {routeSequence}</p>
	 			</li>
 			);
		});

		return (
			<ul id="routesList" onMouseLeave= { () => this.handleRouteHover(undefined) }>
				{routeListElements}
			</ul>
		);

	}

	handleRouteHover(routeSequence, forceHighlight = false) {

		//return if routes are selected
		if (this.state.selectedRoute !== false && !forceHighlight) return;

		var highlightedRouteSequences = (typeof routeSequence !== 'undefined') ? [routeSequence] : [];
		Actions.highlightRoutes( highlightedRouteSequences );

	}

	toggleRoutesSelected(event) {
		
		var routeSequence = parseInt(event.target.getAttribute('data-routeSequence'));

		if (routeSequence === this.state.selectedRoute) {
			this.setState({
				selectedRoute: false
			});
		} else {
			this.setState({
				selectedRoute: routeSequence
			});
			this.handleRouteHover(routeSequence, true);
		}

	}

	render () {

		var displayPanel = this.state.routing.percentComplete === 100;

		var className = "ol-unselectable ol-control custom-control";
		if (displayPanel) className += ' active';

		return (
			<div id="routesListControl" className={className}>
				<h5>Discovered Routes</h5>
				<div id="routesListScrollContainer">
					{ this.getRoutesListElements() }
				</div>
			</div>
		);
	}
}

module.exports = RoutesListControl;