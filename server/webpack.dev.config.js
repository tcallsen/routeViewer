module.exports = {
	entry: [
		'../app/src/index.js'
	],
	output: {
		path: '/',
		publicPath: 'http://localhost:3000/build/',
		filename: 'bundle.js'
	},
	devServer: {
		contentBase: './build'
	}
};