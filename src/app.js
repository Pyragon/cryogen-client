/* jshint node: true */

'use strict';

const electron = require('electron');
const url = require('url');
const path = require('path');
const github = require('octonode');
const setup = require('electron-pug');
const _request = require('request');
const progress = require('request-progress');
const windowState = require('electron-window-state');
const http = require('http');
const querystring = require('querystring');
const pretty = require('prettysize');
const fs = require('fs');
var exec = require('child_process').execFile;
var spawn = require('child_process').spawn;
var extend = require('util')._extend;
var client = github.client();
var repo = client.repo('Pyragon/cryogen-client');
var plugin = this;
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

var runnableVersion = null;

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
      var hash = '';
      if(error) {
        console.log('Error getting latest commit: '+error);
        hash = 'Error connecting to Github.';
      } else {
        if(body.length > 0) {
          var last = body[0];
          var message = last.commit.message;
          last_hash = message;
          hash = message;
        }
      }
      window.webContents.send('git:last-commit', {
        commit: hash
      });
  });
});

ipcMain.on('client:play', () => {
  if(plugin.runnableVersion == null) {
    updateClient('Error running...', false, 'Retry', false, 'Error finding client version. Please restart or retry download.');
    return;
  }
  window.minimize();
  var f = require.resolve('../client/client_v'+plugin.runnableVersion+'.jar');
  var child = spawn(f, {shell:true});

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', console.log);
});

ipcMain.on('client:update', () => {
  getLatestVersion((response) => {
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

function downloadClient(version, clientPath) {
  var p = path.join(__dirname, '../client/client_v'+version+'.jar');
  var file = fs.createWriteStream(p);
  var location = 'http://localhost:5555/live/download/'+version;
  var test = 'http://ipv4.download.thinkbroadband.com/100MB.zip';
  progress(_request(location), {

  })
  .on('progress', (state) => {
    updateProgress(state.percent);
    updateClient(`ETA: ${secondsToTime(state.time.remaining)}`, true, 'Downloading...', false, `Downloading v${version} from ${clientPath} at ${pretty(state.speed)}/s - ${parseInt(state.percent * 100)}%`);
  }).on('error', (err) => {
    console.log(err);
    fs.unlink(p);
    updateClient('Error downloading...', false, 'Retry', false, 'Error downloading latest client. Please try again later.');
  }).on('end', () => {
    plugin.runnableVersion = version;
    updateClient('v'+version, false, 'Play', true, `Finished downloading v${version} from ${clientPath}.`);
    updateProperties(version, clientPath);
  }).pipe(file);
}

function updateProgress(progress) {
  window.setProgressBar(progress);
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

function updateProperties(version, clientPath) {
  var data = {
    version:version.toString(),
    path:clientPath,
    dateDownloaded:new Date().getTime()
  };
  var p = path.join(__dirname, '../client/props.json');
  fs.writeFile(p, JSON.stringify(data), (error) => {
    if(error)
      console.log('Error updating properties file: '+error);
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
  var r = path.resolve(__dirname, '../client/');
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
    plugin.runnableVersion = json.version;
    getLatestVersion((response) => {
      if(response.error) {
        updateClient('Error loading...', false, 'Retry', false, 'Error getting latest client version. Please try again later.');
        return;
      }
      window.webContents.send('client:check', {
        found: true,
        version: json.version,
        latest: response.version,
        location: r
      });
    });
  });
});

function getLatestVersion(callback) {
  request({
    path: '/live/get/latest',
    method: 'GET'
  },
  {},
  callback);
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

function secondsToTime (time) {
    var sec_num = parseInt(time, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}
