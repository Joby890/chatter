'use strict'
class Message {
  constructor(channel, text,  user, id, timeStamp) {
    this.channel = channel;
    this.text = text;
    this.user = user;
    this.id = id;
    this.timeStamp = timeStamp;
  }
}

module.exports.Message = Message;
