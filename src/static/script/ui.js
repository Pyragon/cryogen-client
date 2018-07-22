const _main = require(__dirname + '/script/main.js');
const ProgressBar = require('progressbar.js');
var dateFormat = require('dateformat');

const electron = require('electron');
const renderer = electron.ipcRenderer;

var ui = function() {

  var bar;
  var main;

  var user;

  function registerNotifications() {
    renderer.on('git:last-commit', (event, data) => $('#last-commit').text(data.commit));
    renderer.on('client:check', (event, data) => readClientCheck(data));
    renderer.on('client:progress', (event, data) => setProgress(data.progress, true));
    renderer.on('client:set-version', (event, data) => setVersion(data));
  }

  function getUserData(callback) {
    if (!main.getAuthToken()) {
      callback(false);
      return;
    }
    main.request({
      path: '/users/me',
      method: 'GET'
    }, {}, callback);
  }

  function setVersion(data) {
    if (data.version)
      editClientVersion(data.version);
    editClientButton(data.disableBtn, data.btnText);
    if (!data.disableBtn)
      setButtonFunc(data.play ? 'play' : 'update');
    setAction(data.action);
  }

  function checkForClient() {
    renderer.send('client:check');
    setAction('Checking for client...');
    console.log('client');
    setProgress(0.1);
  }

  function setProgress(progress, fromMain = false) {
    bar.animate(progress);
    if (!fromMain)
      renderer.send('bar:animate', {
        progress
      });
  }

  function loadBar() {
    bar = new ProgressBar.Line('#container', {
      strokeWidth: 4,
      easing: 'easeInOut',
      duration: 1400,
      color: '#FFEA82',
      trailColor: '#eee',
      trailWidth: 1,
      svgStyle: {
        width: '100%',
        height: '100%',
        'border-radius': '5px'
      }
    });
  }

  function readClientCheck(data) {
    if (!data.found) {
      if (data.err) {
        console.log(data.err);
        editClientVersion('Error loading client');
        editClientButton(false, 'Download', data.err);
        setAction('Ready to Download!');
        setButtonFunc('update');
        setProgress(0);
        return;
      }
      editClientVersion('No client detected');
      editClientButton(false, 'Download');
      setAction('Ready to Download!');
      setButtonFunc('update');
      setProgress(1);
      return;
    }
    var version = data.version;
    var latest = data.latest;
    var location = data.location;
    var str = 'V: ' + version;
    if (version != latest) {
      str += ' - OOD';
      editClientButton(false, 'Update', 'Client found at: ' + location);
      setAction('Ready to Update!');
      setButtonFunc('update');
      console.log('ood');
      setProgress(0);
    } else {
      editClientButton(false, 'Play', 'Client found at: ' + location);
      setAction('Ready to Play!');
      setButtonFunc('play');
      setProgress(1);
    }
    editClientVersion(str, version, latest);
  }

  function btnClick() {
    if (btnAction == null || btnAction == 'update')
      updateClient();
    else
      playClient();
  }

  function playClient() {
    renderer.send('client:play');
    setAction('Starting client...');
  }

  function updateClient() {
    renderer.send('client:update');
    setAction('Updating client...');
  }

  function setAction(action) {
    $('#action').html(`Action: ${action}`);
  }

  function setButtonFunc(action) {
    btnAction = action;
  }

  function editClientVersion(version, current, latest) {
    $('#client-version').text(version);
  }

  function editClientButton(disabled, title, location = null) {
    var element = $('#client-btn');
    element.text(title);
    element.prop('disabled', disabled);
    if (location == null) {
      element.removeAttr('title');
    } else {
      element.prop('title', location);
    }
  }

  return {

    start: function() {
      var ui = this;
      loadBar();
      registerNotifications();
      checkForClient();
      renderer.send('git:last-commit');
      getUserData((response) => {
        if (response) {
          if (response.error) {
            console.error(response.error);
            return;
          }
          ui.user = response.account;
        }
        main.setTitle('Cryogen UI - Logged in as ' + (user == null ? 'Guest' : user.display_name));
        $('#user-lett').html(user == null ? 'G' : user.display_name.charAt(0));
        $('#client-btn').click(btnClick);
      });
    },

    init: function() {
      main = _main(this);
      main.init();
      main.setSize(750, 450);
      $(this.start);
    }

  };

}();
ui.init();