const ProgressBar = require('progressbar.js');
var dateFormat = require('dateformat');

const electron = require('electron');
const renderer = electron.ipcRenderer;
const _widgets = require(__dirname + '/widgets.js');
const _telemetry = require(__dirname + '/telemetry/telemetry.js');

var _ui = function() {

  var bar;
  var widgets;
  var telemetry;

  var started;

  function registerNotifications(user) {
    renderer.on('log', (event, data) => console.log(data.message));
    renderer.on('client:check', (event, data) => readClientCheck(data));
    renderer.on('client:progress', (event, data) => setProgress(data.progress, true));
    renderer.on('client:set-version', (event, data) => setVersion(data));
    if (!user) return;
    telemetry.subscribeToEvents([{
      name: 'private_message_received'
    }, {
      name: 'logged_in'
    }, {
      name: 'logged_out'
    }]);
  }

  function buildContextMenu(user) {
    var items = [{
      name: 'Settings',
      icon: 'fa fa-cogs',
      callback: () => {
        modals.viewModal('log_out_conf', 'Log out');
      }
    }];
    if (user) {
      items.push({
        name: 'Account Settings',
        icon: 'fa fa-user-cog'
      });
      items.push({
        name: 'Log Out',
        icon: 'fa fa-user-times'
      });
    } else {
      items.push({
        name: 'Log In',
        icon: 'fa fa-user-plus'
      });
    }
    context.addMenuItems({
      selector: '#user-area',
      items
    });
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
      loadBar();
      registerGithub();
      widgets = _widgets();
      widgets.init();
      started = true;
      getUserData((data) => {
        registerNotifications(data);
        buildContextMenu(data);
        checkForClient();
        setTitle('Cryogen UI - Logged in as ' + (data == null ? 'Guest' : data.display_name));
        $('#user-lett').html(data == null ? 'G' : data.display_name.charAt(0));
        $('#client-btn').click(btnClick);
      });
    },

    init: function() {
      setSize(750, 450);
      $('#main-content').html('');
      $('#main-content').load('ui.pug', () => ui.start());
      telemetry = _telemetry();
      telemetry.init();
    },

    destroyUI: () => {
      //destroy persisting objects like telemetry's server.
      telemetry.destroy();
    },

    getWidgets: () => {
      return widgets;
    },

    getTelemetry: () => {
      return telemetry;
    },

    hasStarted: () => {
      return started;
    }

  };

};
module.exports = _ui;