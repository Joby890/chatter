var React = require("react");
var ReactDOM = require("react-dom");
var io = require('socket.io-client');
var _ = require('lodash');
var pluginManager = require("./pluginManager");
var socket;



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
    this.state.pages.splice(page, 1);
    this.setState({
      pages: this.state.pages,
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

    var pages = this.state.pages.map(function(page) {
      return React.createElement(page.component, null);
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
      return (<div onClick={self.clickChannel.bind(self, key)}> {event.name} </div>);
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


  handleMessage(message) {
    var self = this;
    var messages;
    if(self.state && self.state.messages) {
      messages = self.state.messages;
    } else {
      messages = [];
    }
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
      console.log("Adding message ", nextEvent.message);
      messages.push(nextEvent.message);
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

    socket.on("message", this.handleMessage);
    socket.on('messages', function(messages) {
      for(var i = 0; i < messages.length; i++) {
        this.handleMessage(messages[i]);
      }
    });
  },
  render() {

    var messages = this.state.messages.map(function(message) {
      var time = new Date(message.timeStamp).toLocaleTimeString().replace(/:\d+ /, ' ');
      return (
        <div key={message.id}>
          <div> {time} </div>
          <span>  {message.user}: </span> <div> {message.text} </div>
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





class Page {
  constructor(weight, component, id) {
    this.id = id;
    this.weight = weight;
    this.component = component;
  }
}

var chatter = {
  pluginManager: pluginManager(this, socket),
};

window.chatter = chatter;

var currentChannel = "general";




chatter.send = function(name, data) {
  socket.emit(name, data);
};

var app;
var onceAuthed = function() {
  app = ReactDOM.render(<App />, document.getElementById("app"));
  chatter.getPanel = app.getPanel;

  chatter.getPanel('left').addPage(null, new Page(1, ChannelList, 'channellist'));
  chatter.getPanel('center').addPage(null, new Page(1, Messages));
  chatter.getPanel('bottom').addPage(null, new Page(2, SendMessage));
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
