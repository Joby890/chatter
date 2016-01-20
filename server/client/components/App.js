var React = require("react");
var Panel = require("./Panel");
var Login = require("./Login");
var App = React.createClass({

  getInitialState : function(){

    return{
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      panels : {},
      authed: false,
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


    socket.on("connect", function() {
      console.log("Con");
      self.setAuthed(false);
    });

    socket.on("disconnect", function() {
      console.log("Dis");
      self.setAuthed(false);
    });


    //Listen for auth messages
    socket.on('authenticated', function(data) {
      console.log("Authed", data);
      self.setAuthed(true);
      //Let plugins know that we have offically authed with the server
      var event = chatter.pluginManager.fireEvent("AfterAuthEvent", {});
    });
    socket.on('unauthorized', function(data) {
      alert(data.message);
      self.setAuthed(false);
    });

  },

  setAuthed(bool) {
    this.setState({
      authed: bool,
    });
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
        <Login show={!this.state.authed}> </Login>
        <Panel show={this.state.authed} style={testStyles.panelLeft} top="0" left="0"  width="200" height={this.state.windowHeight} ref={(comp) => this.state.panels.left = comp}>  </Panel>
        <Panel show={this.state.authed} style={testStyles.panelCenter} top="0" left="200"  width={this.state.windowWidth - 500 -200} height={this.state.windowHeight * 0.9} ref={(comp) => this.state.panels.center = comp}>  </Panel>
        <Panel show={this.state.authed} style={testStyles.panelRight} top="0" left={this.state.windowWidth - 500}  width="500" height={this.state.windowHeight} ref={(comp) => this.state.panels.right = comp}>  </Panel>
        <Panel show={this.state.authed} style={testStyles.panelBottom} top={this.state.windowHeight * 0.9} left="200" width={this.state.windowWidth - 500 -200} height={this.state.windowHeight * 0.1} ref={(comp) => this.state.panels.bottom  = comp}> </Panel>
      </div>
    );
  }
});

module.exports = App;
