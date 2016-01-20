var React = require("react");
var Panel = require("./Panel");
module.exports = React.createClass({

  getInitialState : function(){

    return{
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      panels : {}
    };
  },

  handleResize: function() {
    var event = chatter.pluginManager.fireEvent("WindowResizeEvent", {});
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

  },

  componentDidMount: function() {
    var self = this;
    window.addEventListener('resize', this.handleResize);
  },

  getPanel(name) {
    return this.state.panels[name];
  },
  render() {
    var testStyles = {
      panelLeft: {background: "#9E9E9E"},
      panelCenter: {background: "#fff"},
      panelRight: {background: "#eee"},
      panelBottom: {background: "#ee9"},
    };

    return (
      <div>
        <Panel style={testStyles.panelLeft} top="0" left="0"  width="200" height={this.state.windowHeight} ref={(comp) => this.state.panels.left = comp}>  </Panel>
        <Panel style={testStyles.panelCenter} top="0" left="200"  width={this.state.windowWidth - 500 -200} height={this.state.windowHeight * 0.9} ref={(comp) => this.state.panels.center = comp}>  </Panel>
        <Panel style={testStyles.panelRight} top="0" left={this.state.windowWidth - 500}  width="500" height={this.state.windowHeight} ref={(comp) => this.state.panels.right = comp}>  </Panel>
        <Panel style={testStyles.panelBottom} top={this.state.windowHeight * 0.9} left="200" width={this.state.windowWidth - 500 -200} height={this.state.windowHeight * 0.1} ref={(comp) => this.state.panels.bottom  = comp}> </Panel>
      </div>
    );
  }
});
