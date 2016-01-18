'use strict';
class Auth {
  constructor(name) {
    this.name = name;
  }

  hasAuth() {
    return false;
  }

  clientLoginFields() {
    return ["username"];
  }

  clientSignupFields() {
    return ["username"];
  }

  authSignup(data, done) {
    console.log(data);
    if(chatter.getUser(data.username)) {
      done({success: false});
    } else {
      chatter.createUser(data.username);
      done({success: true, username: data.username});
    }
  }

  authLogin(data, done) {
    done({success: true, username: data.username});
  }

  start() {

  }

  stop() {

  }

}

module.exports.Auth = Auth;
