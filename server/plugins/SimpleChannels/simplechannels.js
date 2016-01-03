module.exports = function(chatter) {

  this.onEnable = function() {
    chatter.listenToAll("createChannel", function(data) {
      chatter.createChannel(data.name);
    })
  }

}
