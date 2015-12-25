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
      //not json check if message is linkable
      if(isUrl(event.message.text)){
        event.message.text = React.createElement("a", {href:event.message.text, target:"_blank"}, event.message.text);
      }

    }
  })
}


function isUrl(s) {
   var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
   return regexp.test(s);
}