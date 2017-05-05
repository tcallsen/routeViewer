import Reflux from 'reflux';

var Actions = Reflux.createActions([
	
	'executeRoutingRequest',
	'toggleRoutingUI',
	'submitRoutingUI',
	'updateRoutingBackendStatus',
	'rerunPreviousRoutingRequest',

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