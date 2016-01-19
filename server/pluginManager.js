'use strict'
var _ = require('lodash');
class PluginManager {
  constructor(chatter) {
    this.events = {};
    var plugins = [];
    var fs = require("fs");
    var amount;
    var self = this;
    var addPlugin = function(dir, data) {
      console.log("Loading: " + data.name)
      var module = require(dir);
      //Create the plugin instance
      var obj = new module(chatter);
      //Build the default plugin
      var createPlugin = new Plugin(data.name, data.author, data.description);
      //combind the two
      _.extend(createPlugin, obj);
      self.enablePlugin(createPlugin);
      plugins.push(createPlugin);
      if(amount === plugins.length) {
        var event = self.fireEvent("PluginsFinishedLoadingEvent", {});
      }
    }

    this.enablePlugin = function(plugin) {
      var event = this.fireEvent("PluginEnableEvent", {plugin: plugin});
      if(event.result === Result.deny) {
        console.log("PluginEnableEvent was denyed");
        return;
      }
      plugin.onEnable();
      plugin.setEnabled(true);
    }

    this.getPlugins = function() {
      return plugins;
    };

    this.disablePlugin = function(plugin) {
      var event = this.fireEvent("PluginDisableEvent", {plugin: plugin});
      if(event.result === Result.deny) {
        console.log("PluginDisableEvent was denyed");
        return;
      }
      console.log("Disabling " + plugin.name);
      plugin.onDisable && plugin.onDisable();
      plugin.setEnabled(false);
      this.unRegisterEvents(plugin);
      _.each(chatter.getActiveConfigs(plugin), function(config) {
        chatter.unLoadConfig(config);
      });
    }

    this.getPlugin = function(name) {
      for(var i = 0; i < plugins.length; i++) {
        if(plugins[i].name === name) {
          return plugins[i];
        }
      }
    }
    var load = function(name) {

      var data = fs.readFileSync("plugins/"+name + "/plugin.json");
      data = JSON.parse(data);
      if(!self.getPlugin(data.name)) {
        if(data.depend) {
          data.depend.forEach(function(name) {
            if(!self.getPlugin(name)) {
              load(name);
            }
          });
        }
        addPlugin("./plugins/"+name + "/" + data.main, data);

      }

    }
    var self = this;
    //Check if dir exsits
    if(!fs.existsSync("./plugins")) {
      try {
        fs.mkdirSync("./plugins");
      } catch(e) {
        //Plugin directory does not exists could not be created. Error out..
        console.log("Plugin Dir could not be found or created");
        throw new Error("Not plugin dir");
      }
    }
    fs.readdir("./plugins", function(err, dir) {
      //load plugins
      var toLoad = [];
      amount = dir.length;
      dir.forEach(function(plugin) {
        if(!self.getPlugin(plugin)) {
          console.log("Going to load " + plugin)
          load(plugin);
        }
      })
    })

  }

  unRegisterEvents(plugin) {
    for(var key in this.events) {
      var events = this.events[key];
      this.events[key] = _.reject(events, function(e) {
        return e.plugin === plugin;
      })
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
    event.push({priority: priority, callback: callback, plugin: plugin});
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
  constructor(name, author, description) {
    this.name = name;
    this.author = author;
    this.description = description;
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



module.exports = function(chatter) {
  return new PluginManager(chatter);
}
module.exports.Result = Result;
