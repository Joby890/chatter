'use strict'
class User {
  constructor(name) {
    this._name = name;
    this.online = false;
  }

  isOnline() {
    return this.online;
  }

  sendMessage(channel, text) {
    chatter.sendMessage(this, channel, text);
  }

  setOnline(bool) {
    var event = chatter.pluginManager.fireEvent("UserOnlineStatusChangeEvent", {status: bool, old: this.online});
    if(event.result === event.Results.deny) {
      return;
    }
    this.online = event.status;

  }
  set name(name) {
    var event = chatter.pluginManager.fireEvent('UserChangeNameEvent', {old: this._name, name: name});
    if(event.result === event.Results.deny) {
      return;
    }
    this._name= event.name;
  }
  get name() {
    return this._name;
  }

}

module.exports.User = User;