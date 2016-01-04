module.exports = function(chatter) {
  this.test = "We created a plugin!";

  this.onEnable = function() {
    var config = chatter.loadConfig(__dirname + "/config.json");
    chatter.pluginManager.registerEvent(this, "MessageSendEvent", function(event) {
      console.log("New Message sent by: " + event.message.user)
      console.log("Text: " + event.message.text)
    }, 3);
    chatter.pluginManager.registerEvent(this, "UserMessageSendEvent", function(event) {
      var message = event.message.text;
      var index;
      while(message.indexOf("{{username}}") >= 0) {
        index = message.indexOf("{{username}}");
        message = message.substring(0, index) + event.username + message.substring(index + 12, message.length);
      }
      event.message.text = message;
    }, 1)

    chatter.pluginManager.registerEvent(this, "UserConnectEvent", function(event) {
      chatter.sendMessage(chatter.getUser('chatterbot'), chatter.getChannel('general'), "Hello " + event.user.name +  " welcome to chatter")
    })
    if(config.get("Use Permissions Test")) {
      var testAuth = require('./testAuth').TestAuth;
      chatter.setAuth(new testAuth());
    }



    setInterval(function() {
      //console.log(chatter.getOnlineUsers())
    }, 5000)

  }

}
