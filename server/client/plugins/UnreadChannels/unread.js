export default function(chatter) {

  this.onEnable = function() {
    var unreadCount = {};

    chatter.pluginManager.registerEvent(this, 'MessageRecievedEvent', function(event) {
      var channel = event.message.channel;
      unreadCount[channel] = unreadCount[channel] || 0;
      if(chatter.getCurrentChannel() !== channel) {
        unreadCount[channel] = unreadCount[channel] + 1;
      } else {
        unreadCount[channel] = 0;
      }
      chatter.getPanel('left').updatePage('channellist');

    });

    chatter.pluginManager.registerEvent(this, "ChannelRenderEvent", function(event) {
      if(unreadCount[event.name]) {
        event.name = event.name + " (" + unreadCount[event.name] + ")";
      }
    });

  }

}
