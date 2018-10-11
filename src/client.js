const path = require('path');
const fs = require('fs');
const _api = require(__dirname + '/api.js');
var spawn = require('child_process').spawn;
const app = require('electron').app;

var _client = function(app) {

    var latestVersion;
    var localVersion;
    var api;

    function getLatestVersion(callback) {
        api.request({
            path: '/live/get/latest',
            method: 'GET'
        }, {}, callback);
    }

    return {

        init: function() {
            api = _api(app, this);
        },

        play: function() {
            if (!localVersion) {
                app.updateClient('Error running...', false, 'Retry', false, 'Error finding client version. Please restart or retry download.');
                return;
            }
            getLatestVersion((response) => {
                if (response.error) {
                    app.updateClient('Error getting latest', false, 'Retry', false, 'Error getting latest version from API. Please try again.');
                    return;
                }
                latestVersion = response.version;
                console.log(localVersion + ' ' + latestVersion);
                if (localVersion != latestVersion) {
                    app.updateClient('OOD', false, 'Update', false, 'Client is no longer up to date. Please update and try again.');
                    return;
                }
                app.getWindow().minimize();
                var p = path.join(app.getStore().get('clientPath'), '/client/client_v' + localVersion + '.jar');
                var child = spawn(p, {
                    shell: true
                });

                child.stdout.setEncoding('utf8');
                child.stdout.on('data', console.log);
            });
        },

        updateProperties: (version, clientPath) => {
            var data = {
                version: version.toString(),
                path: clientPath,
                dateDownloaded: new Date().getTime()
            };
            var p = path.join(app.getStore().get('clientPath'), '/client/props.json');
            fs.writeFile(p, JSON.stringify(data), (error) => {
                if (error)
                    console.log('Error updating properties file: ' + error);
            });
        },

        update: function() {
            getLatestVersion((response) => {
                if (response.error) {
                    app.updateClient('Error getting latest', false, 'Retry', false, 'Error getting latest version from API. Please try again.');
                    return;
                }
                localVersion = response.version;
                var version = response.version;
                var path = '/live/download/' + version;
                app.updateClient(null, true, 'Downloading...', false, `Starting download for v${version} from ${path}`);
                api.downloadClient(version, path);
            });
        },

        checkForLocal: function() {

            function respond(data) {
                app.sendMessage('client:check', data);
            }

            var p = path.join(app.getStore().get('clientPath'), '/client/props.json');
            var r = path.resolve(app.getStore().get('clientPath'), '/client/');
            if (!fs.existsSync(p)) {
                respond({
                    found: false,
                });
                return;
            }
            fs.readFile(p, {
                encoding: 'utf-8'
            }, (err, data) => {
                if (err) {
                    respond({
                        found: false,
                        err
                    });
                    return;
                }
                var json = JSON.parse(data);
                localVersion = json.version;
                getLatestVersion((response) => {
                    if (response.error) {
                        app.updateClient('Error getting latest', false, 'Retry', false, 'Error getting latest version from API. Please try again.');
                        return;
                    }
                    respond({
                        found: true,
                        version: json.version,
                        latest: response.version,
                        location: r
                    });
                });
            });
        }

    };

};
module.exports = _client;