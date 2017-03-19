import Reflux from 'reflux';

var Actions = Reflux.createActions([
	
	'toggleRouting',
	'submitRouting',
	'completeRouting',
	'rerunPreviousRoutingRequest',

	'setMapState',
	'clearRoutes',

	'highlightRoutes'

]);

module.exports = Actions;