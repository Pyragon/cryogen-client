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
  ipcMain,
  session,
  Notification
} = electron;

var authToken = null;

require('electron-reload')(__dirname, {
  electron: require('$(__dirname)/../../node_modules/electron')
});
require('electron-debug')({
  showDevTools: true,
  enabled: true
});

let window;

app.on('ready', () => {
  try {
    let pug = setup({pretty:true}, {});
  } catch(err) {
    console.log('Error loading electron-pug:', err);
  }
  createLoginWindow();
});
app.on('window-all-closed', () => {
  if(process.platform !== 'darwin')
    app.quit();
});
app.on('activate', () => {
  if(window === null)
    createLoginWindow();
});

ipcMain.on('noty', sendNotification);

ipcMain.on('login:set-token', (token) => {
  authToken = token;
});

ipcMain.on('login:switch-ui', () => {
  switchToMainUI();
});

ipcMain.on('git:last-commit', () => {
  var commits = repo.commits((error, body, headers) => {
      if(error) {
        console.log('Error getting commits: '+error);
        return;
      }
      if(body.length > 0) {
        var last = body[0];
        var message = last.commit.message;
        window.webContents.send('git:last-commit', {
          commit: message
        });
      }
  });
});

function sendNotification() {
  new Notification('Title', {
    body: 'test'
  }).show();
}

function switchToMainUI() {
  window.setSize(750, 450);
  window.loadURL(url.format({
    pathname: path.join(__dirname, 'static/main-ui.pug'),
    protocol: 'file:',
    slashes: true
  }));
}

function createLoginWindow() {
  let loginWindowState = windowState({
    defaultWidth: 300,
    defaultHeight: 315
  });
  window = new BrowserWindow({
    width: 300,
    height: 315,
    x: loginWindowState.x,
    y: loginWindowState.y,
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
    pathname: path.join(__dirname, 'static/login.pug'),
    protocol: 'file:',
    slashes: true
  }));
  window.on('closed', () => {
    window = null;
  });
  loginWindowState.manage(window);
  Menu.setApplicationMenu(null);
}
