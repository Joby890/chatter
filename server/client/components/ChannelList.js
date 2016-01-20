var React = require("react");
var ChannelList = React.createClass({

  getInitialState() {
    return {channels: []};
  },

  listenToChannels(data) {
    this.setState({
      channels: Object.keys(data.channels),
    });
  },

  componentDidMount() {
    var self = this;
    socket.on('channels', this.listenToChannels);
  },

  componentWillUnmount() {
    socket.removeListener('channels', this.listenToChannels);
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
module.exports = ChannelList;
