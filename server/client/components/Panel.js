var React = require("react");
var InternalPage = require("./InternalPage");
var Panel = React.createClass({

  getInitialState() {
    return {
      pages: [],
    };
  },

  componentWillUnmount() {
    console.log(this, " is unmouning!!");
  },

  addPage(plugin, page) {
    if( (! (plugin instanceof Plugin)) && plugin !== null ) {
      throw new Error("First prama needs to be a plugin or null value");
    }
    if(!(page instanceof Page)) {
      throw new Error("Second prama needs to be a page");
    }
    // //Generate an ID for each page for react to track
    // page.id = uuid();
    page.plugin = plugin;
    var pages = this.state.pages.concat(page);
    this.setState({
      pages: pages.sort(function(a,b) {return a.weight - b.weight;}),
    });
  },

  findPage(id) {
    return _.find(this.state.pages, function(page) {return page.id === id;});
  },

  hasPage(page) {
    return this.state.pages.indexOf(page) >= 0;
  },

  updatePage(id) {
    this.setState({
      pages: this.state.pages,
    });
  },

  removePage(page) {
    var pages = this.state.pages.filter(function(p) {
      if(page === p) {
        console.log(p, " matches ", page);
        return false;
      } else {
        return true;
      }
    });
    this.setState({
      pages: pages,
    });
  },

  removePages(plugin) {
    var pages = this.state.pages.filter(function(page) {
      return page.plugin !== plugin;
    });
    this.setState({
      pages: pages,
    });
  },

  render() {
    if(!this.props.show) {
      return <div> </div>;
    }
    var style = _.extend({
      width: this.props.width,
      height: this.props.height,
      top: this.props.top,
      left: this.props.left,
      position: "absolute",
      overflow: "auto",
    }, this.props.style);
    var self = this;
    var pages = this.state.pages.map(function(page) {
      return React.createElement(InternalPage, {key: page.id, close: self.removePage.bind(null, page)}, page);
      //return React.createElement(page.component, null);
    });
    return (
      <div className="test" style={style}>
        {pages}
      </div>
    );
  }
});
module.exports = Panel;
