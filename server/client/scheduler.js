'use strict'
var _ = require("lodash");
module.exports = class Scheduler {

  //This allow for a scheduler that is managed by the plugin manager
  constructor() {
    this.tasks = {};
    this.next = 0;
  }

  scheduleTask(plugin, task, delay) {
    var taskID = ++this.next;
    var timeoutId = setTimeout(task, delay);
    this.tasks[taskID] = {plugin: plugin, type: "single", id: timeoutId};
    return taskID;
  }

  scheduleRepeatingTask(plugin, task, delay, period) {
    var taskId = ++this.next;
    var createdTask = {plugin: plugin, type: "repeat"};
    var timeoutId = setTimeout(function() {
      createdTask.id = setInterval(task, period);
    }, delay);
    createdTask.timeoutId = timeoutId;
    this.tasks[taskId] = createdTask;
    return taskId;
  }

  cancelTasks(plugin) {
    var self = this;
    _.each(this.tasks, function(task, id) {
      if(task.plugin === plugin) {
        self.cancelTask(id);
      }
    });
    console.log(this.tasks);
  }

  cancelTask(id) {
    var task = this.tasks[id];
    if(!task) {
      return;
    }
    if(task.type === "single") {
      clearTimeout(task.id);
    } else {
      if(task.id !== undefined) {
        clearInterval(task.id);
      } else {
        clearTimeout(task.timeoutId);
      }
    }
    delete this.tasks[id];
  }


};
