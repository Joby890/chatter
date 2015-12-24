'use strict'
var Auth = require('./../../auth').Auth;

var users = {};

class TestAuth extends Auth {
  constructor() {
    super('Test');
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

  authLogin(data) {
    if(users[data.email] && users[data.email].password === data.password) {
      chatter.createUser(users[data.email].name);
      return {success: true, profile: {username: users[data.email].name}};
    } else {
      return {success: false, error: "invalid password or unknown username"}
    }
  }

  authSignup(data) {
    console.log(data)
    if(!users[data.email] && !this.hasUsername(data.username)) {
      users[data.email] = {name: data.username, password: data.password};
      chatter.createUser(data.username);
      return {success: true, profile: {username: data.username}};
    } else {
      return {success: false, error: "Username already in use"}
    }
  }

  hasUsername(name) {
    for(var user in users) {
      if(user.name === name) {
        return true;
      }
    }
    return false;
  }
}



module.exports.TestAuth = TestAuth;
