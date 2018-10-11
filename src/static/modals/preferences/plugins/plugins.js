const npm = require(__dirname + '/utils/npm.js');
const exec = require('child_process').exec;
const loader = require(__dirname + '/script/pugManager.js');

$(document).ready(() => {

    var modals = _modals();

    var npmResult;
    var gitResult;

    loadPlugins();
    bgTables();

    //Attempt to check if NPM is installed. Provide link if not
    npm.checkNPM((result) => {
        npmResult = result;
        npm.checkGIT((result) => {
            gitResult = result;
            var elm = $('#npm-notice');
            elm.css({
                color: npmResult && gitResult ? 'green' : 'red',
                cursor: npmResult && gitResult ? 'default' : 'pointer'
            });
            if (npmResult && gitResult) {
                elm.off('click');
                elm.prop('title', 'It seems you have NPM and Git installed. You\'re all set.');
            } else elm.prop('title', 'Uh oh. You don\'t seem to have either Git or NPM installed. (or both) Click to install.');
        });
    });

    ui.getPlugins().subscribe('plugin-pref', () => loadPlugins());

    $('#npm-notice').click(() => {
        if (!npmResult) shell.openExternal('https://nodejs.org/en/');
        if (!gitResult) shell.openExternal('https://git-scm.com/');
    });

    $(document).on('click', '.plugin-active', function() {
        var name = $(this).closest('tr').data('name');
        toggleActive(name);
    });

    $('#plugins-container').on('remove', () => {
        $(document).off('click', '.plugin-active');
        $(document).off('click', '#plugins-container .table-remove');
        $(document).off('click', '.config-btn');
        $(document).off('click', '.location-edit');
        ui.getWidgets().unsubscribe('plugin-pref');
    });

    $('#open-plugin-folder').click(() => {
        if (!fs.existsSync(app.getPath('userData') + '/plugins'))
            fs.mkdirSync(app.getPath('userData') + '/plugins');
        exec('start ' + app.getPath('userData') + '/plugins/');
    });

    $(document).on('click', '.config-btn', function() {
        var name = $(this).closest('tr').data('name');
        var data = ui.getPlugins().getPluginData(name);
        modals.viewModal({
            name: 'settings-view',
            title: 'Edit Plugin Configuration',
            width: 300,
            height: 100,
            position: {
                left: 150
            },
            saveDragPosition: false,
            container: 'preferences',
            location: 'preferences/settings_view',
            model: {
                name: data.name,
                config: data.config,
                pluginName: data.name,
                onConfirm: (name) => {
                    var container = $('.conf-container');
                    container.find('.pref-line').each(function(i, obj) {
                        var configName = $(this).data('key');
                        var conf = $(this).data('conf');
                        var value = $(this).find('input').val();
                        if ($(this).find('.switch').length > 0)
                            value = $(this).find('.switch input').prop('checked');
                        if (value == '' && $(this).find('input').prop('placeholder') != '')
                            value = $(this).find('input').prop('placeholder');
                        if (conf.type == 'String Array')
                            value = value.split(',');
                        ui.getPlugins().setValue(name, configName, value);
                    });
                    modals.destroyModal('preferences');
                    ui.getPlugins().reloadPlugins();
                }
            },
            onClose: () => {
                if (!settingsChanged(name)) modals.destroyModal('preferences');
                else
                    modals.viewModal({
                        name: 'confirmation',
                        title: 'Unsaved changes.',
                        width: 225,
                        height: 125,
                        saveDragPosition: false,
                        container: 'settings-view',
                        model: {
                            title: 'Apply unsaved changes?',
                            confirmText: 'Yes',
                            cancelText: 'No',
                            onConfirm: (name) => {
                                var container = $('.conf-container');
                                console.log(`Name: ${name}`);
                                container.find('.pref-line').each(function(i, obj) {
                                    var configName = $(this).data('key');
                                    var conf = $(this).data('conf');
                                    var value = $(this).find('input').val();
                                    if ($(this).find('.switch').length > 0)
                                        value = $(this).find('.switch input').prop('checked');
                                    if (value == '' && $(this).find('input').prop('placeholder') != '')
                                        value = $(this).find('input').prop('placeholder');
                                    if (conf.type == 'String Array')
                                        value = value.split(',');
                                    ui.getPlugins().setValue(name, configName, value);
                                });
                                modals.destroyModal('preferences');
                                ui.getPlugins().reloadPlugins();
                            }
                        },
                        onClose: () => {
                            modals.destroyModal('preferences');
                        }
                    });
            }
        });
    });

    function settingsChanged(name) {
        var data = ui.getPlugins().getPluginData(name);
        if (!data) return false;
        var config = data.config;
        var ret = false;
        $('.conf-container .pref-line').each(function(i, obj) {
            var configName = $(this).data('key');
            var value = $(this).find('input').val();
            if ($(this).find('.switch').length > 0)
                value = $(this).find('.switch input').prop('checked');
            if (value == '' && $(this).find('input').prop('placeholder') != '')
                value = $(this).find('input').prop('placeholder');
            if (Array.isArray(config[configName].value))
                ret = config[configName].value.join() != value;
            else if (config[configName].value != value) ret = true;
        });
        return ret;
    }

    $(document).on('click', '.location-edit', function() {
        var name = $(this).closest('tr').data('name');
        var data = ui.getPlugins().getPluginData(name);
        data = JSON.parse(JSON.stringify(data));
        if (!data) return;
        modals.viewModal({
            name: 'location-modal',
            title: 'Set Location',
            width: 225,
            height: 150,
            location: 'preferences/location',
            container: 'preferences',
            onClose: function() {
                modals.destroyModal('preferences');
            },
            model: {
                options: data,
                error: setMessage,
                onConfirm: function(setMessage) {
                    var location = $('#location-input').val();
                    var options = $('#location-container').data('options');
                    options.location = location;
                    modals.destroyModal('preferences');
                    try {
                        var p = path.resolve(location);
                        //check new location for # of files. Must be empty.
                        //remove plugin if active, move location, save data, reload if it was active
                    } catch (error) {
                        console.error(error);
                        setMessage('Error saving to new location.');
                    }
                    //check folder if files exist. return error if so, location must be empty.
                    //Unload widget, and move files into new folder.
                }
            }
        }, () => {
            $('#location-input').focus();
        });
    });

    function setMessage(message, error = false) {
        var elem = $('#plugins-error');
        elem.css({
            display: 'block',
            color: error ? '#FF0000' : '#00FF00'
        });
        //$('.installed-title').addClass('withError');
        elem.html(message);
        elem.fadeOut(7500, () => {
            $('#plugins-error').css('display', 'none');
            $('.installed-title').removeClass('withError');
        });
    }

    $(document).on('click', '#plugins-container .table-remove', function() {
        var name = $(this).closest('tr').data('name');
        var data = ui.getPlugins().getPluginData(name);
        if (!data) return false;
        var html = loader.loadFile(__dirname + '/modals/confirmation.pug', {
            name,
            title: null,
            confirm: 'Yes',
            onConfirm: function(name) {
                var data = ui.getPlugins().getPluginData(name);
                modals.destroyModal("preferences");
                var p = path.resolve(data.location);
                if (!fs.existsSync(p)) return;
                rimraf(p, () => {});
                var pPath = require.resolve(data.location);
                ui.getPlugins().deletePlugin(name);
                delete require.cache[pPath];
            },
            onClose: function() {
                modals.destroyModal("preferences");
            }
        });
        modals.viewModal({
            name: 'confirmation',
            title: 'Confirmation',
            width: 175,
            height: 100,
            html,
            saveDragPosition: false,
            container: 'preferences'
        });
    });

    $('#plugin-install-name').keydown((e) => {
        if (e.which == 13) $('#install-plugin-btn').click();
    });

    $('#install-plugin-btn').click(() => {
        var name = $('#plugin-install-name').val();
        if (!name) return;
        npm.checkPackage(name, (err, result) => {
            if (err) {
                console.error(err);
                return;
            }
            var realResults = [];
            if (result.results[0].name[0].includes('cclient-plugin') && result.results[0].name[0] === name)
                realResults.push(result.results[0]);
            else
                realResults = result.results
                .filter(r => r.name[0].includes('cclient-plugin'))
                .filter(r => !ui.getPlugins().getPluginData(r.name[0]));
            modals.viewModal({
                name: 'install_npm_package',
                title: 'Package to Install',
                width: 250,
                container: 'preferences',
                saveDragPosition: false,
                model: {
                    results: realResults,
                    type: 'plugin'
                },
                onDestroy: () => {
                    context.unregisterSelector('.install-table');
                }
            });
            $('#preferences').on('remove', () => modals.destroyModal());
        });
    });

    function toggleActive(name) {
        var data = ui.getPlugins().getPluginData(name);
        if (!data) return;
        var active = data.active;
        data.active = !active;
        setActive(name, data.active);
        ui.getPlugins().savePluginData();
        if (!data.active)
            ui.getPlugins().removePlugin(name);
        else
            ui.getPlugins().loadPlugin(name);
    }

    function setActive(name, active) {
        var elem = $(`#${name}`).find('.plugin-active');
        elem.removeClass('col-green col-red');
        elem.addClass(`col-${active ? 'green' : 'red'}`);
        elem.html(active ? 'Yes' : 'No');
    }

    function loadPlugin(data) {
        var html = pug.renderFile(__dirname + '/modals/preferences/plugins/plugin_tr.pug', {
            data
        });
        $('#plugins-container tbody').append($(html));
        setTimeout(bgTables, 100);
    }

    function loadPlugins() {
        $('#plugins-container tbody').empty();
        var plugins = ui.getPlugins().getPluginData();
        for (var _plugin in plugins) {
            var data = plugins[_plugin];
            loadPlugin(data);
        }
    }

});