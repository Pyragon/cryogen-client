const path = require('path');
const fs = require('fs');
const progress = require('request-progress');
const _request = require('request');
const http = require('http');
const querystring = require('querystring');
const extend = require('util')._extend;
const pretty = require('prettysize');
const app = require('electron').app;

var _api = function(cryogen, client) {

  const headerOptions = {
    hostname: 'localhost',
    port: 5555,
    headers: {

    }
  };

  var auth_token;

  return {

    setAuthToken: function(token) {
      auth_token = token;
    },

    getAuthToken: () => {
      return auth_token;
    },

    downloadClient: function(version, clientPath) {
      var p = path.join(app.getPath('userData'), '/client/client_v' + version + '.jar');
      var d = path.join(app.getPath('userData'), '/client/');
      if (!fs.existsSync(d))
        fs.mkdirSync(d);
      var file = fs.createWriteStream(p);
      var location = 'http://localhost:5555/live/download/' + version;
      var test = 'http://ipv4.download.thinkbroadband.com/100MB.zip';
      progress(_request(location), {

        })
        .on('progress', (state) => {
          if (state.percent)
            cryogen.updateProgress(state.percent);
          cryogen.updateClient(`ETA: ${secondsToTime(state.time.remaining)}`, true, 'Downloading...', false, `Downloading v${version} from ${clientPath} at ${pretty(state.speed)}/s - ${parseInt(state.percent * 100)}%`);
        }).on('error', (err) => {
          console.log(err);
          fs.unlink(p);
          cryogen.updateClient('Error downloading...', false, 'Retry', false, 'Error downloading latest client. Please try again later.');
        }).on('end', () => {
          cryogen.updateClient('v' + version, false, 'Play', true, `Finished downloading v${version} from ${clientPath}.`);
          client.updateProperties(version, clientPath);
        }).pipe(file);
    },

    //Request from Cryogen API
    //Options: path, method, headers
    //path=/endpoint...
    //method=GET/POST
    //headers: Headers used for authentication via token
    //Data: Query parameters to send to endpoint
    //Callback: Function gets called when request finished with either data or error
    request: function(options, data, callback) {
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
            console.log('Error occurred in JSON: ' + dataChunk);
            console.log('Path taken: ' + options.path);
            callback(e);
            return;
          }
          try {
            callback(data);
          } catch (e) {
            console.log('Error occured in callback: ' + callback);
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
  };

  function secondsToTime(time) {
    var sec_num = parseInt(time, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
      hours = "0" + hours;
    }
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
  }

};

module.exports = _api;