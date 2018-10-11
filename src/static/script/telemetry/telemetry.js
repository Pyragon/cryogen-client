const _express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');

var _telemetry = () => {

    var subscriptions = [];
    var replaced = [];
    var server;

    function loadServer() {
        express = _express();
        express.use(cookieParser());

        express.post('/:key', (req, res) => {
            var key = req.params.key;
            var value = null;
            if (req.query.value)
                value = JSON.parse(req.query.value);
            if (key)
                sendCallback(key, value);
            res.status(200).end('');
        });

        server = express.listen(5556, () => {
            var host = server.address().address;
            var port = server.address().port;
            //console.log(`Listening for events at http://${host}:${port}. You can configure these settings in your preferences.`);
        });
    }

    function destroyServer() {
        var host = server.address().address;
        var port = server.address().port;
        server.close();
        //console.log(`Finished listening for events at http://${host}:${port}.`);
    }

    function sendCallback(key, data) {
        if (!subscriptions[key]) {
            var mod = require(`${__dirname}/impl/${key}.js`)();
            if (!mod) {
                console.log('Unable to find a callback method for this event.');
                return;
            }
            if (mod.receive)
                mod.receive(data);
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

        unsubscribeFromEvents: (_events) => {
            var events = !Array.isArray(_events) ? _events.split(',') : _events;
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                delete subscriptions[event];
                delete replaced[event];
            }
            events = events.filter(e => e != 'logged_in');
            if (events.join() != '')
                request({
                    path: '/telemetry/unsubscribe/' + events.join(),
                    method: 'POST'
                }, {}, function(ret) {});
        },

        subscribeToEvents: (events, callback) => {
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
                    if (response.error.includes('expired')) {
                        console.log('Token has expired');
                        if (!store.get('autoLogin')) {
                            sendNotification('Your token has expired and autologin is not enabled. Please logout and relogin to be able to use Telemetry events.');
                            return;
                        }
                        console.log('Requesting auth token');
                        requestAuthToken((error, token) => {
                            if (error) {
                                sendNotification('Error rerequesting authentication token.');
                                console.error(error);
                                return;
                            }
                            console.log('Received Token: ' + token);
                            this.subscribeToEvents(events);
                        });
                        return;
                    }
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
                    if (event.callback) cb = event.callback;
                    var sub;
                    if (subscriptions[event.name]) {
                        sub = subscriptions[event.name];
                        if (event.replace && !replaced[event.name]) {
                            sub.callbacks = [];
                            if (cb) sub.callbacks.push(cb);
                            replaced[event.name] = true;
                        } else if (cb)
                            sub.callbacks.push(cb);
                        subscriptions[event.name] = sub;
                    } else if (!replaced[event.name] && cb) {
                        sub = {
                            callbacks: []
                        };
                        sub.callbacks.push(cb);
                        subscriptions[event.name] = sub;
                    }
                }
                if (callback) callback(response.accepted);
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