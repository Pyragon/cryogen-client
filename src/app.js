'use strict';

const electron = require('electron');
const url = require('url');
const path = require('path');
const setupPug = require('electron-pug');
const windowState = require('electron-window-state');
const notifier = require('node-notifier');
// const {
//     openProcessManager
// } = require('electron-process-manager');
var _tray = require(__dirname + '/tray/tray.js');
var _github = require(__dirname + '/github.js');
var _client = require(__dirname + '/client.js');
var _api = require(__dirname + '/api.js');
// require('electron-reload')(__dirname, {
//     electron: require('$(__dirname)/../../node_modules/electron')
// });
// require('electron-debug')({
//     showDevTools: true,
//     enabled: true
// });
const {
    app,
    BrowserWindow,
    Menu,
    ipcMain,
    session,
    protocol
} = electron;
var defaults = require(__dirname + '/defaults.js')(app);
const Store = require('electron-store');
const store = new Store({
    defaults
});
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

// const setupEvents = require('./installers/setup-events');
// if (setupEvents.handleSquirrelEvent()) return;

var Cryogen = (function() {

    var github;
    var client;
    var api;
    var window;
    var tray;
    var properties;
    var notificationManager;

    function startElectron() {
        app.on('ready', () => {
            app.setAppUserModelId("Cryogen.WebClient");
            setupPug({
                pretty: true
            }, {});
            tray.init();
            // openProcessManager();
            createWindow();
            registerNotifications();
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin')
                app.quit();
        });

        app.on('activate', () => {
            if (window === null)
                createWindow();
        });

    }

    function sendMessage(opcode, data) {
        window.webContents.send(opcode, data);
    }

    function registerNotifications() {
        ipcMain.on('login:get-token', (event, data) => sendMessage('login:set-token', {
            token: api.getAuthToken(),
            expiry: api.getAuthExpiry()
        }));
        ipcMain.on('login:set-token', (event, data) => api.setAuthToken(data.token, data.expiry));
        ipcMain.on('git:last-commit', (event, data) => github.respond('last-commit', data));
        ipcMain.on('widgets:load', (event, data) => sendMessage('widgets:load', store.get('widgets')));
        ipcMain.on('plugins:load', (event, data) => sendMessage('plugins:load', store.get('plugins')));
        ipcMain.on('client:play', client.play);
        ipcMain.on('client:update', client.update);
        ipcMain.on('client:check', client.checkForLocal);
        ipcMain.on('bar:animate', (event, data) => {
            updateProgress(data.progress, true);
        });
    }

    function createWindow() {
        try {
            let mainWindowState = windowState({
                defaultWidth: 300,
                defaultHeight: 315
            });
            try {
                window = new BrowserWindow({
                    width: 300,
                    height: 315,
                    x: mainWindowState.x,
                    y: mainWindowState.y,
                    resizable: false,
                    frame: false,
                    backgroundThrottling: false,
                    thickFrame: true,
                    transparent: true,
                    title: 'Login to Cryogen',
                    icon: __dirname + '/static/images/icon.png'
                });
            } catch (e) {
                console.log(e);
            }
            window.loadURL(url.format({
                pathname: path.join(__dirname, '/static/index.pug'),
                protocol: 'file:',
                slashes: true
            }));
            window.on('closed', () => {
                window = null;
                tray.destroy();
            });
            mainWindowState.manage(window);
            Menu.setApplicationMenu(null);
        } catch (e) {
            console.log(e);
        }
    }

    function updateProgress(progress, fromRender = false) {
        window.setProgressBar(progress == 1 ? 0 : progress);
        if (!fromRender)
            window.webContents.send('client:progress', {
                progress
            });
    }

    return {

        init: function() {
            startElectron();
            github = _github(this);
            api = _api(this);
            client = _client(this);
            tray = _tray();
            client.init();

        },

        updateProgress: updateProgress,

        updateClient: function(version, disableBtn, btnText, play, action) {
            window.webContents.send('client:set-version', {
                version,
                disableBtn,
                btnText,
                play,
                action
            });
        },

        sendNotification: (title, body, callback, silent = false) => {
            var noty = new Notification({
                title,
                body: 'noty',
                silent,
                icon: 'http://cryogen.live/images/icon.png'
            });
            noty.show();
        },

        sendMessage: sendMessage,

        getWindow: function() {
            return window;
        },

        getAPI: () => {
            return api;
        },

        getStore: () => {
            return store;
        }

    };

})();
Cryogen.init();