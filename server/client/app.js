var injectTapEventPlugin = require('react-tap-event-plugin');



var React = require("react");
var ReactDOM = require("react-dom");
var io = require('socket.io-client');
var _ = require('lodash');
var pluginManager = require("./pluginManager");
var socket;


var ChannelList = require("./components/ChannelList");
var Messages = require("./components/Messages");
var SendMessage = require("./components/SendMessage");
var App = require("./components/App");
//Needed for onTouchTap
//Can go away when react 1.0 release
//Check this repo:
//https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();


//Connect to chatter server
socket = io();

//TODO do not give global access to socket
window.socket = socket;

//Listen for auth messages
socket.on('authenticated', function(data) {
  console.log("Authed");
  onceAuthed();
  //hasAuthed = true;
});
socket.on('unauthorized', function(data) {
  alert(data.message);
});



//Give access to React to all files
window.React = React;
var Login = require("./components/Login");
window.gotFields = function gotFields() {

  ReactDOM.render(<Login />, document.getElementById("app"));
};










var Modal = require("./models/Modal");

window.Page = require("./models/Page");

var chatter = {
  pluginManager: pluginManager(this, socket),
};

window.chatter = chatter;

var matUi = require('material-ui');
console.log(matUi.RaisedButton);
//import {RaisedButton, DropDownMenu, MenuItem} from 'material-ui';

//temp config idea for changing theme
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

var app;
var onceAuthed = function() {
  app = ReactDOM.render(<App />, document.getElementById("app"));
  chatter.getPanel = app.getPanel;


  chatter.findPage = function(id) {
    for(var key in app.state.panels) {
      var found = app.state.panels[key].findPage(id);
      if(found) {
        return found;
      }
    }
  };

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

  chatter.getPanel('left').addPage(null, new Page('channtls', 1, ChannelList, 'Channels', [], true));

  //Messages Page

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
  chatter.getPanel('bottom').addPage(null, new Page('sendmessages', 2, SendMessage, null, [], true));
  //Let plugins know that we have offically authed with the server
  var event = chatter.pluginManager.fireEvent("AfterAuthEvent", {});
  //Once we have finished authed load messages from currernt channel
  socket.emit('getMessages', {channel: chatter.getCurrentChannel()});


};

chatter.getCurrentChannel = function() {
  return currentChannel;
};

chatter.setCurrentChannel = function(newChannel) {
  //Possibly emit an event here...
  currentChannel = newChannel;
};

chatter.forceUpdate = function() {
  app.forceUpdate();
};

chatter.pluginManager.initialize(socket);
//Add our channellist to our left panel

console.log(chatter);


window.uuid = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });

};
