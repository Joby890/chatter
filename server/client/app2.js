app = angular.module('chatter', []);

var user;

user = prompt('name');
app.factory('socket', function($rootScope) {
  //Setup chatter
  var chatter = {};
  var socket = io();
  var pluginManager = require("./pluginManager")(chatter, socket)
  //Connect to socket
  socket.on('connect', function() {
    //Sends auth to server
    //TODO send auth correctly
    socket.emit('authentication', {username: user, password: "secret"});

    //Once logged in log profile
    socket.on('authenticated', function(profile) {
      // use the socket as usual 
      console.log(profile, " logged in")
    });
  }).on('disconnect', function(reason) {
    console.log('Discounned because "' + reason+'"');
  })
  return {
    on: function(eventName, callback) {
      socket.on(eventName, function() {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      })
    },
    emit: function(eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    },
    pluginManager: pluginManager,
  }
})

app.controller('channelCntl', function($rootScope, $scope, $http, socket) {
  $rootScope.channelClick = function(name) {
    $rootScope.currentChannel = name;
    $rootScope.$emit('changeChannel', {name: name})
  }
  $rootScope.channelClick("general")
  socket.on('channels', function(data) {
    $scope.channels = data.channels;
  })

})

app.controller('chatCntl', function($rootScope, $scope, socket) {


  var Message = require('./message.js').Message;
  $scope.messages = [];
  $scope.test = function(message) {
    socket.emit("message", new Message($rootScope.currentChannel, message, user))
  }

  socket.on('message', function(message) {
    if(message.channel === $rootScope.currentChannel) {
      $scope.messages.unshift(message)
    }
  })

  $rootScope.$on('changeChannel', function(event, args) {
    var channel = args.name;
    $scope.messages = [];
    socket.emit('getMessages', {channel: channel});
  })

});



