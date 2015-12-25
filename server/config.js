'use strict'
var fs = require("fs");
class Config {
  constructor(f) {
    this.f = f;
    try {
      var load = fs.readFileSync(f);
      try {
        this.data = JSON.parse(load); 

      } catch(e1) {
        console.log("error parsing data to json: " + f);
      }

    } catch(e) {
      console.log("error reading from file " + f);
    }
  }

  get(string) {
    if(this.data) {
      return this.data[string];
      
    }
  }



}

module.exports.Config = Config;