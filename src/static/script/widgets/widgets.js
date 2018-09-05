const electron = require('electron');
const renderer = electron.ipcRenderer;
const app = electron.remote.app;

var _widgets = function() {

    var widgets = [];
    var widgetData = [];

    var position = [];
    var positions = [];

    var intervals = [];

    function loadWidgets() {
        var data = store.get('widgets');
        for (var i = 0; i < data.length; i++) {
            if (data[i] == null) continue;
            var widget = data[i];
            widgetData[widget.name] = data[i];
            loadWidget(widget.name);
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

    function removeWidget(name) {
        var data = widgetData[name];
        clearInterval(intervals[name]);
        delete intervals[name];
        var widget = widgets[name];
        var widgetPath = data.location ? path.resolve(data.location) : app.getPath('userData') + '/widgets/' + name;
        for (var i = 0; i < widget.getStylesheets().length; i++) {
            var p = `${widgetPath}/${widget.getStylesheets()[i]}`;
            $(`link[rel=stylesheet][href="${p}"]`).remove();
        }
        $('#' + positions[name]).html('');
        delete positions[name];
        delete position[data.position];
        delete widgets[name];
        widgetData[name].active = false;
        saveWidgetData();
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
            callback('Unable to find widget: ' + name);
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
                widget.init(data.config);
                widgets[data.name] = widget;
                console.log(widgets);
                widgetData[data.name].active = true;
                var container = $(`#${positions[data.name]}`);
                if (container.length <= 0) {
                    error = 'Error loading widget on position ' + positions[data.name];
                    console.error(error);
                    if (callback) callback(error);
                    return;
                }
                var widgetPath = data.location ? path.resolve(data.location) : app.getPath('userData') + '/widgets/' + data.name;
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
        var widgetPath = data.location ? path.resolve(data.location) : app.getPath('userData') + '/widgets/' + data.name;
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

        getWidgets: function() {
            return widgets;
        },

        getWidgetData: function() {
            return widgetData;
        },

        saveWidgetData: saveWidgetData,

        loadWidget: loadWidget,

        removeWidget: removeWidget,

        loadModule: loadModule,

        positionTaken: function(pos) {
            return position[pos];
        }

    };

};
module.exports = _widgets;