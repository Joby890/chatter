'use strict'
module.exports = function(chatter) {
  var bcrypt = require('bcrypt');
  var mongoose = require('mongoose');
  mongoose.connect('mongodb://localhost/mongooseAuth');

  var User = mongoose.model('User', {email: String, username: String, password: String});

  class MongoAuth extends chatter.Auth {
    constructor() {
      super("MongoAuth")
    }

    hasAuth() {
      return true;
    }

    clientLoginFields() {
      return ["email", "password"];
    }

    clientSignupFields() {
      return ["email", "username", "password"];
    }

    authLogin(data, done) {
      User.findOne({email: data.email}, function(err, user) {
        if(err) console.log(err);
        if(!user) {
          done({success: false, error: "Unknown user."});
          return;
        }
        bcrypt.compare(data.password, user.password, function(err, res) {
          if(res) {
            chatter.createUser(user.username)//In the future should not need to do this
            done({success: true, profile: {username: user.username}});
          } else {
            done({success: false, error: "invalid password."})
          }
        });
      });

    }

    authSignup(data, done) {
      User.find({email: data.email }, function(err, users){
        if(err) console.log(err);
        if(users.length) {
          done({success: false, error: "Email already in use"});
          return;
        }
        User.find({username: data.username}, function(err, users) {
          if(err) console.log(err)
          if(users.length) {
            done({success: false, error: "Username already in use"});
            return;
          }
          bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(data.password, salt, function(err, hash) {
              // Store hash in your password DB.
              var newUser = new User({username: data.username, email: data.email, password: hash})
              newUser.save(function(err, saved) {
                //create the user for chatter to use
                chatter.createUser(data.username);
                done({success: true, profile: {username: data.username}})
              })
            });
          });

        })
      });

    }

  }
  chatter.setAuth(new MongoAuth());
}
