const _express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');

var _telemetry = () => {

  var subscriptions = [];

  function loadServer() {
    express = _express();
    express.use(cookieParser());

    express.post('/:key', (req, res) => {
      var key = req.params.key;
      var value = null;
      console.log(key + ' ' + JSON.stringify(req.query));
      if (req.query.value)
        value = JSON.parse(req.query.value);
      if (key)
        sendCallback(key, value);
      res.status(200).end('');
    });

    server = express.listen(5556, () => {
      var host = server.address().address;
      var port = server.address().port;
      console.log(`Listening for events at http://${host}:${port}. You can configure these settings in your preferences.`);
    });
  }

  function destroyServer() {
    server.close();
    console.log(`Finished listening for events at http://${host}:${port}.`);
  }

  function sendCallback(key, data) {
    console.log(key);
    if (!subscriptions[key]) {
      console.log('no subscription found.');
      return;
    }
    for (var i = 0; i < subscriptions[key].callbacks.length; i++) {
      var cb = subscriptions[key].callbacks[i];
      cb(data);
    }
  }

  return {

    init: () => {
      loadServer();
    },

    destroy: () => destroyServer(),

    subscribeToEvents: (events) => {
      var accepted = [];
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (!event.callback && !fs.existsSync(`${__dirname}/impl/${event.name}.js`))
          continue;
        accepted.push(event);
      }
      var names = accepted.map(e => e.name);
      request({
        path: '/telemetry/subscribe/' + names.join(),
        method: 'POST'
      }, {}, (response) => {
        if (response.error) {
          console.log(response.error);
          return;
        }
        if (response.accepted.length <= 0) {
          console.error('Unable to register telemetry events: ' + events);
          return;
        }
        var eAccepted = response.accepted;
        for (var i = 0; i < events.length; i++) {
          var event = events[i];
          if (!eAccepted.includes(event.name)) continue;
          var cb = null;
          if (event.callback)
            cb = event.callback;
          else {
            var mod = require(`${__dirname}/impl/${event.name}.js`)();
            if (!mod) {
              console.log('Unable to find a callback method for this event.');
              continue;
            }
            cb = mod.receive;
          }
          var sub;
          if (subscriptions[event.name]) {
            sub = subscriptions[event.name];
            sub.callbacks.push(cb);
            subscriptions[event.name] = sub;
          } else {
            sub = {
              callbacks: []
            };
            sub.callbacks.push(cb);
            subscriptions[event.name] = sub;
          }
        }
      });
    },

    registerForTelemetryEvent: (eventString) => {
      try {
        var events = eventString.split(', ');
        var accepted = [];
        for (var i = 0; i < events.length; i++) {
          var e = events[i];
          if (!fs.existsSync(`${__dirname}/impl/${e}.js`))
            continue;
          accepted.push(e);
        }
        request({
          path: '/telemetry/subscribe/' + accepted.join(),
          method: 'POST'
        }, {}, (response) => {
          if (response.error) {
            console.log(response.error);
            return;
          }
          if (!response.accepted) {
            console.log('Accepted is null.');
            console.error(response);
            console.error(JSON.stringify(response));
            return;
          }
          for (var k = 0; k < response.accepted.length; k++) {
            var accepted = response.accepted[k];
            var mod = require(`${__dirname}/impl/${accepted}.js`)();
            if (!mod) {
              console.log('Unable to find a callback method for this event.');
              return;
            }
            var sub;
            if (subscriptions[accepted]) {
              sub = subscriptions[accepted];
              sub.callbacks.push(mod.receive);
              subscriptions[accepted] = sub;
            } else {
              sub = {
                callbacks: []
              };
              sub.callbacks.push(mod.receive);
              subscriptions[accepted] = sub;
            }
          }
        });
      } catch (e) {
        console.error(e);
      }
    }

  };

};
module.exports = _telemetry;