(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
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




},{"./message.js":3,"./pluginManager":4}],3:[function(require,module,exports){
'use strict'
class Message {
  constructor(channel, text,  user) {
    this.channel = channel;
    this.text = text;
    this.user = user;
  }
}

module.exports.Message = Message;

},{}],4:[function(require,module,exports){
'use strict'
class PluginManager {
  constructor(chatter, socket) {
    this.events = {};
    var plugins = [];
    var fs = require("fs");
    window.Plugin = Plugin;
    var addPlugin = function(dir, data) {
      console.log("Loading: " + data.name)
      System.import(dir).then(function(module) {
        var classplugin = module.default;
        var obj = new classplugin(chatter);
        plugins.push(new Plugin(data.name, data.author, data.description, obj));

      });
      // var module = require(dir);
      // var obj = new module(chatter);
      // var createPlugin = new Plugin(data.name, data.author, data.description, obj);
      // plugins.push(createPlugin);
    }

    this.getPlugin = function(name) {
      for(var i = 0; i < plugins.length; i++) {
        if(plugins[i].name === name) {
          return plugins[i];
        }
      }
    }
    var load = function(name, data, all) {
      if(!self.getPlugin(data.name)) {
        if(data.depend) {
          data.depend.forEach(function(newName) {
            if(!self.getPlugin(newName)) {
              load(newName, all[newName], all);  
            }
          });
        }
        addPlugin("plugins/"+name + "/" + data.main, data);  

      }

    }
    var self = this;
    socket.on('getPlugins', function(result) {
      for(var key in result) {
        var data = result[key];
        load(key, data,result);
      }
    })
    socket.emit('getPlugins', {});

  }


  registerEvent(name, callback, priority) {
    if(!this.events[name]) {
      this.events[name] = [];
    }
    if(!priority) {
      priority = 3;
    }
    var event = this.events[name];
    event.push({priority: priority, callback: callback});
    event.sort(function(a,b) {
      return a.priority - b.priority;
    })

  }
  fireEvent(name, args) {
    var event = this.events[name];
    var e = new Event(name, args);
    e.Results = Result;
    if(event) { 
      for(var i = 0; i < event.length; i++) {
        event[i].callback(e);
      }
    }

    return e;

  }




}

class Plugin {
  constructor(name, author, description, obj) {
    this.name = name;
    this.author = author;
    this.description = description;
    this.obj = obj;
  }
}


class Event {
  constructor(name, args) {
    this.name = name;
    this.result = Result.default;
    for(var key in args) {
      this[key] = args[key];
    }
  }
}

class Result {

  constructor(name, id) {
    this.name = name;
    this.id = id;
  }

  set(to) {
    if(typeof to === "string") {
      to = to.toUpperCase();
      if(to === "DEFAULT") {
        return Result.states[1];
      } else if(to === "ALLOW") {
        return Result.states[2];
      } else if(to === "DENY") {
        return Result.states[0];
      }
    } else if(typeof to === 'number') {
      var state = Result.states[to];
      return state || this.state;
    }
  }
}

var deny = new Result("DENY",0);
var allow = new Result("ALLOW", 2);
var def = new Result("DEFAULT", 1);

Result.states = {
  "0":  deny, 
  "1":  def, 
  "2":  allow, 
  "default": def,
  "allow": allow,
  "deny": deny,
}

Result.default = def;
Result.deny = deny;
Result.allow = allow;



module.exports = function(chatter, socket) {
  return new PluginManager(chatter, socket);
}
module.exports.Result = Result;
},{"fs":1}]},{},[3,2]);
