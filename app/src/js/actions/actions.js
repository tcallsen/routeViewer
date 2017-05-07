import Reflux from 'reflux';

var Actions = Reflux.createActions([
	
	// Routing state
	'setRoutingCoord',
	'setRoutingState',
	
	'executeRoutingRequest',
	'updateRoutingBackendStatus',
	'rerunPreviousRoutingRequest',

	'clearMapLayerSource',

	'setMapStoreReferences',
	'updateMapWmsLayerDefinitions',
	'toggleMapControlVisibility',
	'clearRoutes',

	'toggleRoutingSettingsVisibility',
	'setRoutingConfigParameters',
	'updateRouteScoringMetricValue',

	'highlightRoutes'

]);

module.exports = Actions;