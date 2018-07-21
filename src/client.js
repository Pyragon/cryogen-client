const path = require('path');
const fs = require('fs');
const _api = require(__dirname+'/api.js');
var spawn = require('child_process').spawn;

var _client = function(cryogen) {

  var latestVersion;
  var localVersion;
  var api;

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

  function getLatestVersion(callback) {
    api.request({
      path: '/live/get/latest',
      method: 'GET'
    }, {}, callback);
  }

  return {

    init: function() {
      api = _api(cryogen);
    },

    play: function() {
      if(!localVersion) {
        cryogen.updateClient('Error running...', false, 'Retry', false, 'Error finding client version. Please restart or retry download.');
        return;
      }
      getLatestVersion((response) => {
        if(response.error) {
          cryogen.updateClient('Error getting latest', false, 'Retry', false, 'Error getting latest version from API. Please try again.');
          return;
        }
        latestVersion = response.version;
        if(localVersion != latestVersion) {
          cryogen.updateClient('OOD', false, 'Update', false, 'Client is no longer up to date. Please update and try again.');
          return;
        }
        cryogen.getWindow().minimize();
        var f = require.resolve('../client/client_v'+localVersion+'.jar');
        var child = spawn(f, {shell:true});

        child.stdout.setEncoding('utf8');
        child.stdout.on('data', console.log);
      });
    },

    update: function() {
      getLatestVersion((response) => {
        if(response.error) {
          cryogen.updateClient('Error getting latest', false, 'Retry', false, 'Error getting latest version from API. Please try again.');
          return;
        }
        latestVersion = response.version;
        var version = response.version;
        var path = response.path;
        cryogen.updateProgress(0.1);
        cryogen.updateClient(null, true, 'Downloading...', false, `Starting download for v${version} from ${path}`);
        api.downloadClient(version, path);
      });
    },

    checkForLocal: function() {

      function respond(data) {
        console.log(`Repond data: ${respond}`);
        cryogen.sendMessage('client:check', data);
      }

      var p = path.join(__dirname, '../client/props.json');
      var r = path.resolve(__dirname, '../client/');
      if(!fs.existsSync(p)) {
        respond({ found: false, err: 'File does not exist' });
        return;
      }
      fs.readFile(p, { encoding: 'utf-8' }, (err, data) => {
        if(err) {
          respond({ found: false, err });
          return;
        }
        var json = JSON.parse(data);
        localVersion = json.version;
        getLatestVersion((response) => {
          if(response.error) {
            cryogen.updateClient('Error getting latest', false, 'Retry', false, 'Error getting latest version from API. Please try again.');
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
