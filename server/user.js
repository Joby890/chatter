'use strict'
class User {
  constructor(name) {
    this._name = name;
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