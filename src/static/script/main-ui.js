var bar = new ProgressBar.Line('#container', {
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

$(document).ready(() => {

  setTitle('Cryogen UI - Logged in as '+(user == null ? 'Guest' : user.display_name));

  $('#user-lett').html(user == null ? 'G' : user.display_name.charAt(0));

  checkForClient();

  ipcRenderer.send('git:last-commit');

  ipcRenderer.on('git:last-commit', (event, data) => {
    $('#last-commit').text(data.commit);
  });

  ipcRenderer.on('client:progress', (event, data) => {
    bar.animate(data.progress);
  });

  ipcRenderer.on('client:set-version', (event, data) => {
    if(data.version)
      editClientVersion(data.version);
    editClientButton(data.disableBtn, data.btnText);
    if(!data.disableBtn)
      setButtonFunc(data.play ? playClient : updateClient);
    setAction(data.action);
  });

  ipcRenderer.on('client:check', (event, data) => {
    bar.animate(1.0);
    if(!data.found) {
      if(data.err) {
        editClientVersion('Error loading client');
        editClientButton(false, 'Download', data.err);
        setAction('Ready to Download!');
        setButtonFunc(updateClient);
        return;
      }
      editClientVersion('No client detected');
      editClientButton(false, 'Download');
      setAction('Ready to Download!');
      setButtonFunc(updateClient);
      return;
    }
    var version = data.version;
    var latest = data.latest;
    var location = data.location;
    var str = 'V: '+version;
    if(version != latest) {
      str += ' - OOD';
      editClientButton(false, 'Update', location);
      setAction('Ready to Update!');
      setButtonFunc(updateClient);
    } else {
      editClientButton(false, 'Play', location);
      setAction('Ready to Play!');
      setButtonFunc(playClient);
    }
    editClientVersion(str);
  });

  $('#wrapper').css({
    'width': '750px',
    'height': '450px'
  });

  function checkForClient() {
    ipcRenderer.send('client:check');
    editClientButton(true, 'Checking...');
    setAction('Looking for client...');
    bar.animate(0.2);
  }

  function playClient() {
    ipcRenderer.send('client:play');
    setAction('Starting client...');
  }

  function updateClient() {
    ipcRenderer.send('client:update');
    setAction('Updating client...');
  }

  function setAction(action) {
    $('#action').html(`Action: ${action}`);
  }

  function setButtonFunc(func) {
    $('#client-btn').click(func);
  }

  function editClientVersion(version) {
    $('#client-version').text(version);
  }

  function editClientButton(disabled, title, location=null) {
    var element = $('#client-btn');
    element.text(title);
    element.prop('disabled', disabled);
    if(location == null) {
      element.removeAttr('title');
    } else {
      element.prop('title', location);
    }
  }

});
