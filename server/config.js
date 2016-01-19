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
    }
  }

  get(string) {
    if(this.data) {
      return this.data[string];

    }
  }

  setup(defaultData) {
    if(!this.data) {
      this.data = defaultData;
    }
  }
  set(key, value) {
    if(this.data) {
        this.data[key] = value;
    }
  }

  save() {
    if(!this.data) {
      throw new Error('Unable to save null value to file');
    }
    //fs.mkdirSync(this.f);
    fs.writeFile(this.f, JSON.stringify(this.data, undefined, "\t"), function(){});
  }



}

module.exports.Config = Config;
