'use strict'
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

  start() {

  }

  stop() {

  }

}

module.exports.Auth = Auth;