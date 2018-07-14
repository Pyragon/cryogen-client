/* jshint node: true */

'use strict';

const electron = require('electron');
const url = require('url');
const path = require('path');
const github = require('octonode');
const setup = require('electron-pug');
const windowState = require('electron-window-state');
const http = require('http');
const querystring = require('querystring');
const fs = require('fs');
var extend = require('util')._extend;
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

const headerOptions = {
  hostname: 'localhost',
  port: 5555,
  headers: {

  }
};

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

ipcMain.on('client:play', () => {

});

ipcMain.on('client:update', () => {
  request({
    path: '/live/get/latest',
    method: 'GET'
  },
  {},
  (response) => {
    if(response.error) {
      updateClient('Error downloading', false, 'Retry', false, 'Ready to Retry');
      return;
    }
    var version = response.version;
    var path = response.path;
    updateProgress(0.1);
    updateClient(null, true, 'Downloading...', false, `Starting download for v${version} from ${path}`);
    downloadClient(version, path);
  });
});

function downloadClient(version, path) {

}

function updateProgress(progress) {
  window.webContents.send('client:progress', { progress });
}

function updateClient(version, disableBtn, btnText, play, action) {
  window.webContents.send('client:set-version', {
    version,
    disableBtn,
    btnText,
    play,
    action
  });
}

function download(options, data, callback) {
  options.path = options.path+'?'+querystring.stringify(data);
  var extended = extend(headerOptions, options);
  var req = http.request(extended, (res) => {
    var len = parseInt(res.headers['content-length'], 10);
    var body = "";
    var cur = 0;
    var total = len / 1048576;
    res.on('data', (chunk) => {
      body += chunk;
      cur += chunk.length;
      console.log(cur / len);
      updateProgress(cur / len);
    });

    res.on('end', () => {
      callback(null, body);
      updateProgress(1.0);
    });

    res.on('error', (error) => {
      callback({
        error
      });
    });
  });
}

function request(options, data, callback, login=false) {
  options.path = options.path+'?'+querystring.stringify(data);
  var extended = extend(headerOptions, options);
  var req = http.request(extended, (res) => {
    res.setEncoding('utf8');
    let dataChunk = '';
    res.on('data', (chunk) => {
      dataChunk += chunk;
    });
    res.on('end', () => {
      console.log(dataChunk+"s");
      var data = JSON.parse(dataChunk);
      callback(data);
    });
  });
  req.on('error', (e) => {
    console.log(`Error requesting: ${e.message}`);
    callback({
      success: true,
      error: e.message
    });
  });
  req.write(querystring.stringify(data));
  req.end();
}

ipcMain.on('client:check', () => {
  var p = path.join(__dirname, '../client/props.json');
  var r = path.resolve(__dirname, '../client/props.json');
  if(!fs.existsSync(p)) {
    window.webContents.send('client:check', {
      found: false,
      err: 'File does not exist'
    });
    return;
  }
  fs.readFile(p, { encoding: 'utf-8' }, (err, data) => {
    if(err) {
      window.webContents.send('client:check', {
        found: false,
        err
      });
      return;
    }
    var json = JSON.parse(data);
    window.webContents.send('client:check', {
      found: true,
      version: json.version,
      latest: '1.0.2',
      location: r
    });
  });
});

function getLatestVersion() {

}

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
