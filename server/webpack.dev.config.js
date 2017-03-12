var path = require('path');

var APP_DIR = path.resolve(__dirname, '../app/src');

module.exports = {
	entry: [
		APP_DIR + '/js/app.jsx'
	],
	output: {
		path: '/',
		publicPath: 'http://localhost:3000/build/',
		filename: 'bundle.js'
	},
	devServer: {
		contentBase: './build'
	},
	module: {
		loaders: [
			{ test: /\.(js|jsx)$/, loader: 'babel',
				include : APP_DIR, 
				exclude: /\.node_modules$/,
				babelrc: false,
        		query: {
          			presets: ["es2015", "react"]
          		}
      		},
			{ test: /\.css$/, loader: "style-loader!css-loader" }
			//{ test : /\.jsx?/, include : APP_DIR, loader : 'babel' }
		]
	}
};