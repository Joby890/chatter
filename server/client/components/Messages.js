var React = require("react");
module.exports = React.createClass({
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
      if(chatter.getCurrentChannel() === event.message.channel) {

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
