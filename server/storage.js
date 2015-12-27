'use strict'
class Storage {
  constructor(name) {
    this.name = name;
  }

  loadUsers(done) {
    done()
  }

  saveUsers(users, done) {
    done()
  }


  loadMessages() {
  }

  saveMessages(messages, done) {
    done()
  }

  loadChannels(done) {
    done()
  }

  saveChannels(channels, done) {
    done()
  }

  start() {

  }

  stop() {

  }



}
module.exports.Storage = Storage
