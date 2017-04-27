import Reflux from 'reflux';

var Actions = Reflux.createActions([
	
	'toggleRouting',
	'submitRouting',
	'completeRouting',
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