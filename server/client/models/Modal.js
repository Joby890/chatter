module.exports = class Modal {
  constructor(options) {
    this.id = options.id;
    this.name = options.name || "";

    this.components = [];
  }

  addComponent(obj) {
    this.components.push(obj);
    this.components.sort(function(a,b) {
      return a.weight - b.weight;
    });
  }

};
