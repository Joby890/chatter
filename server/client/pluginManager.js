'use strict'
class PluginManager {
  constructor(chatter, socket) {
    this.events = {};
    this.plugins = [];
    this.next = 0;
    //var fs = require("fs");
    window.Plugin = Plugin;


  }
  getPlugin(name) {
    for(var i = 0; i < this.plugins.length; i++) {
      if(this.plugins[i].name === name) {
        return this.plugins[i];
      }
    }
  }
  getPlugins() {
    return this.plugins;
  }

  initialize(socket) {
    var self = this;
    var addPlugin = function(dir, data) {
      console.log("Loading: " + data.name)

      System.import(dir).then(function(module) {
        var classplugin = module.default;
        //instance
        var obj = new classplugin(chatter);
        //plugin
        var createPlugin  = new Plugin(data.name, data.author, data.description);
        _.extend(createPlugin, obj);
        self.enablePlugin(createPlugin);

        self.plugins.push(createPlugin);

      });
      // var module = require(dir);
      // var obj = new module(chatter);
      // var createPlugin = new Plugin(data.name, data.author, data.description, obj);
      // plugins.push(createPlugin);
    }
    this.enablePlugin = function(plugin) {
      var event = this.fireEvent("PluginEnableEvent", {plugin: plugin});
      if(event.result === Result.deny) {
        console.log("PluginEnableEvent was denyed");
        return;
      }
      plugin.onEnable();
      plugin.setEnabled(true);
    };

    this.disablePlugin = function(plugin) {
      var event = this.fireEvent("PluginDisableEvent", {plugin: plugin});
      if(event.result === Result.deny) {
        console.log("PluginDisableEvent was denyed");
        return;
      }
      console.log("Disabling " + plugin.name);
      plugin.onDisable && plugin.onDisable();
      chatter.scheduler.cancelTasks(plugin);
      plugin.setEnabled(false);
      //UnRegister events on plugin
      this.unRegisterEvents(plugin);
      //Remove pages on plugin
      chatter.getPanel('left').removePages(plugin);
      chatter.getPanel('right').removePages(plugin);
      chatter.getPanel('center').removePages(plugin);
      chatter.getPanel('bottom').removePages(plugin);
    };



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
    socket.on('getPlugins', function(result) {
      for(var key in result) {
        var data = result[key];
        load(key, data,result);
      }
    })
    socket.emit('getPlugins', {});
  }

  unRegisterEvents(plugin) {
    for(var key in this.events) {
      var events = this.events[key];
      this.events[key] = _.reject(events, function(e) {
          return e.plugin === plugin;
      });
    }
  }

  unRegisterEvent(id) {
    for(var key in this.events) {
      var events = this.events[key];
      this.events[key] = _.filter(events, function(e) {
          return e.id !== id;
      });
    }
  }


  registerEvent(plugin, name, callback, priority) {
    if( (! (plugin instanceof Plugin)) && plugin !== null ) {
      throw new Error("First prama needs to be a plugin or null value")
    }
    if(!this.events[name]) {
      this.events[name] = [];
    }
    if(!priority) {
      priority = 3;
    }
    var event = this.events[name];
    var id = ++this.next;
    event.push({priority: priority, callback: callback, plugin: plugin, id: id});
    event.sort(function(a,b) {
      return a.priority - b.priority;
    })
    return id;
  }
  fireEvent(name, args) {
    var event = this.events[name];
    var e = new Event(name, args);
    e.Results = Result;
    if(event) {
      for(var i = 0; i < event.length; i++) {
        try {
          event[i].callback(e);
        } catch(e) {
          console.log("Error caught while " + name + " was firing!")
          console.log(e)
          console.log(e.stack)
        }
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
    this.enabled = false;
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(bool) {
    this.enabled = bool;
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
window.Result = Result;
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
