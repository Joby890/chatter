var express = require("express");
var app = express();
var jwt = require('jsonwebtoken');

var http = require('http').Server(app);
var bodyParser = require('body-parser')
var io = require('socket.io')(http);
var message = require('./client/message');
var pm = require('./pluginManager');
var Result = pm.Result;
var pluginManager =  this.pluginManager = pm(this);
var Channel = require("./Channel").channel;
var User = require('./User').User;
var Auth = require('./Auth').Auth;

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




var createChannel = chatter.createChannel = function(name) {
  var event = pluginManager.fireEvent("CreateChannelEvent", {name: name});
  if(event.result === Result.deny) {
    console.log(event.name + " was canceled");
    return;
  }
  channels[event.name] = new Channel(event.name);
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
var sendConnMessage = chatter.sendConnMessage = function(message, conn) {
  if(!conn.user) {
    console.log("Unknow user attempting to get message!");
    return;
  }
  var localMessage = JSON.parse(JSON.stringify(message));
  //Global plugins notify
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
    for(var i = 0; i < sockets.length; i++) {
      sendChannels(connection[i].socket);
    }
  }
}



createChannel('general');
createChannel('random');
createUser('joe').name = "joe"
createUser('chatterbot')

require('socketio-auth')(io, {
  authenticate: function (socket, data, callback) {
    var resultData = auth.authLogin(data);
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
    }
    socket.connection.user = user;
    var event = pluginManager.fireEvent("UserConnectEvent", {data: data, user: user});
    if(event.result === Result.deny) {
      //You shall not pass!!
      socket.connection.user = null;
      socket.disconnect();
      return;
    }
  }
})

io.on('connection', function(socket) {
  var connection = {user: null, socket: socket};
  socket.connection = connection;

  sendChannels(socket)
 
  connections.push(connection);



  //Listen for messages from socket
  socket.on('message', function(message) {
    //Receive message
    console.log(message.channel + " " + message.text);
    //TODO not take message user but connection user
    sendMessage(getUser(message.user), getChannel(message.channel), message.text); 
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
    var event = pluginManager.fireEvent("UserDisconnectEvent", {user: connection.user});
    connection.socket.connection = null;
    connections.splice(connection, 1)
  })

  socket.on('channels', function() {
    sendChannels(socket);
  })

  socket.on('getPlugins', function(data, callback) {
    var fs = require("fs");
    fs.readdir("client/plugins", function(err, data) {
      var obj = {};
      for(var i = 0; i < data.length; i++) {
        var parsed = JSON.parse(fs.readFileSync("client/plugins/"+data[i] + "/plugin.json")); 
        obj[data[i]] = parsed;
      }
      socket.emit("getPlugins", obj);
      
      console.log("Got plugins request ",obj)
    })

    
  })
});