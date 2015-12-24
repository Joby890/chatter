export default function(chatter) {
  chatter.pluginManager.registerEvent("MessageShowEvent", function(event) {
    try{
      var text = event.message.text;
      var obj = JSON.parse(text);
      console.log(obj)
      if(obj.type === "img") {
        event.message.text = React.createElement("img", {src: obj.src});
        
      }

    }  catch(e) {

    }
  })
}