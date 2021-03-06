const electron = require('electron');
const path = require('path');
const remote = electron.remote;
const renderer = electron.ipcRenderer;
const shell = electron.shell;
const session = remote.session;
const app = remote.app;
var extend = require('util')._extend;
const http = require('http');
const pug = require('pug');
const fs = require('fs');
const querystring = require('querystring');
const Store = require('electron-store');
const rimraf = require('rimraf');
var defaults = require(__dirname + '/../defaults.js')(app);
require(__dirname + '/utils/utils.js');
const store = new Store({
    defaults
});

var _login = require(__dirname + '/script/login.js');
var _ui = require(__dirname + '/script/ui.js');
var _context = require(__dirname + '/script/context-menu.js');
var _modals = require(__dirname + '/script/modals.js');
const headerOptions = {
    hostname: 'api.cryogen.live',
    headers: {

    }
};

var login;
var ui;
var context;
var modals;
var userData;

var authToken;
var authExpiry;

var lastDataCheck;
var lastHash;

$(document).ready(() => start());

function registerGithub(callback) {
    renderer.send('git:last-commit');
    renderer.on('git:last-commit', (event, data) => {
        if (data.error) {
            $('#last-commit').text(data.commit);
            lastHash = null;
            return;
        }
        $('#last-commit').text(`${data.hash} - ${data.commit}`);
        lastHash = data.hash;
        if (callback) callback();
    });
    $('#last-commit').click(() => {
        if (!lastHash) {
            console.log('Unable to connect to github.');
            return;
        }
        shell.openExternal('https://github.com/Pyragon/cryogen-client/commit/' + lastHash);
    });
}

function calculateWidth(text) {
    return (text.length * 14) + (text.length * 2);
}

function start() {
    $('#minimize-button').click(() => remote.getCurrentWindow().minimize());
    $('#exit-button').click(() => app.quit());
    renderer.on('log', (event, data) => console.log(data.message));
    login = _login();
    context = _context();
    modals = _modals();
    ui = _ui();
    context.init();

    if (!store.get('autoLogin')) login.init();
    else {
        requestAuthToken((error, token) => {
            if (error) {
                startLoginWithError(error);
                return;
            }
            switchToMainUI();
        });
    }
}

function requestAuthToken(callback) {
    var username = store.get('username');
    var password = store.get('password');
    if (!username || !password) {
        if (callback) callback('Error loading username or password');
        return;
    }
    request({
        path: '/login',
        method: 'POST'
    }, {
        username,
        password,
        expiry: store.get('tokenExpiry'),
        revoke: true
    }, (response) => {
        if (response.error) {
            if (response.error.includes('ECONNREFUSED'))
                response.error = 'Error connecting to server.';
            if (callback) callback(response.error);
            return;
        }
        setAuthToken(response.token, response.expiry);
        if (callback) callback(null, response.token);
    });
}

function startLoginWithError(error) {
    console.error(error);
    login.init(() => {
        login.setError(error);
    });
}

function setSize(width, height) {
    remote.getCurrentWindow().setSize(width, height);
    $('#wrapper').css({
        'height': `${height}px`,
        'width': `${width}px`
    });
    $('#main-content').css({
        'height': `${height}px`,
        'width': `${width}px`
    });
}

function setTitle(title) {
    $('#title').html(title);
    remote.getCurrentWindow().setTitle(title);
}

function sendNotificationWithOptions(options, callback) {
    var defaults = {
        icon: 'http://cryogen.live/images/icon.png'
    };
    var extended = extend(defaults, options);
    let noty = new Notification(options.title, {
        body: options.body,
        icon: options.icon
    });
    if (callback)
        noty.onclick = callback;
}

function sendNotification(title, body, callback) {
    let noty = new Notification(title, {
        body,
        icon: 'http://cryogen.live/images/icon.png'
    });
    if (callback)
        noty.onclick = callback;
}

function setAuthToken(token, expiry) {
    authToken = token;
    authExpiry = expiry;
}

function request(options, data, callback, tokenRefresh = false) {
    if (data && authToken) data.token = authToken;
    if (data) options.path = options.path + '?' + querystring.stringify(data);
    var defCopy = JSON.parse(JSON.stringify(headerOptions));
    var extended = extend(defCopy, options);
    var req = http.request(extended, (res) => {
        if (res.statusCode == 523) {
            console.error('Unable to connect to website.');
            callback({
                success: false,
                error: 'Unable to connect to website.'
            });
            return;
        }
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
                console.log('Error occurred in JSON1: ' + dataChunk);
                console.log('Path taken: ' + options.path);
                console.log('Error: ' + e);
                if (callback) callback(e);
                return;
            }
            try {
                if (data.error && data.error.includes('expired') && config.get('autoLogin') && !tokenRefresh) {
                    requestAuthToken((error, token) => {
                        if (error) {
                            if (callback) callback(data);
                            return;
                        }
                        request(options, data, callback, true);
                    });
                }
                if (callback) callback(data);
            } catch (e) {
                console.log('Error occurred in JSON2: ' + dataChunk);
                console.log('Error occured in callback: ' + callback);
                console.log('Path taken: ' + options.path);
                console.log('Error: ' + e);
                if (callback) callback(e);
            }
        });
    });
    req.on('error', (e) => {
        if (callback) callback({
            success: true,
            error: e.message
        });
    });
    req.write(querystring.stringify(data ? data : {}));
    req.end();
}

function getCookie(name, callback) {
    session.defaultSession.cookies.get({
        url: 'http://localhost',
        name
    }, (error, cookies) => {
        if (error) {
            callback(error);
            return;
        }
        if (!cookies.length) {
            callback("No cookie found.");
            return;
        }
        var cookie = cookies[0].value;
        callback(error, cookie);
    });
}

function saveCookie(key, value) {
    var date = new Date();
    date.setHours(date.getHours() + 23);
    session.defaultSession.cookies.set({
        url: 'http://localhost',
        name: key,
        value,
        session: true,
        expirationDate: date.getTime()
    }, (error) => {
        if (error) console.error(error);
    });
}

function getUserData(callback) {
    if (!authToken) {
        callback(null);
        return;
    }
    var now = new Date().getTime();
    if (userData && lastDataCheck < now) {
        callback(userData);
        return;
    }
    request({
        path: '/users/me',
        method: 'GET'
    }, {}, (response) => {
        if (response.error) {
            console.error(response.error);
            callback(null);
            return;
        }
        userData = response;
        lastDataCheck = now + 30000;
        callback(userData);
    });
}

function switchToLogin() {
    setAuthToken(null, 0);
    userData = undefined;
    lastDataCheck = 0;

    ui.destroy();
    login.init();
}

function switchToMainUI() {
    ui.init();
}

function bgTables() {
    $('.table-container').each(function(i, obj) {
        var header = $(this).find('.table-header');
        var back = $(this).find('.table-back');
        var size = $(this).find('.table').height();
        size -= 18;
        back.css({
            'margin-top': -size + 'px',
            'z-index': '-1',
            height: size + 'px',
            width: header.width() + 'px',
            'margin-left': '5px'
        });
    });
}