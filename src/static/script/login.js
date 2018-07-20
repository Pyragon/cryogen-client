$(document).ready(() => {

  setSize(300, 315);

  //Focus on username input by default
  $('#username').focus();
  ipcRenderer.send('git:last-commit');

  ipcRenderer.on('git:last-commit', (event, data) => {
    $('#last-commit').text(data.commit);
  });

  //Check if we have cookie saved for remember-me username
  session.defaultSession.cookies.get({
    url: 'http://localhost',
    name: 'login-name'
  }, (error, cookies) => {
    if(!error && cookies.length > 0) {
      var cookie = cookies[0];
      //Set username to value of cookie
      $('#username').val(cookie.value);
      //Focus password input as we now have a username
      $('#password').focus();
      //Set remember_me checked
      $('#remember-check').prop('checked', true);
    }
  });

  //Register forgotten-password button
  $(document).on('click', '#forgot-pass', forgotPassword);
  //Register continue-as-guest button
  $(document).on('click', '#cont-guest', switchToMainUI);
  //Register login button
  $(document).on('click', '#login-button', login);
  //Register keypress for username and password inputs
  $(document).on('keypress', '#username, #password', (e) => {
    var value = $(e.target).val();
    var id = $(e.target).attr('id');
    //13=Enter
    if(e.which == 13) {
      //If we're focused on username input, focus on password input
      if(id === 'username') $('#password').focus();
      else {
        //If both username and password have values, login. Otherwise, focus on username
        if(value === '' || $('#username').val() === '') $('#username').focus();
        else login();
      }
    }
  });

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
    var username = $('#username').val();
    var password = $('#password').val();
    var remember = $('#remember-check').prop('checked');
    requestAuthToken(username, password, (error, token) => {
      if(error) {
        if(error === 'connect ECONNREFUSED 127.0.0.1:5555')
          error = 'Error connecting to server.';
        setError(error);
        return;
      }
      auth_token = token;
      if(remember)
        saveCookie('login-name', username, (err) => {
          if(err) console.log('Error saving remember_me cookie.');
        });
      else
        removeCookie('login-name', () => {

        });
      ipcRenderer.send('login:set-token', token);
      getUserData((error, data) => {
        if(error) {
          console.log('Error loading user data: '+error);
          return;
        }
        plugin.user = data;
        switchToMainUI();
      });
    });
  }

});
