module.exports = function(chatter) {
  var giphy = chatter.createUser('GiphyBot');
  giphy.setOnline(true);

  var config = chatter.loadConfig(__dirname + "/config.json");

  chatter.pluginManager.registerEvent("MessageSendEvent", function(event) {
    if(event.message.text.substring(0, 5) === "giphy") {
      var search = event.message.text.substring(6, event.message.text.length);
      var randomPick = config.get("Random Pick Number") || 1;
      var path = "/v1/gifs/search?q="+search.split(' ').join("+")+"&api_key=dc6zaTOxFJmzC&limit="+ randomPick;
      chatter.request({
        host: "api.giphy.com",
        path: path,
      }, function(res) {
        var num = Math.floor(Math.random() * randomPick);
        if(res.data[num]) {
          giphy.sendMessage(chatter.getChannel(event.message.channel), JSON.stringify({type: 'img', src:res.data[num].images["fixed_height"].url}))
        }
      })

    }

  })

}
