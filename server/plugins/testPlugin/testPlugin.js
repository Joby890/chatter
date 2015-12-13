module.exports = function(chatter) {
  this.test = "We created a plugin!";
  chatter.pluginManager.registerEvent("MessageSendEvent", function(event) {
    console.log("New Message sent by: " + event.message.user)
    console.log("Text: " + event.message.text)
  }, 3);
  chatter.pluginManager.registerEvent("UserMessageSendEvent", function(event) {
    var message = event.message.text;
    var index;
    while(message.indexOf("{{username}}") >= 0) {
      index = message.indexOf("{{username}}");
      message = message.substring(0, index) + event.username + message.substring(index + 12, message.length);
    }
    event.message.text = message;
  }, 1)

  chatter.pluginManager.registerEvent("UserConnectEvent", function(event) {
    chatter.sendMessage(chatter.getUser('chatterbot'), chatter.getChannel('general'), "Hello " + event.user.name +  " welcome to chatter")
  })

  var testAuth = require('./testAuth').TestAuth;
  chatter.setAuth(new testAuth());
}