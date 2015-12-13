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