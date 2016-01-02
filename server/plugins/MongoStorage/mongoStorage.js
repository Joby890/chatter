'use strict'
module.exports = function(chatter) {

  var mongoose = require('mongoose');
  var conn = mongoose.createConnection('mongodb://localhost/mongooseStorage');
  var _ = require('lodash');
  var Message = conn.model('Message', {id: String, text: String, username: String, channel: String, timeStamp: Date});
  var Channel = conn.model('Channel', {name: String});
  var User = conn.model('User', {username: String})

  class MongoStorage extends chatter.Storage {


      constructor() {
        super("MongoStorage")
      }


      loadChannels(done) {
        Channel.find({}, function(err, channels) {
          _.each(channels, function(channel) {
            //console.log("Loading channel: " + channel.name)
            chatter.createChannel(channel.name);
          })
          done();
        })
      }

      loadUsers(done) {
        User.find({}, function(err, users) {
          _.each(users, function(user) {
            //console.log("Loading user "+user.username)
            chatter.createUser(user.username);
          })
          done();
        })
      }

      loadMessages() {
        Message.find({}, function(err, messages) {
          for(var i = 0; i < messages.length; i++) {
            var message = messages[i];
            //console.log(message)
            var channel = chatter.getChannel(message.channel);
            //console.log(channel)
            channel.messages.push({
              id: message.id,
              text: message.text,
              channel : message.channel,
              user: message.username,
              timeStamp: message.timeStamp
            });
          }
        })
      }

      saveChannel(channel) {
        Channel.findOne({name: channel.name}, function(err, found) {
          if(err) console.log(err);
          if(!found) {
            var createdChannel = new Channel({name: channel.name});
            createdChannel.save();
          }
        })
      }

      saveUser(user) {

        User.findOne({username: user.name}, function(err, found) {
          if(err) console.log(err);
          if(!found) {
            var createdUser = new User({username: user.name});
            createdUser.save();
          }
        })

      }

      saveMessage(message) {
        Message.findOne({id: message.id}, function(err, found) {
          if(err) console.log(err);
          if(!found) {
            console.log(message.user)
            var createdMessage = new Message({
              id: message.id,
              text: message.text,
              username: message.user,
              channel: message.channel,
              timeStamp: message.timeStamp,
            });
            createdMessage.save();
          }
        })

      }
  }


  chatter.setStorage(new MongoStorage())
}
