const octo = require('octonode');
const shell = require('electron').shell;
var client = octo.client();
var repo = client.repo('Pyragon/cryogen-client');

var _github = function(cryogen) {

  var last_update;
  var last_hash;
  var last_update_time;
  var loading;

  var error;

  return {

    respond: function(key, data) {
      if (key == 'last-commit') {
        this.getLastUpdate((error, commit, hash) => {
          cryogen.sendMessage('git:last-commit', {
            error,
            commit,
            hash
          });
        });
      }
    },

    getLastUpdate: function(callback) {
      var now = new Date().getTime();
      if (loading || last_update_time > now) {
        callback(error, last_update, last_hash);
        return;
      }
      loading = true;
      repo.commits((err, body, headers) => {
        last_update_time = now + 10000;
        var hash = '';
        if (err) {
          console.log('Error getting latest commit: ' + err);
          error = err;
          last_update = 'Error connecting to Github.';
          callback(error, last_update, last_hash);
        } else {
          error = null;
          var data = body.length > 0 ? body[0] : body;
          last_hash = data.sha.substring(0, 7);
          last_update = data.commit.message;
          callback(null, last_update, last_hash);
        }
      });
    }

  };

};

module.exports = _github;
