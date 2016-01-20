var React = require("react");
var SendMessage = React.createClass({
  sendMessage: function(e) {
    socket.emit("message", {channel: chatter.getCurrentChannel(), text: this.textInput.value});
    this.textInput.value = "";
  },
  handleSubmit: function(e) {
    e.preventDefault();
  },
  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <input ref={(c) => this.textInput = c} />
          <input type='submit' onClick={this.sendMessage} value="Send"/>
        </form>
      </div>

    );
  }

});
module.exports = SendMessage;
