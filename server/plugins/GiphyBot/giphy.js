module.exports = function(chatter) {
  var giphy = chatter.createUser('GiphyBot');
  giphy.setOnline(true);

  chatter.pluginManager.registerEvent("MessageSendEvent", function(event) {
    if(event.message.text.substring(0, 5) === "giphy") {
      var search = event.message.text.substring(6, event.message.text.length);
      var path = "/v1/gifs/search?q="+search.split(' ').join("+")+"&api_key=dc6zaTOxFJmzC&limit=1";
      chatter.request({
        host: "api.giphy.com",
        path: path,
      }, function(res) {
        giphy.sendMessage(chatter.getChannel(event.message.channel), JSON.stringify({type: 'img', src:res.data[0].images["fixed_height"].url}))
      })
      
    }
    
  })

}