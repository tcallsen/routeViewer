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
			routes: []
		};

		this.store = AppStore;

		//register RouteStore updates
		this.mapStoreToState( RouteStore, this.handleRouteStoreUpdate.bind(this) );

		//routing values available in this.props.routing

		// This binding is necessary to make `this` work in the callback
    	//this.getRoutesListElements = this.getRoutesListElements.bind(this);

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

		//document.getElementById('clearControl').addEventListener("click", this.clearRoutes.bind(this));

	}	

	handleRouteStoreUpdate(args) {

		if (args.type === 'routeEnd') {

			this.setState({
				routes: args.routes
			});

		}

	}

	getRoutesListElements() {

		var routeListElements = Object.keys(this.state.routes).map( (routeSequence) => {
			var route = this.state.routes[routeSequence];
		 	return (
		 		<li className="routesListItem" key={'routesListItem-'+routeSequence}>
		 			<p onMouseOver={ () => this.handleRouteHover(routeSequence) }>Route {routeSequence}</p>
	 			</li>
 			);
		});

		return (
			<ul id="routesList" onMouseLeave= { () => this.handleRouteHover(undefined, event) }>
				{routeListElements}
			</ul>
		);

	}

	handleRouteHover(routeSequence) {

		var highlightedRouteSequences = (typeof routeSequence !== 'undefined') ? [routeSequence] : [];

		Actions.highlightRoutes( highlightedRouteSequences );

	}

	render () {
		
		//console.log( 'RoutesListControl render' , this.state.routing.percentComplete );

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