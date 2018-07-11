'use strict';

const electron = require('electron')
const url = require('url')
const path = require('path')
const github = require('octonode')
const setup = require('electron-pug')
const windowState = require('electron-window-state')
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
})
require('electron-debug')({
  showDevTools: false,
  enabled: true
})

let window;

app.on('ready', () => {
  try {
    let pug = setup({pretty:true}, {})
  } catch(err) {
    console.log('Error loading electron-pug:', err)
  }
  createLoginWindow()
});
app.on('window-all-closed', () => {
  if(process.platform !== 'darwin')
    app.quit()
});
app.on('activate', () => {
  if(window === null)
    createLoginWindow();
});

ipcMain.on('noty', sendNotification)

function sendNotification() {
  new Notification('Title', {
    body: 'test'
  }).show()
}

function createLoginWindow() {
  let loginWindowState = windowState({
    defaultWidth: 300,
    defaultHeight: 300
  })
  window = new BrowserWindow({
    width: loginWindowState.width,
    height: loginWindowState.height,
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
  loginWindowState.manage(window)
  Menu.setApplicationMenu(null)
}
