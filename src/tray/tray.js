const path = require('path');
const express = require('express');
const request = require('request');
const cookieParser = require('cookie-parser');

var _tray = function(plugin, Tray) {

  var tray = new Tray(path.join(__dirname, '../static/images/favicon.ico'));
  tray.on('click', () => {

  });

  // var app = express();
  // app.use(cookieParser());
  //
  // app.get('/:key/:value', (req, res) => {
  //   var key = req.params.key;
  //   var value = req.params.value;
  //   console.log(`Received telemetry event for ${key}. Value=${value}`);
  //   res.send('success');
  // });
  //
  // var server = app.listen(5556, () => {
  //   var host = server.address().address;
  //   var port = server.address().port;
  //   console.log(`Listening for events at http://${host}:${port}. You can configure these settings in your preferences.`);
  // });

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
