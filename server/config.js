'use strict'
var fs = require("fs");
class Config {
  constructor(f) {
    this.f = f;
    this.data = JSON.parse(fs.readFileSync(f)); 
  }

  get(string) {
    return this.data[string];
  }

  

}

module.exports.Config = Config;