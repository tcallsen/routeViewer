//to install webpack globally
//	npm install -g webpack@1.14.0

//to execute production build using this config
//	webpack -p --config ./webpack.production.config.js

//optimization per https://stackoverflow.com/questions/35054082/webpack-how-to-build-production-code-and-how-to-use-it
var webpack = require('webpack');
new webpack.optimize.CommonsChunkPlugin('common'),
new webpack.optimize.DedupePlugin(),
new webpack.optimize.UglifyJsPlugin(),
new webpack.optimize.AggressiveMergingPlugin();

var path = require('path');

var APP_DIR = path.resolve(__dirname, '../app/src');

module.exports = {
	entry: [
		APP_DIR + '/js/app.jsx'
	],
	output: {
		path: path.join(__dirname, '../app_dist/'),
		filename: 'dist.js'
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
		]
	}
};