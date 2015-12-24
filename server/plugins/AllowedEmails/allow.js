module.exports = function(chatter) {
  var config = chatter.loadConfig(__dirname + '/config.json');
  if(config.get("enabled")) {
    chatter.pluginManager.registerEvent("UserPreAuthenticateEvent", function(event) {
      console.log(event.data)
      if(event.data.type === "signup") {
        console.log(config.get('allowed'))
        console.log(event.data.email.split("@")[1])
        if(config.get('allowed') !== event.data.email.split("@")[1]) {
          event.result = event.Results.deny;
          event.errorMessage = config.get("errorMessage");
        }
      }
    }, 3);
    
  }
}