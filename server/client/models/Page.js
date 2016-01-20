
module.exports = class Page {
  constructor(id, weight, component, name, options, canClose) {
    if(typeof id !== "string") {
      throw new Error("Page id needs to be a string");
    }
    this.id = id;
    this.name = name;
    this.weight = weight;
    this.component = component;
    this.options = [];
    if(options) {
      this.options = this.options.concat(options);
    }
    this.canClose = !canClose;
    this.pages = [];
  }

  addModelPage(modal) {
    this.pages.push(modal);
  }

  findModal(id) {
    return _.find(this.pages, function(modal) {return modal.id === id;});
  }

  getModalById(id) {
    return _.find(this.pages, function(modal) {
      return modal.id === id;
    });
  }

};
