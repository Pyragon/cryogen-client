/* jshint node: true */

'use strict';

const electron = require('electron');
const url = require('url');
const path = require('path');
const github = require('octonode');
const setup = require('electron-pug');
const windowState = require('electron-window-state');
var client = github.client();
var repo = client.repo('Pyragon/cryogen-client');
const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  session
} = electron;

var last_hash = null;

require('electron-reload')(__dirname, {
  electron: require('$(__dirname)/../../node_modules/electron')
});
require('electron-debug')({
  showDevTools: true,
  enabled: true
});

let window;
let tray = null;

app.on('ready', () => {
  try {
    let pug = setup({pretty:true}, {});
  } catch(err) {
    console.log('Error loading electron-pug:', err);
  }
  tray = new Tray(path.join(__dirname, 'static/images/favicon.ico'));
  tray.on('click', () => {

  });
  createWindow();
});

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin')
    app.quit();
});

app.on('activate', () => {
  if(window === null)
    createWindow();
});

ipcMain.on('git:last-commit', () => {
  if(last_hash != null) {
    window.webContents.send('git:last-commit', {
      commit: last_hash
    });
    return;
  }
  var commits = repo.commits((error, body, headers) => {
      if(error) {
        console.log('Error getting commits: '+error);
        return;
      }
      if(body.length > 0) {
        var last = body[0];
        var message = last.commit.message;
        last_hash = message;
        window.webContents.send('git:last-commit', {
          commit: message
        });
      }
  });
});

function createWindow() {
  let mainWindowState = windowState({
    defaultWidth: 300,
    defaultHeight: 315
  });
  window = new BrowserWindow({
    width: 300,
    height: 315,
    x: mainWindowState.x,
    y: mainWindowState.y,
    resizable: false,
    radii: [5, 5, 5, 5],
    frame: false,
    backgroundThrottling: false,
    thickFrame: true,
    transparent: true,
    title: 'Login to Cryogen',
    icon: path.join(__dirname, 'static/images/icon.png')
  });
  window.loadURL(url.format({
    pathname: path.join(__dirname, 'static/index.pug'),
    protocol: 'file:',
    slashes: true
  }));
  window.on('closed', () => {
    window = null;
  });
  mainWindowState.manage(window);
  Menu.setApplicationMenu(null);
}
