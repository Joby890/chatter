export default function(chatter) {

  var unreadCount = {};

  chatter.pluginManager.registerEvent('MessageRecievedEvent', function(event) {
    var channel = event.message.channel;
    unreadCount[channel] = unreadCount[channel] || 0;
    if(chatter.getCurrentChannel() !== channel) {
      unreadCount[channel] = unreadCount[channel] + 1;
    } else {
      unreadCount[channel] = 0;
    }
    chatter.getPanel('left').updatePage('channellist');

  });

  chatter.pluginManager.registerEvent("ChannelRenderEvent", function(event) {
    if(unreadCount[event.name]) {
      event.name = event.name + " (" + unreadCount[event.name] + ")"; 
    }
  });
}