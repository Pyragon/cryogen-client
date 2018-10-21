module.exports = function(app) {
    var config = {

        widgets: [{
                name: 'cclient-widget-latest-threads',
                position: 'first',
                config: {},
                active: true,
                default: true
            },
            {
                name: 'cclient-widget-latest-updates',
                position: 'second',
                config: {},
                default: true,
                active: true
            }
        ],
        clientPath: null,
        plugins: [],
        focusOnLogout: true,
        autoLogin: false,
        savePassForAutoLogin: false,
        askForLogout: true,
        launchOnStart: false,
        tokenExpiry: 10800000
    };
    config.clientPath = app.getPath('userData');
    return config;
};