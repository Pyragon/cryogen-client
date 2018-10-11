var _plugins = () => {

    var plugins = [];
    var intervals = [];

    var pluginData = [];

    var subscriptions = {};

    function loadPlugins() {
        var data = store.get('plugins');
        for (var i = 0; i < data.length; i++) {
            var plugin = data[i];
            pluginData[plugin.name] = plugin;
            loadPlugin(plugin.name);
        }
    }

    function reloadPlugins() {
        if (plugins) {
            for (var _plugin in plugins) {
                var plugin = plugins[_plugin];
                var data = pluginData[_plugin];
                if (data.active) removePlugin(_plugin);
            }
        }
        plugins = [];
        intervals = [];
        loadPlugins();
    }

    function addPlugin(data) {
        pluginData[data.name] = data;
        reloadPlugins();
        for (var key in subscriptions) {
            if (subscriptions.hasOwnProperty(key)) {
                var cb = subscriptions[key];
                cb();
            }
        }
        savePluginData();
    }

    function deletePlugin(name) {
        var data = pluginData[name];
        if (!data) return;
        if (data.active) removePlugin(name);
        delete pluginData[name];
        savePluginData();
        reloadPlugins();
        for (var key in subscriptions) {
            if (subscriptions.hasOwnProperty(key)) {
                var cb = subscriptions[key];
                cb();
            }
        }
    }

    function removePlugin(name) {
        var data = pluginData[name];
        if (!data) return;
        clearInterval(intervals[name]);
        delete intervals[name];
        var plugin = plugins[name];
        if (plugin.destroy) plugin.destroy();
        delete plugins[name];
    }

    function savePluginData() {
        var data = [];
        for (var name in pluginData) {
            data.push(pluginData[name]);
        }
        store.set('plugins', data);
    }

    function loadPlugin(name) {
        var data = pluginData[name];
        if (!data) {
            return;
        }
        if (!data.active) return;
        var pluginPath = data.location ? data.location : app.getPath('userData') + '/plugins/' + data.name;
        var plugin;
        try {
            var pkg = require(pluginPath + '/package.json');
            var config = data.config;
            if (pkg.defaultConfig) {
                config = extend(pkg.defaultConfig, config);
                data.config = config;
                toSave = true;
            }
        } catch (err) {
            console.error(err);
            return;
        }
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

    function setValue(pluginName, configName, value) {
        console.log(pluginName);
        var data = pluginData[pluginName];
        if (!data) return;
        if (data.config[configName])
            data.config[configName].value = value;
        savePluginData();
    }

    function subscribe(name, callback) {
        subscriptions.name = callback;
    }

    function unsubscribe(name) {
        delete subscriptions[name];
    }

    return {

        init: () => {
            loadPlugins();
        },

        getPluginData: (name) => {
            if (name) return pluginData[name];
            else return pluginData;
        },

        savePluginData,
        addPlugin,
        removePlugin,
        loadPlugin,
        reloadPlugins,
        setValue,
        subscribe,
        unsubscribe,
        deletePlugin

    };

};
module.exports = _plugins;