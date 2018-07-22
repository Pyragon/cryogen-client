/* jshint node: true */
'use strict';

const electron = require('electron');
const remote = electron.remote;
const renderer = electron.ipcRenderer;
const app = remote.app;
const session = remote.session;

var extend = require('util')._extend;
const http = require('http');
const querystring = require('querystring');

var _main = function(module) {

  var auth_token;
  var auth_expiry;

  const headerOptions = {
    hostname: 'localhost',
    port: 5555,
    headers: {

    }
  };

  function setSize(width, height) {
    remote.getCurrentWindow().setSize(width, height);
    $('#wrapper').css({
      'height': `${height}px`,
      'width': `${width}px`
    });
  }

  return {

    init: () => {
      $('#minimize-button').click(() => remote.getCurrentWindow().minimize());
      $('#exit-button').click(() => app.quit());
    },

    setAuthToken: (token) => {
      auth_token = token;
      renderer.send('login:set-token', { token });
    },

    getAuthToken: () => { return auth_token; },

    getCookie: (name, callback) => {
      session.defaultSession.cookies.get({
        url: 'http://localhost',
        name
      }, (error, cookies) => {
        if(error) {
          callback(error);
          return;
        }
        var cookie = cookies[0].value;
        callback(error, cookie);
      });
    },

    saveCookie: (key, value) => {
      var date = new Date();
      date.setHours(date.getHours() + 23);
      session.defaultSession.cookies.set({
        url: 'http://localhost',
        name: key,
        value,
        session: true,
        expirationDate: date.getTime()
      }, (error) => {
        if(error) console.error(error);
      });
    },

    removeCookie: (key) => {
      session.defaultSession.cookies.remove('http://localhost', key);
    },

    setSize: (width, height) => setSize(width, height),

    switchToMainUI: () => {
      setSize(750, 450);
      $('#main-content').html('');
      $('#main-content').load('ui.pug');
    },

    setTitle: (title) => {
      $('#title').html(title);
      remote.getCurrentWindow().setTitle(title);
    },

    request: (options, data, callback) => {
      if(auth_token && auth_expiry > new Date().getTime())
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
          var data = "";
          try {
            data = JSON.parse(dataChunk);
          } catch(e) {
            console.log('Error occurred in JSON: '+dataChunk);
            console.log('Path taken: '+options.path);
            callback(e);
            return;
          }
          try {
            callback(data);
          } catch(e) {
            console.log('Error occured in callback: '+callback);
            console.log('Error: '+e);
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

  };

};
module.exports = _main;
