var _plugins = () => {

  var plugins = [];
  var intervals = [];

  function loadPlugins() {
    renderer.on('plugins:load', (event, data) => {
      for (var i = 0; i < data.length; i++) {
        loadPlugin(data[i]);
      }
    });
    renderer.send('plugins:load');
  }

  function loadPlugin(data) {
    var pluginPath = data.location ? data.location : app.getPath('userData') + '/plugins/' + data.name;
    var plugin;
    try {
      plugin = require(pluginPath)();
    } catch (error) {
      console.log('Error loading plugin!');
      console.error(error);
      return;
    }
    plugin.init(data.config);
    plugins[data.name] = plugin;
    intervals[data.name] = setInterval(plugin.update, plugin.getDelay());
    plugin.update();
  }

  return {

    init: () => {
      loadPlugins();
    }

  };

};
module.exports = _plugins;