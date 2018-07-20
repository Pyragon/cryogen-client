const path = require('path');
const express = require('express');
const request = require('request');
const cookieParser = require('cookie-parser');

var _tray = function(plugin, Tray) {

  tray = new Tray(path.join(__dirname, '../static/images/favicon.ico'));
  tray.on('click', () => {

  });

  app = express();
  app.use(cookieParser());

  app.get('/:key/:value', (req, res) => {
    var key = req.params.key;
    var value = req.params.value;
    console.log(`Received telemetry event for ${key}. Value=${value}`);
    res.send('success');
  });

  var server = app.listen(5556, () => {
    var host = server.address().address;
    var port = server.address().port;
    console.log(`Listening for events at http://${host}:${port}. You can configure these settings in your preferences.`);
  });

  requestAuthToken('cody', 'sdfsdf', (error, token) => {
    if(error) {
      console.log(error);
      return;
    }
    auth_token = token;
    registerForNotifications([ 'send_message' ], (data) => {
      console.log('send_message event triggered!');
    }, (response) => {
      if(response.error) {
        console.log('Error subscribing: '+response.error);
        return;
      }
      console.log(response.token);
      console.log(response.accepted);
    })
  });

  //Request new auth token from Cryogen API
  //Does not use expiry parameter. Defaults to 3 hour duration
  //Revoke=true. Revokes any other tokens assigned to our account
  function requestAuthToken(username, password, callback) {
    console.log(plugin);
    plugin.request({
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

  var subscriptions = {

    callbacks:[]

  };

  function registerForNotifications(keys, eventCallback, callback) {
    var events = keys.join(',');
    console.log(plugin);
    plugin.request({
      path: '/telemetry/subscribe',
      method: 'POST'
    }, {
      events
    }, (response) => {
      if(response.error) {
        callback(response);
        return;
      }
      for(var event in events) {
        subscriptions[event].callbacks.push(eventCallback);
      }
      callback(response);
    });
  }

  function sendNotification(key, value) {

  }

};

module.exports = _tray;
