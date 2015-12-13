'use strict'
var Auth = require('./../../Auth').Auth;


class TestAuth extends Auth {
  constructor() {
    super('Test');
  }

  hasAuth() {
    return true;
  }

  authLogin(data) {
    if(data.username === "Doug") {
      return {success: false, error: "no dougs allowed"}
    }
    var profile = {
      username: data.username,
      
      id: 123
    };
    chatter.createUser(data.username);
    return {success: true, profile: profile};
  }
}



module.exports.TestAuth = TestAuth;