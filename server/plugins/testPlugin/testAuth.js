'use strict'
var Auth = require('./../../Auth').Auth;

var users = {
  "joe": "password"
};

class TestAuth extends Auth {
  constructor() {
    super('Test');
  }

  hasAuth() {
    return true;
  }

  clientLoginFields() {
    return ["username", "password"];
  }

  clientSignupFields() {
    return ["email", "username", "password"];
  }

  authLogin(data) {
    if(users[data.username] === data.password) {
      chatter.createUser(data.username);
      return {success: true, profile: {username: data.username}};
    } else {
      return {success: false, error: "invalid password or unknown username"}
    }
  }

  authSignup(data) {
    if(!users[data.username]) {
      users[data.username] = data.password;
      chatter.createUser(data.username);
      return {success: true, profile: {username: data.username}};
    } else {
      return {success: false, error: "Username already in use"}
    }
  }
}



module.exports.TestAuth = TestAuth;