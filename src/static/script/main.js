/* jshint node: true */
'use strict';

const electron = require('electron');
const { remote, ipcRenderer } = electron;
const app = remote.app;
const session = remote.session;
const shell = remote.shell;

var extend = require('util')._extend;
const http = require('http');
const querystring = require('querystring');
const ProgressBar = require('progressbar.js');
var dateFormat = require('dateformat');

var auth_token = null;
var user_hash = null;

var plugin = this;

const headerOptions = {
  hostname: 'localhost',
  port: 5555,
  headers: {

  }
};

var user = null;

$(document).ready(() => {

  $('#minimize-button').click(minimizeWindow);
  $('#exit-button').click(exitWindow);

  $('#title').html(remote.getCurrentWindow().getTitle());

  function minimizeWindow() {
    remote.getCurrentWindow().minimize();
  }

  function exitWindow() {
    app.quit();
  }

});

//load the main ui html into main-content div
//called from login.js - login()
//TODO - call from login.js loginAsGuest()
function switchToMainUI() {
  remote.getCurrentWindow().setSize(750, 450);
  $('#main-content').html('');
  $('#main-content').load('main-ui.pug');
  $('#wrapper').css({
    'height': '450px',
    'width': '750px'
  });
}

function setTitle(title) {
  $('#title').html(title);
}

//Save a cookie via electron's session object
//Name: Name of cookie
//Value: Value of cookie
//URL='http://localhost': Assigning url of cookie automatically
function saveCookie(name, value) {
  var date = new Date();
  date.setHours(date.getHours() + 24);
  session.defaultSession.cookies.set({
    url: 'http://localhost',
    name: name,
    value: value,
    session: true,
    expirationDate: date.getTime()
  }, (error) => {
    if(error) {
      console.log('Error saving cookie data!');
      console.log(error);
    }
  });
}

//Request from Cryogen API
//Options: path, method, headers
//path=/endpoint...
//method=GET/POST
//headers: Headers used for authentication via token
//Data: Query parameters to send to endpoint
//Callback: Function gets called when request finished with either data or error
function request(options, data, callback, login=false) {
  if(auth_token && !login)
    data.token = auth_token;
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

//Request new auth token from Cryogen API
//Does not use expiry parameter. Defaults to 3 hour duration
//Revoke=true. Revokes any other tokens assigned to our account
function requestAuthToken(username, password, callback) {
  request({
    path: '/login',
    method: 'POST'
  }, {
    username: username,
    password: password,
    revoke: true
  }, (response) => {
    callback(response.error, response.token);
  }, true);
}

//Connect to /users endpoint and print information about our account to use later in the Client
//As we're using the /me action, we don't need to pass any additional parameters other than our auth
function getUserData(callback) {
  request({
    path: '/users/me',
    method: 'GET'
  },  {},  (response) => {
    callback(response.error, response.account);
  });
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
