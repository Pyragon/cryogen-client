const ProgressBar = require('progressbar.js');
var dateFormat = require('dateformat');

const electron = require('electron');
const renderer = electron.ipcRenderer;
const _widgets = require(__dirname + '/widgets/widgets.js');
const _plugins = require(__dirname + '/plugins.js');
const _telemetry = require(__dirname + '/telemetry/telemetry.js');

var _ui = function() {

    var bar;
    var widgets;
    var plugins;
    var telemetry;

    var started;

    var debug = false;

    function registerNotifications(user) {
        renderer.on('log', (event, data) => console.log(data.message));
        renderer.on('client:check', (event, data) => readClientCheck(data));
        renderer.on('client:progress', (event, data) => setProgress(data.progress, true));
        renderer.on('client:set-version', (event, data) => setVersion(data));
        if (!user) return;
        telemetry.subscribeToEvents([{
            name: 'private_message_received'
        }, {
            name: 'logged_in'
        }, {
            name: 'logged_out'
        }]);
    }

    function buildContextMenu(user) {
        var items = [];
        var settings = {
            name: 'Settings',
            icon: 'fa fa-cogs',
            callback: () => modals.viewModal({
                name: 'preferences/preferences',
                title: 'Client Preferences',
                height: 350,
                width: 500,
                saveDragPosition: false,
                id: 'preferences'
            })
        };
        if (user) {
            items.push(settings);
            items.push({
                name: 'Log Out',
                icon: 'fa fa-user-times',
                callback: () => {
                    if (store.get('askForLogout'))
                        modals.viewModal({
                            name: 'log_out_conf',
                            title: 'Log Out',
                            height: 140,
                            width: 175
                        });
                    else switchToLogin();
                }
            });
        } else {
            items.push(settings);
            items.push({
                name: 'Log In',
                icon: 'fa fa-user-plus',
                callback: () => {
                    switchToLogin();
                }
            });
        }
        context.addMenuItems({
            selector: '#user-area',
            items
        });
    }

    function setVersion(data) {
        if (data.version)
            editClientVersion(data.version);
        editClientButton(data.disableBtn, data.btnText);
        if (!data.disableBtn)
            setButtonFunc(data.play ? 'play' : 'update');
        setAction(data.action);
    }

    function checkForClient() {
        renderer.send('client:check');
        setAction('Checking for client...');
        setProgress(0.1);
    }

    function setProgress(progress, fromMain = false) {
        bar.animate(progress);
        if (!fromMain)
            renderer.send('bar:animate', {
                progress
            });
    }

    function loadBar() {
        bar = new ProgressBar.Line('#container', {
            strokeWidth: 4,
            easing: 'easeInOut',
            duration: 1400,
            color: '#FFEA82',
            trailColor: '#eee',
            trailWidth: 1,
            svgStyle: {
                width: '100%',
                height: '100%',
                'border-radius': '5px'
            }
        });
    }

    function readClientCheck(data) {
        if (!data.found) {
            if (data.err) {
                console.log(data.err);
                editClientVersion('Error loading client');
                editClientButton(false, 'Download', data.err);
                setAction('Ready to Download!');
                setButtonFunc('update');
                setProgress(0);
                return;
            }
            editClientVersion('No client detected');
            editClientButton(false, 'Download');
            setAction('Ready to Download!');
            setButtonFunc('update');
            setProgress(1);
            return;
        }
        var version = data.version;
        var latest = data.latest;
        var location = data.location;
        var str = 'V: ' + version;
        if (version != latest) {
            str += ' - OOD';
            editClientButton(false, 'Update', 'Client found at: ' + location);
            setAction('Ready to Update!');
            setButtonFunc('update');
            console.log('ood');
            setProgress(0);
        } else {
            editClientButton(false, 'Play', 'Client found at: ' + location);
            setAction('Ready to Play!');
            setButtonFunc('play');
            setProgress(1);
        }
        editClientVersion(str, version, latest);
    }

    function btnClick() {
        if (btnAction == null || btnAction == 'update')
            updateClient();
        else
            playClient();
    }

    function playClient() {
        renderer.send('client:play');
        setAction('Starting client...');
    }

    function updateClient() {
        renderer.send('client:update');
        setAction('Updating client...');
    }

    function setAction(action) {
        $('#action').html(`Action: ${action}`);
    }

    function setButtonFunc(action) {
        btnAction = action;
    }

    function editClientVersion(version, current, latest) {
        $('#client-version').text(version);
    }

    function editClientButton(disabled, title, location = null) {
        var element = $('#client-btn');
        element.text(title);
        element.prop('disabled', disabled);
        if (location == null) {
            element.removeAttr('title');
        } else {
            element.prop('title', location);
        }
    }

    return {

        start: function() {
            loadBar();
            registerGithub();
            widgets = _widgets();
            plugins = _plugins();
            widgets.init();
            plugins.init();
            started = true;
            getUserData((data) => {
                registerNotifications(data);
                buildContextMenu(data);
                checkForClient();
                setTitle('Cryogen UI - Logged in as ' + (data == null ? 'Guest' : data.display_name));
                $('#user-lett').html(data == null ? 'G' : data.display_name.charAt(0));
                var click;
                if (data == null)
                    click = switchToLogin;
                else {
                    click = () => modals.viewModal({
                        name: 'preferences/preferences',
                        title: 'Client Preferences',
                        height: 350,
                        width: 500,
                        saveDragPosition: false,
                        id: 'preferences'
                    });
                }
                $('#user-area').click(click);
                $('#client-btn').click(btnClick);
                if (debug) {
                    modals.viewModal({
                        name: 'preferences/preferences',
                        title: 'Client Preferences',
                        height: 350,
                        width: 500,
                        saveDragPosition: false,
                        id: 'preferences'
                    });
                }
            });
        },

        init: function() {
            setSize(750, 450);
            $('#main-content').html('');
            $('#main-content').load('ui.pug', () => ui.start());
            telemetry = _telemetry();
            telemetry.init();
        },

        destroy: () => {
            //destroy persisting objects like telemetry's server.
            telemetry.destroy();
            context.unregisterSelector('#user-area');
        },

        getWidgets: () => {
            return widgets;
        },

        getPlugins: () => {
            return plugins;
        },

        getTelemetry: () => {
            return telemetry;
        },

        hasStarted: () => {
            return started;
        }

    };

};
module.exports = _ui;