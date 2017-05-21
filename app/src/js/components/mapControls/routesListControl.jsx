import Reflux from 'reflux';
import ReactDOM from 'react-dom';
import React from 'react';

import ol from 'openlayers';

import AppStore from '../../stores/AppStore.js';
import RouteStore from '../../stores/RouteStore.js';

import Actions from '../../actions/actions.js';

class RoutesListControl extends Reflux.Component {
	
	constructor(props) {
		super(props);
		
		//maintain list of locally selected routes
		this.state = {
			selectedRoutes: []
		}

		this.store = RouteStore;

		// This binding is necessary to make `this` work in the callback
    	this.toggleRoutesSelected = this.toggleRoutesSelected.bind(this);

	}

	componentDidMount() {

		this.control = new ol.control.Control({
		    element: ReactDOM.findDOMNode(this)
		});

	}	

	componentWillUpdate(nextProps, nextState) {
		
		// check if need to reset selectedRoutes - prevents selectedRoutes from being carried over inbetween routing requests
		if ( nextState.routes.size === 0 && this.state.selectedRoutes.length) {
			nextState.selectedRoutes = [];
		}

		// check to automatically select / highlight best route upon routing completion (bit of a hack..)
		if ( this.props.routingState.state === 'routing' && nextProps.routingState.state === 'complete' ) {
			this.setState({
				selectedRoutes: [ this.state.routes.keySeq().last() ]
			});
		}

	}

	componentDidUpdate(prevProps, prevState) {
		
		//strage issues setting event handlers with react when element within OpenLayers - here is my hack
		document.querySelectorAll('li.routesListItem p').forEach( domElement => {

			if (typeof domElement.onclick !== "function") {
				domElement.addEventListener('click', this.toggleRoutesSelected);
			} else console.log('encountered DOM element with onclick');

		});

	}

	getRoutesListElements() {

		var routeListElements = this.state.routes.keySeq().map( (routeSequence) => {
			if (routeSequence === 'spindle') return; //skip spindle entries
			var route = this.state.routes.get(routeSequence);
 			var liClassName = ( this.state.selectedRoutes.indexOf(parseInt(routeSequence)) > -1 ) ? 'routesListItem selected' : 'routesListItem' ;
		 	return (
		 		<li className={liClassName} key={'routesListItem-'+routeSequence} >
		 			<p data-routeSequence={routeSequence} onMouseOver={ () => this.handleRouteHover(routeSequence) } onMouseOut={ () => this.handleRouteHover(routeSequence) } >Route {routeSequence}</p>
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
		
		//retrieve previously selected routes (and make copy too allow of non corrupting mutation)
		var mergedRoutes = this.state.selectedRoutes.slice(0);

		//merge in hovered route if it is not already present
		if ( typeof routeSequence !== 'undefined' && mergedRoutes.indexOf( routeSequence ) === -1 ) {
			mergedRoutes.push( routeSequence );
		}

		Actions.highlightRoutes( mergedRoutes );

	}

	toggleRoutesSelected(event) {
		
		//get current selected routes and determine routeSequence of recentely selected route
		var selectedRoutes = this.state.selectedRoutes;
		var routeSequence = parseInt(event.target.getAttribute('data-routeSequence'));

		//remove selected route from list if present, otherwise add it
		if (selectedRoutes.indexOf(routeSequence) > -1) {
			selectedRoutes.splice( selectedRoutes.indexOf(routeSequence) , 1 );
		} else selectedRoutes.push( routeSequence );

		//save updated selected routes list to local component state
		this.setState({
			selectedRoutes: selectedRoutes
		});

	}

	render () {

		var displayPanel = ( this.props.routingState.state === 'complete' || this.props.routingState.state === 'failed' );

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