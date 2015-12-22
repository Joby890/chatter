


export default function(chatter) {
  console.log("Simple Channel started");

  chatter.pluginManager.registerEvent("AfterAuthEvent", function(event) {
    var page;
    var AddChannel = React.createClass({

      componentDidMount:function() {
        var self = this;
        console.log(self, " mounted")
      },

      addChannel: function() {
        chatter.send("createChannel", {name: this.channelName.value});
        this.channelName.value = "";
        chatter.getPanel('right').removePage(page);
        console.log(chatter.getPanel('right').hasPage(page))
      },
      render: function() {
        return React.createElement("div", null,
          React.createElement("input", {ref: function(c)  {return this.channelName = c;}.bind(this)}),
          React.createElement("input", {type:"button", onClick: this.addChannel, value: "Add Channel"})
          );
      }
    });
    page = {weight: .1, component: AddChannel};
    var CreateButton = React.createClass({
      showChannel: function() {
        if(!chatter.getPanel('right').hasPage(page)) {
          chatter.getPanel('right').addPage(page);
        }
      },

      render: function() {
        return React.createElement("input", {type:"button", onClick: this.showChannel, value: "Add"});
      }
    })

    console.log("Adding Channel to right below channels");
    chatter.getPanel('left').addPage({weight: 2, component: CreateButton});
    
  })


}
