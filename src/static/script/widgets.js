const electron = require('electron');
const renderer = electron.ipcRenderer;
const app = electron.remote.app;

var _widgets = function() {

  var widgets = [];

  var position = [];
  var positions = [];

  var intervals = [];

  function loadWidgets() {
    var data = store.get('widgets');
    for (var i = 0; i < 3; i++) {
      if ([i] == null || position[data[i].position]) continue;
      var widget = data[i];
      positions[widget.name] = widget.position;
      position[widget.position] = true;
      loadWidget(widget);
    }
  }

  function reloadWidgets() {
    if (widgets) {
      for (var widget in widgets) {
        var name = widget.name;
        if (intervals[name])
          clearInterval(intervals[name]);
      }
    }
    widgets = [];
    position = [];
    positions = [];
    intervals = [];
    loadWidgets();
  }

  function loadWidget(data) {
    var widgetPath = data.location ? data.location : app.getPath('userData') + '/widgets/' + data.name;
    var widget;
    try {
      widget = require(widgetPath)();
    } catch (error) {
      console.log('Error loading widget!');
      console.error(error);
      return;
    }
    widget.init(data.config);
    widgets[data.name] = widget;
    var container = $(`#${positions[data.name]}`);
    if (container.length <= 0) {
      console.log('Error loading widget on position ' + positions[data.name]);
      return;
    }
    for (var i = 0; i < widget.getStylesheets().length; i++) {
      var p = widgetPath + '/' + widget.getStylesheets()[i];
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = p;

      var head = document.getElementsByTagName('head')[0];

      head.appendChild(link);
    }
    intervals[data.name] = setInterval(widget.update, widget.getDelay());
    widget.update();
    container.html(widget.getDom());
  }

  function updateDom(name) {
    var widget = widgets[name];
    if (!widget) return;
    var container = $(`#${positions[name]}`);
    if (container.length > 0)
      container.html(widget.getDom());
  }

  return {

    init: () => {
      loadWidgets();
    },

    updateDom: (name) => {
      updateDom(name);
    }

  };

};
module.exports = _widgets;