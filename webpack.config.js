var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var CODE = __dirname+'/server/client';
var React = require('react');

makeIndex();

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

function makeIndex () {
  var list = fs.readdirSync(CODE).filter(function(dir) {
    return isDirectory(path.join(CODE, dir));
  }).map(function (dir) {
    return React.DOM.li({}, React.DOM.a({href: '/'+dir}, dir.replace(/-/g, ' ')));
  });
  var markup = React.renderToStaticMarkup((
    React.DOM.html({},
      React.DOM.link({rel: 'stylesheet', href: '/shared.css'}),
      React.DOM.body({id: "index"},
        React.DOM.ul({}, list)
      )
    )
  ));
  fs.writeFileSync('./server/index.html', markup);
}

function isDirectory(dir) {
  return fs.lstatSync(dir).isDirectory();
}
