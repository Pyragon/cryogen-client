'use strict';

const electron = require('electron');
const url = require('url');
const path = require('path');
const setupPug = require('electron-pug');
const windowState = require('electron-window-state');
const _properties = require(__dirname + '/props/properties.js');
const {
  openProcessManager
} = require('electron-process-manager');
var _tray = require(__dirname + '/tray/tray.js');
var _github = require(__dirname + '/github.js');
var _client = require(__dirname + '/client.js');
var _api = require(__dirname + '/api.js');
// require('electron-reload')(__dirname, {
//   electron: require('$(__dirname)/../../node_modules/electron')
// });
require('electron-debug')({
  showDevTools: true,
  enabled: true
});
const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  session
} = electron;

var Cryogen = (function() {

  var github;
  var client;
  var api;
  var window;
  var tray;
  var properties;

  var config;

  function startElectron() {

    app.on('ready', () => {
      setupPug({
        pretty: true
      }, {});
      properties = _properties();
      properties.loadProperties((configD) => {
        config = configD;
      });
      // openProcessManager();
      createWindow();
      //tray = _tray(this, Tray);
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

    ipcMain.on('login:get-token', (event, data) => sendMessage('login:set-token', api.getAuthToken()));
    ipcMain.on('login:set-token', (event, data) => api.setAuthToken(data.token));
    ipcMain.on('git:last-commit', (event, data) => github.respond('last-commit', data));
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
          iconUrl: 'http://cryogen.live/images/icon.png'
        });
      } catch (e) {
        console.log(e);
      }
      console.log(path.join(__dirname, '/static/images/favicon.ico'));
      window.loadURL(url.format({
        pathname: path.join(__dirname, '/static/index.pug'),
        protocol: 'file:',
        slashes: true
      }));
      window.on('closed', () => {
        window = null;
      });
      mainWindowState.manage(window);
      Menu.setApplicationMenu(null);
    } catch (e) {
      console.log(e);
    }
  }

  function updateProgress(progress, fromRender = false) {
    console.log(progress);
    window.setProgressBar(progress == 1 ? 0 : progress);
    if (!fromRender)
      window.webContents.send('client:progress', {
        progress
      });
  }

  return {

    init: function() {
      github = _github(this);
      api = _api(this);
      client = _client(this);
      client.init();

      //TODO - load configs

      startElectron();
    },

    updateProgress: (progress) => {
      updateProgress(progress);
    },

    updateClient: function(version, disableBtn, btnText, play, action) {
      window.webContents.send('client:set-version', {
        version,
        disableBtn,
        btnText,
        play,
        action
      });
    },

    sendMessage: (opcode, data) => sendMessage(opcode, data),

    getWindow: function() {
      return window;
    }

  };

})();
Cryogen.init();