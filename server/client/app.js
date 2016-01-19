var injectTapEventPlugin = require('react-tap-event-plugin');



var React = require("react");
var ReactDOM = require("react-dom");
var io = require('socket.io-client');
var _ = require('lodash');
var pluginManager = require("./pluginManager");
var socket;



//Needed for onTouchTap
//Can go away when react 1.0 release
//Check this repo:
//https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();


//Connect to chatter server
socket = io();

//Listen for auth messages
socket.on('authenticated', function(data) {
  console.log("Authed");
  onceAuthed();
  //hasAuthed = true;
});
socket.on('unauthorized', function(data) {
  alert(data.message);
});


var hasAuthed = false;
var loginPrompts;
var signUpPromts;
//listen for connect and get login fields and signup fields
socket.on('connect', function() {
  //If we already have the prompts no need to listen for them
  console.log("connected");
  if(!loginPrompts && !signUpPromts) {
    socket.on('LoginFields', function(data) {
      console.log("Got login fiels", data);
      loginPrompts = data;
      if(signUpPromts && !hasAuthed) {
        gotFields();


      }
    });
    socket.on('SignupFields', function(data) {
      console.log("Got signup fiels", data);
      signUpPromts = data;
      if(loginPrompts && !hasAuthed) {
        gotFields();
      }
    });

  }
});

function gotFields() {
  var Login = React.createClass({

    getInitialState() {
      return {login: true};
    },
    handleSubmit(e) {
      e.preventDefault();
    },
    sendLogin() {
      var login = this.state.login;
      var loginInfo = {type: (login ? "login" : "signup")};
      if(login) {
        loginPrompts.forEach(function(key) {
          loginInfo[key] = this[key].value;
        });

      } else {
        signUpPromts.forEach(function(key) {
          loginInfo[key] = this[key].value;
        });
      }

      socket.emit('authentication', loginInfo);

    },

    swapForm() {
      this.setState({
        login: !this.state.login,
      });
    },

    render() {
      var fields;
      if(this.state.login) {
        fields = loginPrompts.map(function(key) {
          return <div key={key}> {key} <input ref={(c) => this[key] = c} /></div>;
        });
      } else {
        fields = signUpPromts.map(function(key) {
          return <div key={key}> {key} <input ref={(c) => this[key] = c} /></div>;
        });
      }


      return (
        <div>
          <form onSubmit={this.handleSubmit}>
            {fields}
            <input type='submit' onClick={this.sendLogin} value={this.state.login ? "Login" : "Signup"}/>
          </form>
          <input type='button' onClick={this.swapForm} value={!this.state.login ? "Go to Login" : "Go to Signup"}/>
        </div>
      );
    }

  });
  ReactDOM.render(<Login />, document.getElementById("app"));
}

//Give access to React to all files
window.React = React;

var InternalPage = React.createClass({

  handleOption(e, index, value) {
    var page = this.props.children;
    if(page.options[index]) {
      page.options[index].callback.call(page, this);
    } else {
      console.log("Closing page", page);
      this.props.close();
    }
  },

  getInitialState() {
    return {
      modals: {},
    };
  },

  componentDidMount() {
    var modals = this.props.children.pages.reduce(function(obj, modal) {
      obj[modal.id] = false;
      return obj;
    }, {});
    this.setState({
      modals: modals,
    });
  },

  openModalPage(id) {
    var event = chatter.pluginManager.fireEvent("ModalOpenEvent", {modal: this.props.children.getModalById(id)});
    if(event.result === Result.deny) {
      return;
    }
    this.state.modals[event.modal.id] = true;
    this.setState({
      modals: this.state.modals,
    });
  },


  handleModelClose(id) {
    var event = chatter.pluginManager.fireEvent("ModalCloseEvent", {modal: this.props.children.getModalById(id)});
    if(event.result === Result.deny) {
      return;
    }
    this.state.modals[id] = false;
    this.setState({
      modals: this.state.modals,
    });
  },

  render() {
    var self = this;
    var page = this.props.children;

    var dropdownItems = page.options.map(function(o) {
      return React.createElement(chatter.styles.MenuItem, {key: o.name, value: o.name, primaryText: o.name});
    });
    if(page.canClose) {
      dropdownItems.push(React.createElement(chatter.styles.MenuItem, {value: "Close", primaryText: "Close"}));
    }

    var modals = page.pages.map(function(modal) {

      const actions = [
        <chatter.styles.Button
          label="Close"
          primary={true}
          onTouchTap={self.handleModelClose.bind(self, modal.id)} />,
        ];

      var inner = modal.components.map(function(comp) {
        return comp.component;
      });
      var open = self.state.modals[modal.id] || false;
      return React.createElement(chatter.styles.Modal, {key: modal.id, title: modal.name, actions:actions, modal: true, open: open}, inner);
    });

    if(page) {
      if(!page.name) {
        page.name = "";
      }
      if(dropdownItems.length) {
        return (
          React.createElement("div", null,
            React.createElement(chatter.styles.DropDownMenu, {value:"", style: {right: "0px", position:"absolute"}, onChange: this.handleOption},
              dropdownItems
            ),
            React.createElement("span", null, page.name),
            modals,
            React.createElement(page.component)
            )
          );

      } else {
        return (
          React.createElement("div", null,
            React.createElement("span", null, page.name),
            modals,
            React.createElement(page.component)
            )
          );
      }
    } else {
      return (<div> </div>);
    }

  },
});

var Panel = React.createClass({

  getInitialState() {
    return {
      pages: [],
    };
  },

  addPage(plugin, page) {
    if( (! (plugin instanceof Plugin)) && plugin !== null ) {
      throw new Error("First prama needs to be a plugin or null value");
    }
    if(!(page instanceof Page)) {
      throw new Error("Second prama needs to be a page");
    }
    //Generate an ID for each page for react to track
    page.id = uuid();
    page.plugin = plugin;
    var pages = this.state.pages.concat(page);
    this.setState({
      pages: pages.sort(function(a,b) {return a.weight - b.weight;}),
    });
  },

  hasPage(page) {
    return this.state.pages.indexOf(page) >= 0;
  },

  updatePage(id) {
    this.setState({
      pages: this.state.pages,
    });
  },

  removePage(page) {
    var pages = this.state.pages.filter(function(p) {
      if(page === p) {
        console.log(p, " matches ", page);
        return false;
      } else {
        return true;
      }
    });
    this.setState({
      pages: pages,
    });
  },

  removePages(plugin) {
    var pages = this.state.pages.filter(function(page) {
      return page.plugin !== plugin;
    });
    this.setState({
      pages: pages,
    });
  },

  render() {
    var style = _.extend({
      width: this.props.width,
      height: this.props.height,
      top: this.props.top,
      left: this.props.left,
      position: "absolute",
      overflow: "auto",
    }, this.props.style);
    var self = this;
    var pages = this.state.pages.map(function(page) {
      return React.createElement(InternalPage, {key: page.id, close: self.removePage.bind(null, page)}, page);
      //return React.createElement(page.component, null);
    });
    return (
      <div className="test" style={style}>
        {pages}
      </div>
    );
  }
});

var ChannelList = React.createClass({

  getInitialState() {
    return {channels: []};
  },

  componentDidMount() {
    var self = this;
    socket.on('channels', function(data) {
        self.setState({
          channels: Object.keys(data.channels),
        });
    });
  },
  clickChannel: (name) => {
    var event = chatter.pluginManager.fireEvent("ChannelChangeEvent", {old: currentChannel, name: name});
    if(event.result === Result.deny) {
      console.log("Channel changed canceled");
      return;
    }
    currentChannel = name;
    socket.emit('getMessages', {channel: name});
  },
  render() {
    var self = this;
    var channels = this.state.channels.map(function(key) {
      var event = chatter.pluginManager.fireEvent("ChannelRenderEvent", {name: key});
      if(event.result === Result.deny) {
        console.log("ChannelRender event canceled");
        return;
      }
      return (<div key={event.name} onClick={self.clickChannel.bind(self, key)}> {event.name} </div>);
    });
    return (
      <div> {channels} </div>
    );
  }

});

var Messages = React.createClass({
  getInitialState() {
    return {messages: []};
  },


  handleMessages(newMessages) {
    var self = this;
    var messages;
    if(self.state && self.state.messages) {
      messages = self.state.messages;
    } else {
      messages = [];
    }
    for(var i = 0; i < newMessages.length; i++) {
      var message = newMessages[i];
      var event = chatter.pluginManager.fireEvent("MessageRecievedEvent", {message: message});
      if(event.result === Result.deny) {
        console.log("Message was canceled");
        return;
      }
      if(currentChannel === event.message.channel) {

        var nextEvent = chatter.pluginManager.fireEvent("MessageShowEvent", {message: event.message});
        if(nextEvent.result === Result.deny) {
          console.log("Message was canceled");
          return;
        }
        messages.push(nextEvent.message);
      }
      self.setState({
        messages: messages
      });

    }
  },

  componentDidMount() {
    var self = this;
    chatter.pluginManager.registerEvent(null, "ChannelChangeEvent", function(event) {
      console.log("Channel changing to: " + event.name);
      self.setState({
        messages: [],
      });
    });

    socket.on("message", function(message) {
      self.handleMessages([message]);
    });
    socket.on('messages', this.handleMessages);
  },
  render() {
    var messages = this.state.messages.map(function(message) {
      var time = new Date(message.timeStamp).toLocaleTimeString().replace(/:\d+ /, ' ');
      var event = chatter.pluginManager.fireEvent("MessageRenderEvent", {components: [], defaultUserMessage: true, defaultText: true, time: time, message: message});
      if(event.result === Result.deny) {
        console.log("Event was denyed");
        return;
      }
      if(event.defaultUserMessage) {
        event.components.push({weight: 3, component: <span key="nameTime">  {message.user}  {time} </span> });
      }
      if(event.defaultText) {
        event.components.push({weight: 4, component: <div key="messageText"> {message.text} </div> });
      }
      event.components.sort(function(a, b) {
        return a - b;
      });
      var mapped = event.components.map(function(m) {
        return m.component;
      });

      return (
        <div key={message.id}>
          {mapped}

        </div>);
    });
    return (
      <div>
        {messages}
      </div>
    );
  }

});

var SendMessage = React.createClass({
  sendMessage: function(e) {
    socket.emit("message", {channel: currentChannel, text: this.textInput.value});
    this.textInput.value = "";
  },
  handleSubmit: function(e) {
    e.preventDefault();
  },
  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <input ref={(c) => this.textInput = c} />
          <input type='submit' onClick={this.sendMessage} value="Send"/>
        </form>
      </div>

    );
  }

});

var App = React.createClass({

  getInitialState : function(){

    return{
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      messages : []
    };
  },

  handleResize: function() {
    var event = chatter.pluginManager.fireEvent("WindowResizeEvent", {});
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

  },

  componentDidMount: function() {
    var self = this;
    window.addEventListener('resize', this.handleResize);
  },

  getPanel(name) {
    if(name === "left") {
      return this.left;
    } else if(name === "center") {
      return this.center;
    } else if(name === "right") {
      return this.right;
    } else if(name === "bottom") {
      return this.bottom;
    }
  },
  render() {
    var testStyles = {
      panelLeft: {background: "#9E9E9E"},
      panelCenter: {background: "#fff"},
      panelRight: {background: "#eee"},
      panelBottom: {background: "#ee9"},
    };

    return (
      <div>
        <Panel style={testStyles.panelLeft} top="0" left="0"  width="200" height={this.state.windowHeight} ref={(comp) => this.left = comp}>  </Panel>
        <Panel style={testStyles.panelCenter} top="0" left="200"  width={this.state.windowWidth - 500 -200} height={this.state.windowHeight * 0.9} ref={(comp) => this.center = comp}>  </Panel>
        <Panel style={testStyles.panelRight} top="0" left={this.state.windowWidth - 500}  width="500" height={this.state.windowHeight} ref={(comp) => this.right = comp}>  </Panel>
        <Panel style={testStyles.panelBottom} top={this.state.windowHeight * 0.9} left="200" width={this.state.windowWidth - 500 -200} height={this.state.windowHeight * 0.1} ref={(comp) => this.bottom  = comp}> </Panel>
      </div>
    );
  }
});


class Modal {
  constructor(options) {
    this.id = options.id;
    this.name = options.name || "";

    this.components = [];
  }

  addComponent(obj) {
    this.components.push(obj);
    this.components.sort(function(a,b) {
      return a.weight - b.weight;
    });
  }

}



class Page {
  constructor(weight, component, name, options, canClose) {
    this.name = name;
    this.weight = weight;
    this.component = component;
    this.options = [];
    if(options) {
      this.options = this.options.concat(options);
    }
    this.canClose = !canClose;
    this.pages = [];
  }

  addModelPage(modal) {
    this.pages.push(modal);
  }

  getModalById(id) {
    return _.find(this.pages, function(modal) {
      return modal.id === id;
    })
  }


}

window.Page = Page;

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

  chatter.getPanel('left').addPage(null, new Page(1, ChannelList, 'Channels', [], true));

  //Messages Page

  //Drop down Options
  var DDOptions = [
    {
      name: "Channel Settings",
      callback: function(internalPage) {
        internalPage.openModalPage("settings");
      }
    }
  ];
  var messagesPage = new Page(1, Messages, null, DDOptions, true);

  //Modal for settings
  var channelSettings = new Modal({id: "settings", name: "Channel Settings"});
  channelSettings.addComponent({weight: 1, component: <div> TEst </div>});
  messagesPage.addModelPage(channelSettings);

  chatter.getPanel('center').addPage(null, messagesPage);
  chatter.getPanel('bottom').addPage(null, new Page(2, SendMessage, null, [], true));
  //Let plugins know that we have offically authed with the server
  var event = chatter.pluginManager.fireEvent("AfterAuthEvent", {});
  //Once we have finished authed load messages from currernt channel
  socket.emit('getMessages', {channel: chatter.getCurrentChannel()});


};

chatter.getCurrentChannel = function() {
  return currentChannel;
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
