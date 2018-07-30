const electron = require('electron');
const path = require('path');
const remote = electron.remote;
const renderer = electron.ipcRenderer;
const shell = electron.shell;
const session = remote.session;
const app = remote.app;
var extend = require('util')._extend;
const http = require('http');
const querystring = require('querystring');

var _login = require(__dirname + '/script/login.js');
var _ui = require(__dirname + '/script/ui.js');
var _plugins = require(__dirname + '/script/plugins.js');
const headerOptions = {
  hostname: 'localhost',
  port: 5555,
  headers: {

  }
};

var login;
var ui;
var plugins;
var userData;

var authToken;
var authExpiry;

var lastDataCheck;
var lastHash;

var config;

$(document).ready(() => start());

function registerGithub(callback) {
  renderer.send('git:last-commit');
  renderer.on('git:last-commit', (event, data) => {
    $('#last-commit').text(`${data.hash} - ${data.commit}`);
    lastHash = data.hash;
  });
  $('#last-commit').click(() => shell.openExternal('https://github.com/Pyragon/cryogen-client/commit/' + lastHash));
}

function start() {
  $('#minimize-button').click(() => remote.getCurrentWindow().minimize());
  $('#exit-button').click(() => app.quit());
  renderer.on('log', (event, data) => console.log(data.message));
  config = remote.getGlobal('config');
  login = _login();
  plugins = _plugins();
  ui = _ui();
  login.init();
  plugins.init();
}

function setSize(width, height) {
  remote.getCurrentWindow().setSize(width, height);
  $('#wrapper').css({
    'height': `${height}px`,
    'width': `${width}px`
  });
}

function setTitle(title) {
  $('#title').html(title);
  remote.getCurrentWindow().setTitle(title);
}

function sendNotificationWithOptions(options, callback) {
  var defaults = {
    icon: 'http://cryogen.live/images/icon.png'
  };
  var extended = extend(defaults, options);
  let noty = new Notification(options.title, {
    body: options.body,
    icon: options.icon
  });
  if (callback)
    noty.onclick = callback;
}

function sendNotification(title, body, callback) {
  let noty = new Notification(title, {
    body,
    icon: 'http://cryogen.live/images/icon.png'
  });
  if (callback)
    noty.onclick = callback;
}

function setAuthToken(token, expiry) {
  authToken = token;
  authExpiry = expiry;
}

function request(options, data, callback) {
  if (authToken && authExpiry > new Date().getTime())
    data.token = authToken;
  options.path = options.path + '?' + querystring.stringify(data);
  var extended = extend(headerOptions, options);
  var req = http.request(extended, (res) => {
    res.setEncoding('utf8');
    let dataChunk = '';
    res.on('data', (chunk) => {
      dataChunk += chunk;
    });
    res.on('end', () => {
      var data = "";
      try {
        data = JSON.parse(dataChunk);
      } catch (e) {
        console.log('Error occurred in JSON1: ' + dataChunk);
        console.log('Path taken: ' + options.path);
        console.log('Error: ' + e);
        callback(e);
        return;
      }
      try {
        callback(data);
      } catch (e) {
        console.log('Error occurred in JSON2: ' + dataChunk);
        console.log('Error occured in callback: ' + callback);
        console.log('Path taken: ' + options.path);
        console.log('Error: ' + e);
        callback(e);
      }
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

function getCookie(name, callback) {
  session.defaultSession.cookies.get({
    url: 'http://localhost',
    name
  }, (error, cookies) => {
    if (error) {
      callback(error);
      return;
    }
    if (!cookies.length) {
      callback("No cookie found.");
      return;
    }
    var cookie = cookies[0].value;
    callback(error, cookie);
  });
}

function saveCookie(key, value) {
  var date = new Date();
  date.setHours(date.getHours() + 23);
  session.defaultSession.cookies.set({
    url: 'http://localhost',
    name: key,
    value,
    session: true,
    expirationDate: date.getTime()
  }, (error) => {
    if (error) console.error(error);
  });
}

function getUserData(callback) {
  if (!authToken) {
    callback(null);
    return;
  }
  var now = new Date().getTime();
  if (userData && lastDataCheck < now) callback(userData);
  request({
    path: '/users/me',
    method: 'GET'
  }, {}, (response) => {
    if (response.error) {
      console.error(response.error);
      callback(null);
      return;
    }
    userData = response.account;
    lastDataCheck = now + 30000;
    callback(userData);
  });
}

function switchToMainUI() {
  console.log('Switching');
  ui.init();
}