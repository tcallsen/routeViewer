import Reflux from 'reflux';

var Actions = Reflux.createActions([
	
	'toggleRouting',
	'submitRouting',
	'completeRouting',
	'rerunPreviousRoutingRequest',

	'setMapState',
	'updateMapWmsLayerDefinitions',
	'clearRoutes',

	'highlightRoutes'

]);

module.exports = Actions;