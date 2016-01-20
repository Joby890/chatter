var React = require("react");
var InternalPage = React.createClass({

  handleOption(e, index, value) {
    var page = this.props.children;
    if(page.options[index]) {
      page.options[index].callback.call(page, this);
    } else {
      console.log("Closing page", page);
      this.props.close();
    }
  },

  getInitialState() {
    return {
      modals: {},
    };
  },

  componentDidMount() {
    var modals = this.props.children.pages.reduce(function(obj, modal) {
      obj[modal.id] = false;
      return obj;
    }, {});
    this.setState({
      modals: modals,
    });
  },

  openModalPage(id) {
    var event = chatter.pluginManager.fireEvent("ModalOpenEvent", {modal: this.props.children.getModalById(id)});
    if(event.result === Result.deny) {
      return;
    }
    this.state.modals[event.modal.id] = true;
    this.setState({
      modals: this.state.modals,
    });
  },


  handleModelClose(id) {
    var event = chatter.pluginManager.fireEvent("ModalCloseEvent", {modal: this.props.children.getModalById(id)});
    if(event.result === Result.deny) {
      return;
    }
    this.state.modals[id] = false;
    this.setState({
      modals: this.state.modals,
    });
  },

  render() {
    var self = this;
    var page = this.props.children;

    var dropdownItems = page.options.map(function(o) {
      return React.createElement(chatter.styles.MenuItem, {key: o.name, value: o.name, primaryText: o.name});
    });
    if(page.canClose) {
      dropdownItems.push(React.createElement(chatter.styles.MenuItem, {value: "Close", primaryText: "Close"}));
    }

    var modals = page.pages.map(function(modal) {

      const actions = [
        <chatter.styles.Button
          label="Close"
          primary={true}
          onTouchTap={self.handleModelClose.bind(self, modal.id)} />,
        ];

      var inner = modal.components.map(function(comp) {
        return React.createElement(comp.component, {key: uuid()});
      });
      var open = self.state.modals[modal.id] || false;
      return React.createElement(chatter.styles.Modal, {key: modal.id, title: modal.name, actions:actions, modal: true, open: open}, inner);
    });

    if(page) {
      if(!page.name) {
        page.name = "";
      }
      if(dropdownItems.length) {
        return (
          React.createElement("div", null,
            React.createElement(chatter.styles.DropDownMenu, {value:"", style: {right: "0px", position:"absolute"}, onChange: this.handleOption},
              dropdownItems
            ),
            React.createElement("span", null, page.name),
            modals,
            React.createElement(page.component)
            )
          );

      } else {
        return (
          React.createElement("div", null,
            React.createElement("span", null, page.name),
            modals,
            React.createElement(page.component)
            )
          );
      }
    } else {
      return (<div> </div>);
    }

  },
});
module.exports = InternalPage;
