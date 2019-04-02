const electron = require('electron');
const renderer = electron.ipcRenderer;
const app = electron.remote.app;

var _widgets = function () {

    var widgets = [];
    var widgetData = [];

    var position = [];
    var positions = [];

    var intervals = [];

    var subscriptions = {};

    var toSave = false;

    function loadWidgets() {
        var data = store.get('widgets');
        for (var i = 0; i < data.length; i++) {
            if (data[i] == null) continue;
            var widget = data[i];
            widgetData[widget.name] = data[i];
            loadWidget(widget.name);
        }
        if (toSave) {
            toSave = false;
            saveWidgetData();
        }
    }

    function reloadWidgets() {
        if (widgets) {
            for (var _widget in widgets) {
                var widget = widgets[_widget];
                var data = widgetData[_widget];
                if (data.active) removeWidget(_widget);
            }
        }
        widgets = [];
        position = [];
        positions = [];
        intervals = [];
        loadWidgets();
    }

    function setValue(widgetName, configName, value) {
        console.log(widgetName + ' ' + configName);
        var data = widgetData[widgetName];
        if (!data) return;
        if (data.config[configName])
            data.config[configName].value = value;
        saveWidgetData();
    }

    function subscribe(name, callback) {
        subscriptions[name] = callback;
    }

    function unsubscribe(name) {
        delete subscriptions[name];
    }

    function addWidget(data) {
        widgetData[data.name] = data;
        reloadWidgets();
        for (var key in subscriptions) {
            if (subscriptions.hasOwnProperty(key)) {
                var cb = subscriptions[key];
                cb();
            }
        }
        saveWidgetData();
    }

    function deleteWidget(name) {
        var data = widgetData[name];
        try {
            var pPath = require.resolve(data.location);
            delete require.cache[pPath];
        } catch (err) {}
        if (!data) return;
        if (data.active) removeWidget(name);
        delete widgetData[name];
        saveWidgetData();
        reloadWidgets();
        for (var key in subscriptions) {
            if (subscriptions.hasOwnProperty(key)) {
                var cb = subscriptions[key];
                cb();
            }
        }
    }

    function removeWidget(name) {
        var data = widgetData[name];
        clearInterval(intervals[name]);
        delete intervals[name];
        var widget = widgets[name];
        if (!widget) return;
        if (widget.destroy) widget.destroy();
        var widgetPath = data.location ? path.resolve(data.location) : app.getPath('userData') + '/widgets/' + name;
        for (var i = 0; i < widget.getStylesheets().length; i++) {
            var p = `${widgetPath}/${widget.getStylesheets()[i]}`;
            $(`link[rel=stylesheet][href="${p}"]`).remove();
        }
        $('#' + positions[name]).html('');
        delete positions[name];
        delete position[data.position];
        delete widgets[name];
    }

    function saveWidgetData() {
        var data = [];
        for (var name in widgetData) {
            data.push(widgetData[name]);
        }
        store.set('widgets', data);
    }

    function loadWidget(name, setActive = false, callback = null) {
        var data = widgetData[name];
        if (!data) {
            for (var n in widgetData) console.log(n);
            if (callback) callback('Unable to find widget: ' + name);
            return;
        }
        if (!data.active && !setActive) return;
        if (position[data.position]) {
            data.active = false;
            saveWidgetData();
            if (callback) callback('Position already taken. Please change the position first.');
            return;
        }
        positions[data.name] = data.position;
        position[data.position] = true;
        loadModule(data, (error, result) => {
            if (error) {
                console.error(error);
                return;
            }
            try {
                var widget = result;
                var widgetPath = data.default === true ? path.join(__dirname, 'defaults', data.name) : data.location ? path.resolve(data.location) : app.getPath('userData') + '/widgets/' + data.name;
                var pkg = require(widgetPath + '/package.json');
                var config = data.config;
                if (pkg.defaultConfig) {
                    config = extend(pkg.defaultConfig, config);
                    data.config = config;
                    toSave = true;
                }
                widget.init(data.config);
                widgets[data.name] = widget;
                widgetData[data.name].active = true;
                var container = $(`#${positions[data.name]}`);
                if (container.length <= 0) {
                    error = 'Error loading widget on position ' + positions[data.name];
                    console.error(error);
                    if (callback) callback(error);
                    return;
                }
                for (var i = 0; i < widget.getStylesheets().length; i++) {
                    var p = `${widgetPath}/${widget.getStylesheets()[i]}`;
                    var link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.type = 'text/css';
                    link.href = p;

                    var head = document.getElementsByTagName('head')[0];

                    head.appendChild(link);
                }
                intervals[data.name] = setInterval(widget.update, widget.getDelay());
                container.html(widget.getDom());
                widget.update();
                if (callback) callback(null);
            } catch (error) {
                console.error(error);
            }
        });
    }

    function updateDom(name) {
        var widget = widgets[name];
        if (!widget) return;
        var container = $(`#${positions[name]}`);
        if (container.length > 0)
            container.html(widget.getDom());
    }

    function isActive(name) {
        return widgetData[name].active;
    }

    function loadModule(data, callback) {
        var widgetPath = data.default === true ? path.join(__dirname, 'defaults', data.name) : data.location ? path.resolve(data.location) : app.getPath('userData') + '/widgets/' + data.name;
        try {
            callback(null, require(widgetPath)(), data);
        } catch (error) {
            console.log('Error loading widget: ' + data.name);
            console.error(error);
            if (callback) callback(error);
            return;
        }
    }

    return {

        init: () => {
            loadWidgets();
        },

        updateDom: (name) => {
            updateDom(name);
        },

        getWidgets: function () {
            return widgets;
        },

        getWidgetData: function (name) {
            return name ? widgetData[name] : widgetData;
        },

        addWidget,
        deleteWidget,
        reloadWidgets,
        subscribe,
        unsubscribe,
        saveWidgetData,
        loadWidget,
        removeWidget,
        loadModule,
        setValue,

        positionTaken: function (pos) {
            return position[pos];
        }

    };

};
module.exports = _widgets;