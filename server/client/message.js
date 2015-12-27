'use strict'
class Message {
  constructor(channel, text,  user, id) {
    this.channel = channel;
    this.text = text;
    this.user = user;
    this.id = id;
  }
}

module.exports.Message = Message;
