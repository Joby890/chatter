'use strict'
class Message {
  constructor(channel, text,  user) {
    this.channel = channel;
    this.text = text;
    this.user = user;
  }
}

module.exports.Message = Message;
