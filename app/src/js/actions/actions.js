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

	'highlightRoutes'

]);

module.exports = Actions;