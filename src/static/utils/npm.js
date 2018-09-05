const exec = require('child_process').exec;

module.exports = {
    checkPackage: function(pack, callback) {
        if (!pack) {
            callback('No package specified.');
            return;
        }
        request({
            hostname: 'npmsearch.com',
            port: 80,
            path: '/query',
            method: 'POST'
        }, {
            q: pack
        }, (response) => {
            if (response.error) {
                callback(response.error);
                return;
            }
            callback(null, response);
        });
    },

    checkNPM: function(callback) {
        exec('npm -v', (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            callback(!stdout.includes('recognized'));
        });
    }
};