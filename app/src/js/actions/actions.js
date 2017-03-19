import Reflux from 'reflux';

var Actions = Reflux.createActions([
	
	'toggleRouting',
	'submitRouting',
	'completeRouting',

	'setMapState',
	'clearRoutes',

	'highlightRoutes'

]);

module.exports = Actions;