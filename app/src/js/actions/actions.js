import Reflux from 'reflux';

var Actions = Reflux.createActions([
	
	// Routing state
	'setRoutingCoord',
	'setRoutingState',
	'updateRoutingBackendStatus',

	// Map Features
	'setSnapToFeatures',

	// Executing Routing
	'executeRoutingRequest',
	'rerunPreviousRoutingRequest',

	// WMS Layers
	'updateMapWmsLayerDefinitions',
	'toggleMapControlVisibility',
	
	'toggleRoutingSettingsVisibility',
	'setRoutingConfigParameters',
	'updateRouteScoringMetricValue',

	'highlightRoutes'

]);

module.exports = Actions;