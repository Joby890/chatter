'use strict'
// export function(chatter)

// export function result (name, description, author) {
//   console.log(arguments)
//   var a = new ClientPlugin(name, description, author)
//   console.log(a);
//   return a;
// }


export default function(chatter) {
  this.onEnable = function() {
    console.log("plugin started")
  }
}
