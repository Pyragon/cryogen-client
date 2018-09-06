const {
    remote,
    shell
} = require('electron');
const {
    app,
    dialog
} = remote;
const fs = require('fs');
const exec = require('child_process').exec;
const npm = require(__dirname + '/utils/npm.js');
const _modals = require(__dirname + '/script/modals.js');
const loader = require(__dirname + '/script/pugManager.js');

$(document).ready(() => {

    var modals = _modals();

    var widg = this;

    var npmResult;
    var gitResult;

    loadWidgets();
    $('.location-edit').click();
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
                elm.prop('title', 'It seems you have NPM and GIT installed. You\'re all set.');
            } else elm.prop('title', 'Uh oh. You don\'t seem to have either GIT or NPM installed. (or both) Click to install.');
        });
    });

    $('#preferences').on('remove', () => {
        $(document).off('click', '.widget-active');
        $(document).off('click', '#widgets-container .table-remove');
        ui.getWidgets().unsubscribe('widget-pref');
    });

    $(document).on('click', '.widget-active', function() {
        var name = $(this).closest('tr').data('name');
        toggleActive(name);
    });

    function toggleActive(name) {
        var data = ui.getWidgets().getWidgetData()[name];
        if (ui.getWidgets().positionTaken(data.position) && !data.active) {
            setMessage('Position already taken. Please change the position first.', true);
            return;
        }
        var active = data.active;
        data.active = !active;
        setActive(name, data.active);
        ui.getWidgets().saveWidgetData();
        if (active)
            ui.getWidgets().removeWidget(name);
        else {
            ui.getWidgets().loadWidget(name, (error) => {
                if (error) {
                    console.error(error);
                    return;
                }
            });
        }
    }

    function setActive(name, active) {
        var elem = $(`#${name}`).find('.widget-active');
        elem.removeClass('col-green col-red');
        elem.addClass(`col-${active ? 'green' : 'red'}`);
        elem.html(active ? 'Yes' : 'No');
    }

    function setPosition(name) {
        var data = ui.getWidgets().getWidgetData()[name];
        $(`#${name}`).find('.widget-position').html(data.position.charAt(0).toUpperCase() + data.position.substring(1, data.position.length));
    }

    function setMessage(message, error = false) {
        var elem = $('#widgets-error');
        elem.css({
            display: 'block',
            color: error ? '#FF0000' : '#00FF00'
        });
        $('.installed-title').addClass('withError');
        elem.html(message);
        elem.fadeOut(7500, () => {
            $('#widgets-error').css('display', 'none');
            $('.installed-title').removeClass('withError');
        });
    }

    $('.widget-position').click((e) => {
        var name = $(e.target).closest('tr').data('name');
        var data = ui.getWidgets().getWidgetData()[name];
        var pos = data.position;
        var html = loader.loadFile(path.join(__dirname + '/modals/preferences/widgets/position_modal.pug'), {
            confirm: 'Confirm',
            disabled: pos,
            name,
            onConfirm: function() {
                var setActive = function(name, active) {
                    var elem = $(`#${name}`).find('.widget-active');
                    elem.removeClass('col-green col-red');
                    elem.addClass(`col-${active ? 'green' : 'red'}`);
                    elem.html(active ? 'Yes' : 'No');
                };
                var setPosError = function(error) {
                    $('#position_modal').height('160');
                    $('#pos-error').css('display', 'block');
                    $('#pos-error').html(error);
                };
                var setPosition = function(name) {
                    var data = ui.getWidgets().getWidgetData()[name];
                    $(`#${name}`).find('.widget-position').html(data.position.charAt(0).toUpperCase() + data.position.substring(1, data.position.length));
                };
                var selected = $('#position_modal input:checked');
                if (!selected || selected.length <= 0) {
                    setPosError('You must select a position first.');
                    return;
                }
                var name = $('#pos-name').val();
                var data = ui.getWidgets().getWidgetData()[name];
                var pos = selected.closest('div').data('pos');
                var lastPos = data.position;
                if (lastPos === pos) {
                    modals.destroyModal('preferences');
                    return;
                }
                var active = data.active;
                if (active)
                    ui.getWidgets().removeWidget(data.name);
                data.position = pos;
                ui.getWidgets().saveWidgetData();
                setPosition(name);
                if (active) {
                    if (ui.getWidgets().positionTaken(pos)) {
                        modals.destroyModal('preferences');
                        setActive(name, false);
                        return;
                    } else {
                        modals.destroyModal('preferences');
                        ui.getWidgets().loadWidget(name, (error) => {
                            if (error) {
                                setMessage(error, true);
                                return;
                            }
                        });
                    }
                } else
                    modals.destroyModal('preferences');
            },
            onClose: function() {
                modals.destroyModal('preferences');
            }
        });
        modals.viewModal({
            name: 'position_modal',
            title: 'Select Position',
            width: 200,
            height: 140,
            html,
            container: 'preferences'
        });
    });

    $(document).on('click', '#widgets-container .table-remove', function() {
        var name = $(this).closest('tr').data('name');
        var data = ui.getWidgets().getWidgetData()[name];
        if (!data) return false;
        var html = loader.loadFile(path.join(__dirname + '/modals/confirmation.pug'), {
            name,
            title: null,
            confirm: 'Yes',
            onConfirm: function(name) {
                var data = ui.getWidgets().getWidgetData(name);
                modals.destroyModal('preferences');
                if (data.active)
                    ui.getWidgets().removeWidget(name);
                var location = data.location;
                var p = path.resolve(location);
                if (!fs.existsSync(p)) return;
                rimraf(p, () => {});
                ui.getWidgets().deleteWidget(name);
            },
            onClose: function() {
                modals.destroyModal('preferences');
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

    $('.location-edit').click(function() {
        var name = $(this).closest('tr').data('name');
        var data = ui.getWidgets().getWidgetData()[name];
        if (!data) {
            console.log('no data for ' + name);
            return;
        }
        data = JSON.parse(JSON.stringify(data));
        var html = pug.renderFile(__dirname + '/modals/preferences/widgets/location.pug', {
            options: data,
            error: setMessage,
            onConfirm: function(setMessage) {
                var location = $('#location-input').val();
                var options = $('#location-container').data('options');
                options.location = location;
                modals.destroyModal('preferences');
                //check folder if files exist. return error if so, location must be empty.
                //Unload widget, and move files into new folder.
            },
            onClose: function() {
                modals.destroyModal('preferences');
            }
        });
        modals.viewModal({
            name: 'location-modal',
            title: 'Set Location',
            width: 225,
            height: 150,
            html,
            container: 'preferences'
        }, () => {
            $('#location-input').focus();
        });
    });

    $('#open-widget-folder').click(() => {
        if (!fs.existsSync(app.getPath('userData') + '/widgets'))
            fs.mkdirSync(app.getPath('userData') + '/widgets');
        exec('start ' + app.getPath('userData') + '/widgets/');
    });

    $('#widget-install-name').keydown((e) => {
        if (e.which == 13) $('#install-widget-btn').click();
    });

    $('#install-widget-btn').click(() => {
        var name = $('#widget-install-name').val();
        npm.checkPackage(name, (error, result) => {
            if (error) {
                console.error(error);
                return;
            }
            var realResults = [];
            if (result.results[0].name[0].includes('cclient') && result.results[0].name[0] === name) {
                //exact match. Install this package.
                realResults.push(result.results[0]);
            } else {
                realResults = result.results
                    .filter(r => r.name[0].includes('cclient-widget'))
                    .filter(r => !ui.getWidgets().getWidgetData(r.name[0]));
            }
            modals.viewModal({
                name: 'install_npm_package',
                title: 'Package to Install',
                width: 250,
                container: 'preferences',
                saveDragPosition: false,
                model: {
                    results: realResults
                },
                onDestroy: () => {
                    context.unregisterSelector('.install-widget-table');
                }
            });
            $('#preferences').on('remove', () => modals.destroyModal());
        });
    });

    function loadWidget(error, result, data) {
        var html = pug.renderFile(path.join(__dirname + '/modals/preferences/widgets/widget_tr.pug'), {
            data,
            module: result
        });
        $('#widgets-container tbody').append($(html));
        setTimeout(() => bgTables(), 100);
    }

    function loadWidgets() {
        $('#widgets-container tbody').empty();
        var widgets = ui.getWidgets().getWidgetData();
        for (var _widget in widgets) {
            var widget = widgets[_widget];
            ui.getWidgets().loadModule(widget, loadWidget);
        }
    }

    ui.getWidgets().subscribe('widget-pref', () => loadWidgets());

    $('#npm-notice').click(() => {
        if (!npmResult) shell.openExternal('https://nodejs.org/en/');
        if (!gitResult) shell.openExternal('https://git-scm.com/');
    });

});