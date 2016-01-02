'use strict'
class Channel {
  constructor(name) {
    this.name = name;
    this.messages = [];

  }
}

module.exports.channel = Channel;
