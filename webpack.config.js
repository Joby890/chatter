var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var CODE = __dirname+'/server/client';
var React = require('react');

//makeIndex();

module.exports = {

  devtool: 'eval',

  entry: ["./server/client/app.js"],


  output: {
    path: 'server/client',
    filename: 'bundles.js',
    chunkFilename: '[id].chunk.js',
    publicPath: 'client'
  },

  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.js$/, loader: 'jsx-loader?harmony' }
    ]
  },

  resolve: {
    alias: {
      'react': path.join(__dirname, 'node_modules', 'react')
    },
    extensions: ['', '.js']
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin('shared.js')
  ]

};


function isDirectory(dir) {
  return fs.lstatSync(dir).isDirectory();
}
