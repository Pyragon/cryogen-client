'use strict';

const electron = require('electron')
const url = require('url')
const path = require('path')
const github = require('octonode')
const setup = require('electron-pug')
const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  session,
  Notification
} = electron;

require('electron-reload')(__dirname, {
  electron: require('$(__dirname)/../../node_modules/electron')
})
require('electron-debug')({
  showDevTools: true,
  enabled: true
})

let window;

app.on('ready', () => {
  try {
    let pug = setup({pretty:true}, {})
  } catch(err) {
    console.log('Error loading electron-pug:', err)
  }
  createWindow()
});
app.on('window-all-closed', () => {
  if(process.platform !== 'darwin')
    app.quit()
});
app.on('activate', () => {
  if(window === null)
    createWindow();
});

ipcMain.on('noty', sendNotification)

function sendNotification() {
  new Notification('Title', {
    body: 'test'
  }).show()
}

function createWindow() {
  window = new BrowserWindow({
    width: 300,
    height: 300,
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
  Menu.setApplicationMenu(null)
}
