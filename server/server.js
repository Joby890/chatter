var express = require("express");
var app = express();

var req = require('request');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var message = require('./client/message');
var pm = require('./pluginManager');
var Result = pm.Result;
var pluginManager =  this.pluginManager = pm(this);
var Channel = require("./channel").channel;
var User = require('./user').User;
var Auth = require('./auth').Auth;
var Storage = require('./storage').Storage;
var Config = require("./config").Config;
var _ = require('lodash');
var jwtSecret = 'secretsss';

app.use(express.static(__dirname + '/client'));


http.listen(3030, function() {
  console.log("listening on 3030");
});

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

GLOBAL.chatter = this;
var channels = {};
var users = {};
var connections = [];
//Auth & storage system currently being used
var auth;
var storage;

var scheduler = chatter.scheduler =  new (require("./client/scheduler"))();


var request = chatter.request = function(options, callback) {
  try {
    req("http://"+options.host+options.path, function(err, response, body) {
      try {
        callback(JSON.parse(body));
      } catch(e) {
        console.log("Error caught during callback "+e);
        console.log(e.stack);
      }
    });
  } catch(e) {
    console.log("Error caught during request"+e);
    console.log(e.stack);
  }
};


//current operation is O(n) n is all users which can become costly operations
var getOnlineUsers = chatter.getOnlineUsers = function() {
  return _.filter(users, function(user, key) {
    return user.isOnline();
  });
};

var send = chatter.send = function(name, data, user) {
  //If no user specified send to everyone;
  if(!user) {
    connections.forEach(function(conn) {
      conn.socket.emit(name, data);
    });
  } else {
    connections.forEach(function(conn) {
      if(conn.user === user) {
        conn.socket.emit(name, data);
      }
    });
  }
};

var sevents = [];
var listenToAll = chatter.listenToAll = function(name, callback) {
  //Tell all sockets already connected to listen to this event
  connections.forEach(function(connection) {
    connection.socket.on(name, callback.bind(this, connection.user));
  });
  sevents.push({name: name, callback: callback});

};

var createChannel = chatter.createChannel = function(name) {
  if(channels[name] !== undefined) {
    return;
  }
  var event = pluginManager.fireEvent("CreateChannelEvent", {name: name});
  if(event.result === Result.deny) {
    console.log(event.name + " was canceled");
    return;
  }
  channels[event.name] = new Channel(event.name);
  storage.saveChannel(channels[event.name]);
  sendChannels();
};

var getChannel = chatter.getChannel = function(name) {
  if(channels[name]) {
    return channels[name];
  }
};

var createUser = chatter.createUser = function(name) {
  if(users[name] !== undefined) {
    return users[name];
  }
  var event = pluginManager.fireEvent("CreateUserEvent", {user: new User(name)});
  if(event.result === Result.deny) {
    console.log(event.name + " was canceled");
    return;
  }
  users[event.user.name] = event.user;
  storage.saveUser(event.user);
  return event.user;
};

var getUser = chatter.getUser = function(name) {
  return users[name];
};

var configs = {};

var loadConfig = chatter.getConfig =  chatter.loadConfig = function(plugin, f) {
  var config = new Config(f);
  configs[config] = plugin;
  return config;
};


var unLoadConfig = chatter.unLoadConfig = function(config) {
  delete configs[config];
};

var getActiveConfigs = chatter.getActiveConfigs = function(plugin) {
  return _.reduce(configs, function(plugin, config) {
    return plugin === plugin;
  }, []);
};

var getPlugin = chatter.getPlugin = function(name) {
  return pluginManager.getPlugin(name);
};

var setStorage = chatter.setStorage = function(newStorage) {
  if(newStorage instanceof Storage) {
    if(storage) {
      storage.stop();
    }
    newStorage.start();
    storage = newStorage;
    console.log("Using Storage system " + storage.name);
  } else {
    throw "Storage system must extend Storage class";
  }
};

setStorage(new Storage("default"));


//give Storage access to plugins for extending
chatter.Storage = Storage;
var setAuth = chatter.setAuth = function(newAuth) {
  //check if newAuth is instance of auth
  if(newAuth instanceof Auth) {
    //stop old system
    if(auth) {
      auth.stop();
    }
    newAuth.start();
    auth = newAuth;
    console.log("Using Auth system " + auth.name);
  } else {
    throw "Auth System must inherit Auth class";
  }
};
//default to empty permission system
setAuth(new Auth("default"));
//give access to Auth system to chatter
chatter.Auth = Auth;

var sendMessage = chatter.sendMessage = function(user, channel, text) {

  //create id for message
  var id = uuid();
  //Create a time stamp for the message when we got the message
  var timeStamp = new Date();
  if(!user || !channel || !text) {
    console.log("Invalid message");
    return;
  }
  var Message = new message.Message(channel.name, text, user.name, id, timeStamp);
  //Save Message
  storage.saveMessage(Message);
  var event = pluginManager.fireEvent('MessageSendEvent', {message: Message});
    //If event is canceled don't send message to channel
  if(event.result === Result.deny) {
    console.log(event.name + " was canceled");
    return;
  }

  var m = channel.addMessage(event.message);
  if(m) {
    //Send to connected
    for(var i = 0; i < connections.length; i++) {
      sendConnMessage(m, connections[i]);
    }
  }

};

//Send a message to a client connected as a user
var sendConnMessage = function(message, conn) {
  if(!conn.user) {
    console.log("Unknow user attempting to get message!");
    return;
  }
  //Clone message to allow for modifications
  var localMessage = JSON.parse(JSON.stringify(message));

  var event = pluginManager.fireEvent("UserMessageSendEvent", {message: localMessage, username: conn.user.name});
  if(event.result === Result.deny) {
    console.log("event was canceled!");
    return;
  }
  conn.socket.emit('message', event.message);
};


var sendChannels = function(socket) {
  if(socket) {
    socket.emit("channels", {channels: channels});
  } else {
    for(var i = 0; i < connections.length; i++) {
      sendChannels(connections[i].socket);
    }
  }
};


//Listen for plugins finish loading events
pluginManager.registerEvent(null, "PluginsFinishedLoadingEvent", function(event) {
  //load all channels, users, messages
  storage.loadChannels(function() {
    storage.loadUsers(function() {
      storage.loadMessages();

    });

  });
});
createChannel('general');
createChannel('random');
createUser('joe').name = "joe";
createUser('chatterbot');




require('socketio-auth')(io, {
  authenticate: function (socket, data, callback) {
    console.log("Event");
    var event = pluginManager.fireEvent("UserPreAuthenticateEvent", {data: data});
    if(event.result === Result.deny) {
      return callback(new Error(event.errorMessage));
    }

    var resultData;
    if(data.type === "login") {
      auth.authLogin(data, done);
    } else {
      auth.authSignup(data, done);
    }
    function done(resultData) {
      if(resultData.success) {
        return callback(null, getUser(resultData.username));
      } else {
        return callback(new Error(resultData.error));
      }

    }
  },
  postAuthenticate: function(socket, data, user) {
    if(!user) {
      console.log("Unable to find user from authed");
      console.log("This is likely an error from auth not returning a username to match too. In the future this may result in disconnecting user");
    }
    var connection = {user: null, socket: socket};
    socket.connection = connection;
    socket.connection.user = user;
    connections.push(connection);
    var event = pluginManager.fireEvent("UserConnectEvent", {data: data, user: user});
    if(event.result === Result.deny) {
      //You shall not pass!!
      socket.connection.user = null;
      connections.splice(connection, 1);
      socket.disconnect();
      return;
    }
    user.setOnline(true);
    sendChannels(socket);
    //once authtificated then listen to events and add to connection



    //Tell socket to listen to global events
    sevents.forEach(function(sevent) {
      socket.on(sevent.name, sevent.callback.bind(this, socket.connection.user));
    });

    //Listen for messages from socket
    socket.on('message', function(message) {
      //Receive message
      //Need to catch error here

      console.log(message.channel + " " + message.text);
      sendMessage(connection.user, getChannel(message.channel), message.text);
    });


    socket.on('getMessages', function(data) {
      var channel = channels[data.channel];
      var num = data.num;
      num = num || 100;
      if(channel) {
        for(var i = num - 1; i >= 0; i--) {
          var message = channel.getMessageAtIndex(i);
          if(message) {
            sendConnMessage(message, connection);
          }
        }
      }

    });

    socket.on('disconnect', function(data) {
      connection.user.setOnline(false);
      var event = pluginManager.fireEvent("UserDisconnectEvent", {user: connection.user});
      connection.socket.connection = null;
      connections.splice(connection, 1);
    });

    socket.on('channels', function() {
      sendChannels(socket);
    });


  }
});

io.on('connection', function(socket) {

  socket.emit("SLFields", {login: auth.clientLoginFields(), signup: auth.clientSignupFields()});

  // socket.emit("LoginFields", auth.clientLoginFields());
  // socket.emit("SignupFields", auth.clientSignupFields());
  socket.on('getPlugins', function(data, callback) {
    var fs = require("fs");
    if(!fs.existsSync("client/plugins")) {
      try {
        fs.mkdirSync("client/plugins");
      } catch(e) {
        //Plugin directory does not exists could not be created. Error out..
        console.log("Plugin Dir could not be found or created");
        throw new Error("Not plugin dir");
      }
    }
    fs.readdir("client/plugins", function(err, data) {
      var obj = {};
      for(var i = 0; i < data.length; i++) {
        var parsed = JSON.parse(fs.readFileSync("client/plugins/"+data[i] + "/plugin.json"));
        obj[data[i]] = parsed;
      }
      socket.emit("getPlugins", obj);
    });
  });
});



function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

console.log(chatter);
