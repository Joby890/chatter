(function() {
  'use strict';
  class Channel {
    constructor(name) {
      this.name = name;
      this.messages = {};
      this.ids = [];

    }

    addMessage(message) {
      var event = chatter.pluginManager.fireEvent("MessageAddEvent", {message: message, channel: this});
      if(event.result === event.Results.deny) {
        console.log("Canceled");
        return;
      }
      this.messages[event.message.id] = event.message;
      this.ids.push(event.message.id);
      return event.message;
    }

    getMessage(id) {
      return this.messages[id];
    }

    editMessage(id, message) {
      var event = chatter.pluginManager.fireEvent("MessageEditEvent", {old: this.messages[id], message: message});
      if(event.result === event.Results.deny) {
        return;
      }
      this.messages[event.message.id] = event.message;
      return event.message;
    }
    getMessageAtIndex(x) {
      var getAt = this.ids.length - 1 - x;
      //var getAt = x;
      if(this.ids.length < getAt) {
        return null;
      }
      var id = this.ids[getAt];
      if(id) {
        var message = this.messages[id];
        if(message) {
          return message;
        }
      }
    }

    mostRecent() {
      return this.getMessageAtIndex(0);
    }

    removeMessage(id) {
      var event = chatter.pluginManager.fireEvent("MessageRemoveEvent", {message: this.messages[id]});
      if(event.result === event.Results.deny) {
        return;
      }
      delete messages[id];
    }

  }
  module.exports.channel = Channel;
})();
