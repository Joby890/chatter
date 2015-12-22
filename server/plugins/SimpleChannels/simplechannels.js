module.exports = function(chatter) {
  console.log(chatter)
  chatter.listenToAll("createChannel", function(data) {
    chatter.createChannel(data.name);
  })
}