var React = require("react");
module.exports = React.createClass({

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
    var event = chatter.pluginManager.fireEvent("ChannelChangeEvent", {old: chatter.getCurrentChannel(), name: name});
    if(event.result === Result.deny) {
      console.log("Channel changed canceled");
      return;
    }
    chatter.setCurrentChannel(name);
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
