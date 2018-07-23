const electron = require('electron');
const renderer = electron.ipcRenderer;
const app = electron.remote.app;

var _plugins = function(main) {

  var plugins = [];

  var position = [];
  var positions = [];

  var intervals = [];

  function loadPlugins() {
    renderer.on('plugins:load', (event, data) => {
      for (var i = 0; i < 3; i++) {
        if (data[i] == null || position[data[i].position]) continue;
        var plugin = data[i];
        positions[plugin.name] = plugin.position;
        position[plugin.position] = true;
        loadPlugin(plugin);
      }

    });
    renderer.send('plugins:load');
  }

  function reloadPlugins() {
    if (plugins) {
      for (var plugin in plugins) {
        var name = plugin.name;
        if (intervals[name])
          clearInterval(intervals[name]);
      }
    }
    plugins = [];
    position = [];
    positions = [];
    intervals = [];
    loadPlugins();
  }

  function loadPlugin(data) {
    var pluginPath = data.location ? data.location : app.getPath('userData') + '/plugins/' + data.name;
    var plugin;
    try {
      plugin = require(pluginPath)(main);
    } catch (error) {
      console.log('Error loading plugin!');
      console.error(error);
      return;
    }
    plugin.init(data.config);
    plugins[data.name] = plugin;
    var container = $(`#${positions[data.name]}`);
    for (var i = 0; i < plugin.getStylesheets().length; i++) {
      var p = pluginPath + '/' + plugin.getStylesheets()[i];
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = p;

      var head = document.getElementsByTagName('head')[0];

      head.appendChild(link);
    }
    intervals[name] = setInterval(plugin.update, plugin.getDelay());
    plugin.update();
    container.html(plugin.getDom());
  }

  function updateDom(name) {
    var plugin = plugins[name];
    if (!plugin) return;
    var container = $(`#${positions[name]}`);
    container.html(plugin.getDom());
  }

  return {

    init: () => {
      loadPlugins();
      $('#reload-button').click(reloadPlugins);
    },

    updateDom: (name) => {
      updateDom(name);
    },

    reloadPlugins: () => reloadPlugins()

  };

};
module.exports = _plugins;