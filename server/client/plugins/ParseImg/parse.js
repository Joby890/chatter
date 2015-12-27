export default function(chatter) {
  console.log(URI)
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
      var results = [];
      var text = event.message.text;
      var last = 0;
      var found = false;
      var result = URI.withinString(text, function(url, start, end) {
        found = true;
        if(last !== start) {
          results.push(text.substring(last, start));
        }
        results.push(React.createElement("a", {href:url, target:"_blank"}, url));
        last = end;
        return url;
      });
      console.log(text)
      results.push(text.substring(last, text.length))
      if(found) {
        var end = results.map(function(current) {
          if(typeof current === "string") {
            return React.createElement("span", null, current);
          } else {
            return current;
          }
        });
        event.message.text = React.createElement("div", null, end);
      }
    }
  })
}
