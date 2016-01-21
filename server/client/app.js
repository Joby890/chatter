var injectTapEventPlugin = require('react-tap-event-plugin');

var React = require("react");
var ReactDOM = require("react-dom");
//Give access to React to all files
window.React = React;
var io = require('socket.io-client');
var _ = require('lodash');
var pluginManager = require("./pluginManager");
var socket;

injectTapEventPlugin();

//Connect to chatter server
socket = io();
//TODO do not give global access to socket
window.socket = socket;

//Load all the default components
var ChannelList = require("./components/ChannelList");
var Messages = require("./components/Messages");
var SendMessage = require("./components/SendMessage");
var App = require("./components/App");
//Load the default models
var Modal = require("./models/Modal");
window.Page = require("./models/Page");
//Setup the global chatter obj;
window.chatter = {
  pluginManager: pluginManager(this, socket),
};



//Simple Sound Support
var sounds = {};
chatter.registerSound = function(name, audio) {
  var event = chatter.pluginManager.fireEvent("SoundRegisterEvent", {name: name, audio: audio});
  if(event.result === Result.deny) {
    console.log("Canceled");
    return;
  }
  sounds[event.name] = event.audio;
};

chatter.playSound = function(name) {
  var sound = chatter.getSound(name);
  if(!sound) {
    return;
  }
  var event = chatter.pluginManager.fireEvent("PlaySoundEvent", {name: name, audio: sound});
  if(event.result === Result.deny) {
    return;
  }
  event.audio.play();
};

chatter.getSound = function(name) {
  return sounds[name];
};

//Setup the styling to be used by the app.
var matUi = require('material-ui');

var styles = {
  Button: matUi.RaisedButton,
  DropDownMenu: matUi.DropDownMenu,
  //Input: reactMat.Input,
  MenuItem: matUi.MenuItem,
  Modal: matUi.Dialog,
};
chatter.styles = styles;

var currentChannel = "general";

chatter.send = function(name, data) {
  socket.emit(name, data);
};

//Allow a plugin to listen for events from the server
chatter.listen = function(plugin, name, callback) {
  if( (! (plugin instanceof Plugin)) && plugin !== null ) {
    throw new Error("First prama needs to be a plugin or null value");
  }
  //TODO enable to be able to remove callback when a plugin disabled
  socket.on(name, callback);

};

//Find a page from the panels
chatter.findPage = function(id) {
  for(var key in app.state.panels) {
    var found = app.state.panels[key].findPage(id);
    if(found) {
      return found;
    }
  }
};

//Find a modal that is on a page
chatter.findModal = function(id) {
  var result;
  _.each(app.state.panels, function(panel) {
    //console.log(panel);
      _.each(panel.state.pages, function(page) {
        var found = page.findModal(id);
        if(found && !result) {
          result = found;
        }
      });
  });
  return result;
};

//Return the current channel the user is on
chatter.getCurrentChannel = function() {
  return currentChannel;
};
//Set the current channel the user is on
chatter.setCurrentChannel = function(newChannel) {
  //Possibly emit an event here...
  currentChannel = newChannel;
};

chatter.forceUpdate = function() {
  app.forceUpdate();
};
//Render the app
var app = ReactDOM.render(<App />, document.getElementById("app"));

//Once we have set everything else up initalize the plugin manager
chatter.pluginManager.initialize(socket);
//Give access to getPanel to chatter
chatter.getPanel = app.getPanel;

//Add the default components
//Add the default channel list
chatter.getPanel('left').addPage(null, new Page('channtls', 1, ChannelList, 'Channels', [], true));
//Setup and add the Messages Page
//Drop down Options
var DDOptions = [
  {
    name: "Channel Settings",
    callback: function(internalPage) {
      internalPage.openModalPage("channelsettings");
    }
  }
];
var messagesPage = new Page('messages', 1, Messages, null, DDOptions, true);

//Modal for settings
var channelSettings = new Modal({id: "channelsettings", name: "Channel Settings"});
messagesPage.addModelPage(channelSettings);

chatter.getPanel('center').addPage(null, messagesPage);
//Add the Message Box to the page
chatter.getPanel('bottom').addPage(null, new Page('sendmessages', 2, SendMessage, null, [], true));

//Once we have finished authed load messages from currernt channel
socket.emit('getMessages', {channel: chatter.getCurrentChannel()});

window.uuid = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};
