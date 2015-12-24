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
var Config = require("./config").Config
var _ = require('lodash');
var jwtSecret = 'secretsss';

app.use(express.static(__dirname + '/client'));


http.listen(3030, function() {
  console.log("listening on 3030")
});

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

GLOBAL.chatter = this;
var channels = {};
var users = {};
var connections = [];
//Auth system currently being used
var auth;


var request = chatter.request = function(options, callback) {
  req("http://"+options.host+options.path, function(err, response, body) {
    callback(JSON.parse(body));
  })
}


//current operation is O(n) n is all users which can become costly operations
var getOnlineUsers = chatter.getOnlineUsers = function() {
  return _.filter(users, function(user, key) {
    return user.isOnline();
  })
}


var sevents = [];
var listenToAll = chatter.listenToAll = function(name, callback) {
  //Tell all sockets already connected to listen to this event
  connections.forEach(function(connection) {
    connection.socket.on(name, callback);
  })
  sevents.push({name: name, callback: callback});

}

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
  sendChannels();
}

var getChannel = chatter.getChannel = function(name) {
  if(channels[name]) {
    return channels[name];
  }
}

var createUser = chatter.createUser = function(name) {
  if(users[name] !== undefined) {
    return;
  }
  var event = pluginManager.fireEvent("CreateUserEvent", {user: new User(name)});
  if(event.result === Result.deny) {
    console.log(event.name + " was canceled");
    return;
  }
  users[event.user.name] = event.user;
  return event.user;
}

var getUser = chatter.getUser = function(name) {
  return users[name];
}

var loadConfig = chatter.loadConfig = function(f) {
  return new Config(f);
}

var getPlugin = chatter.getPlugin = function(name) {
  return pluginManager.getPlugin(name);
}

var setAuth = chatter.setAuth = function(newAuth) {
  //check if newAuth is instance of auth
  if(newAuth instanceof Auth) {
    //stop old system
    if(auth) {
      auth.stop();
    }
    newAuth.start();
    auth = newAuth;
    console.log("Using Auth system " + auth.name)
  } else {
    throw "Auth System must inherit Auth class";
  }
}
//default to empty permission system
setAuth(new Auth("default"))


var sendMessage = chatter.sendMessage = function(user, channel, text) {
  if(!user || !channel || !text) {
    console.log("Invalid message");
    return;
  }
  var Message = new message.Message(channel.name, text,user.name);
  var event = pluginManager.fireEvent('MessageSendEvent', {message: Message});
    //If event is canceled don't send message to channel
  if(event.result === Result.deny) {
    console.log(event.name + " was canceled");
    return;
  }

  channel.messages.push(event.message);
  //Send to connected
  for(var i = 0; i < connections.length; i++) {
    sendConnMessage(event.message, connections[i]);
  }

}

//Send a message to a client connected as a user
var sendConnMessage = function(message, conn) {
  if(!conn.user) {
    console.log("Unknow user attempting to get message!");
    return;
  }
  //Clone message to allow for modifications
  var localMessage = JSON.parse(JSON.stringify(message));

  var event = pluginManager.fireEvent("UserMessageSendEvent", {message: localMessage, username: conn.user.name})
  if(event.result === Result.deny) {
    console.log("event was canceled!")
    return;
  }
  conn.socket.emit('message', event.message)
}


var sendChannels = function(socket) {
  if(socket) {
    socket.emit("channels", {channels: channels})
  } else {
    for(var i = 0; i < connections.length; i++) {
      sendChannels(connections[i].socket);
    }
  }
}



createChannel('general');
createChannel('random');
createUser('joe').name = "joe"
createUser('chatterbot')




require('socketio-auth')(io, {
  authenticate: function (socket, data, callback) {
    var event = pluginManager.fireEvent("UserPreAuthenticateEvent", {data: data});
    if(event.result === Result.deny) {
      console.log(event)
      return callback(new Error(event.errorMessage));
    }

    var resultData;
    if(data.type === "login") {
      resultData = auth.authLogin(data);
    } else {
      resultData = auth.authSignup(data);
    }
    console.log(resultData)
    if(resultData.success) {
      return callback(null, resultData.profile);
    } else {
     return callback(new Error(resultData.error))
    }
  },
  postAuthenticate: function(socket, data, profile) {
    var user = getUser(profile.username);
    if(!user) {
      console.log("Unable to find user from authed");
      console.log("This is likely an error from auth not returning a username to match too. In the future this may result in disconnecting user")
    }
    var connection = {user: null, socket: socket};
    socket.connection = connection;
    socket.connection.user = user;
    var event = pluginManager.fireEvent("UserConnectEvent", {data: data, user: user});
    if(event.result === Result.deny) {
      //You shall not pass!!
      socket.connection.user = null;
      socket.disconnect();
      return;
    }
    user.setOnline(true);
    sendChannels(socket);
    connections.push(connection);
    //once authtificated then listen to events and add to connection



    //Tell socket to listen to global events
    sevents.forEach(function(sevent) {
      socket.on(sevent.name, sevent.callback);
    })

    //Listen for messages from socket
    socket.on('message', function(message) {
      //Receive message
      //Need to catch error here
      console.log(message.channel + " " + message.text);
      sendMessage(connection.user, getChannel(message.channel), message.text);
    });


    socket.on('getMessages', function(data) {
      var channel = channels[data.channel];
      if(channel) {
        for(var i = 0; i < channel.messages.length; i++) {
          sendConnMessage(channel.messages[i], connection);
        }
      }

    })

    socket.on('disconnect', function(data) {
      connection.user.setOnline(false);
      var event = pluginManager.fireEvent("UserDisconnectEvent", {user: connection.user});
      connection.socket.connection = null;
      connections.splice(connection, 1)
    })

    socket.on('channels', function() {
      sendChannels(socket);
    })


  }
})

io.on('connection', function(socket) {






  socket.emit("LoginFields", auth.clientLoginFields())
  socket.emit("SignupFields", auth.clientSignupFields())

  //sendChannels(socket)



  socket.on('getPlugins', function(data, callback) {
    var fs = require("fs");
    fs.readdir("client/plugins", function(err, data) {
      var obj = {};
      for(var i = 0; i < data.length; i++) {
        var parsed = JSON.parse(fs.readFileSync("client/plugins/"+data[i] + "/plugin.json"));
        obj[data[i]] = parsed;
      }
      socket.emit("getPlugins", obj);
    })
  })
});
