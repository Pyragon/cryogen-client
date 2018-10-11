const exec = require('child_process').exec;

module.exports = {
    checkPackage: function(pack, callback) {
        // var result = {
        //     results: [{
        //         name: [
        //             "cclient-plugin-telemetry-events"
        //         ],
        //         version: [
        //             "1.0.0"
        //         ]
        //     }]
        // };
        // callback(null, result);
        // return;
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
            q: pack,
            fields: 'name,version,author'
        }, (response) => {
            if (response.error) {
                callback(response.error);
                return;
            }
            callback(null, response);
        });
    },

    checkGIT: function(callback) {
        exec('git --version', (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            callback(!stdout.includes('recognized'));
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