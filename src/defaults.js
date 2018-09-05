module.exports = function(app) {
    var config = {

        widgets: [{
                name: 'cclient-latest-threads',
                position: 'first',
                config: {},
                active: true,
                location: './src/static/script/widgets/defaults/cclient-latest-threads',
            },
            {
                name: 'cclient-latest-updates',
                position: 'second',
                config: {},
                active: true,
                location: './src/static/script/widgets/defaults/cclient-latest-updates'
            }
        ],
        clientPath: null,
        plugins: [],
        focusOnLogout: true,
        autoLogin: false,
        savePassForAutoLogin: false,
        askForLogout: true,
        launchOnStart: false
    };
    config.clientPath = app.getPath('userData');
    return config;
};