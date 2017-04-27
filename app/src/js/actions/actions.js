import Reflux from 'reflux';

var Actions = Reflux.createActions([
	
	'executeRoutingRequest',
	'toggleRoutingUI',
	'submitRoutingUI',
	'completeRoutingUI',
	'updateRoutingBackendStatus',
	'rerunPreviousRoutingRequest',

	'setMapState',
	'updateMapWmsLayerDefinitions',
	'toggleMapControlVisibility',
	'clearRoutes',

	'toggleRoutingSettingsVisibility',
	'setRoutingConfigParameters',
	'updateRouteScoringMetricValue',

	'highlightRoutes'

]);

module.exports = Actions;