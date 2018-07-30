var _main = require(__dirname+'/script/main.js');
const electron = require('electron');
const remote = electron.remote;
const renderer = electron.ipcRenderer;
const shell = electron.shell;

var _login = function() {

  var main;

  var username;
  var password;
  var remember_check;

  function keyPressed(e) {
    var value = $(e.target).val();
    var id = $(e.target).attr('id');
    //13=Enter
    if (e.which == 13) {
      //If we're focused on username input, focus on password input
      if (id === 'username') password.focus();
      else {
        //If both username and password have values, login. Otherwise, focus on username
        if (value === '' || username.val() === '') username.focus();
        else login();
      }
    }
  }

  //Shake window and set error text
  function setError(error) {
    $('#wrapper').effect('shake');
    $('#login-error').css('display', 'block');
    $('#login-error').text(error);
  }

  //Redirect to website's recovery page
  function forgotPassword() {
    var username = $('#username').val();
    var url = 'http://cryogen.live/recover';
    if(username)
      url += '?username='+username;
    shell.openExternal(url);
  }

  //Request Authentication token from Cryogen API
  function login() {
    var remember = remember_check.prop('checked');
    main.request({
      path: '/login',
      method: 'POST'
    }, {
      username: username.val(),
      password: password.val(),
      revoke: true
    }, (response) => {
      if(response.error) {
        if(error.includes('ECONNREFUSED'))
          response.error = 'Error connecting to server.';
        setError(response.error);
        return;
      }
      main.setAuthToken(response.token);
      if(remember) main.saveCookie('login-name', username);
      else main.removeCookie('login-name');
      main.switchToMainUI();
    });
  }

  return {

    start: function() {
      main.setSize(300, 315);
      renderer.send('git:last-commit');
      renderer.on('git:last-commit', (event, data) => $('#last-commit').text(data.commit));

      main.getCookie('login-name', (error, value) => {
        if(error) return;
        username.val(value);
        password.focus();
        remember_check.prop('checked', true);
      });
      $('#forgot-pass').click(forgotPassword);
      $('#cont-guest').click(main.switchToMainUI);
      $('#login-button').click(login);

      username.keydown(keyPressed);
      password.keydown(keyPressed);

    },

    init: function() {
      main = _main(this);
      main.init();
      main.setTitle('Login to Cryogen');
      var login = this;
      $(document).ready(() => {
        username = $('#username');
        password = $('#password');
        remember_check = $('#remember-check');
        login.start();
      });
    },

  };

}();

_login.init();
