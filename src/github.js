const octo = require('octonode');
var client = octo.client();
var repo = client.repo('Pyragon/cryogen-client');

var _github = function(cryogen) {

  var last_update;
  var last_update_time;
  var loading;

  return {

    respond: function(key, data) {
      if(key == 'last-commit') {
        this.getLastUpdate((update) => {
          cryogen.sendMessage('git:last-commit', { commit: update });
        });
      }
    },

    getLastUpdate: function(callback) {
      var now = new Date().getTime();
      if(loading || last_update_time > now) {
        callback(last_update);
        return;
      }
      loading = true;
      repo.commits((error, body, headers) => {
        last_update_time = now + 10000;
        var hash = '';
        if(error) {
          console.log('Error getting latest commit: '+error);
          last_update = 'Error connecting to Github.';
          callback(last_update);
        } else {
          if(body.length > 0) {
            last_update = body[0].commit.message;
          } else {
            last_update = body.commit.message;
          }
          callback(last_update);
        }
      });
    }

  };

};

module.exports = _github;
