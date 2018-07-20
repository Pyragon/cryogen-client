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

var btnAction = null;

$(document).ready(() => {

  setTitle('Cryogen UI - Logged in as '+(user == null ? 'Guest' : user.display_name));

  $('#user-lett').html(user == null ? 'G' : user.display_name.charAt(0));

  $('#client-btn').click(btnClick);

  setSize(750, 450);
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
      setButtonFunc(data.play ? 'play' : 'update');
    setAction(data.action);
  });

  ipcRenderer.on('client:check', (event, data) => {
    bar.animate(1.0);
    if(!data.found) {
      if(data.err) {
        editClientVersion('Error loading client');
        editClientButton(false, 'Download', data.err);
        setAction('Ready to Download!');
        setButtonFunc('update');
        return;
      }
      editClientVersion('No client detected');
      editClientButton(false, 'Download');
      setAction('Ready to Download!');
      setButtonFunc('play');
      return;
    }
    var version = data.version;
    var latest = data.latest;
    var location = data.location;
    var str = 'V: '+version;
    if(version != latest) {
      str += ' - OOD';
      editClientButton(false, 'Update', 'Client found at: '+location);
      setAction('Ready to Update!');
      setButtonFunc('update');
    } else {
      editClientButton(false, 'Play', 'Client found at: '+location);
      setAction('Ready to Play!');
      setButtonFunc('play');
    }
    editClientVersion(str, version, latest);
  });


  function checkForClient() {
    ipcRenderer.send('client:check');
    editClientButton(true, 'Checking...');
    setAction('Looking for client...');
    bar.animate(0.2);
  }

  function btnClick() {
    if(btnAction == null || btnAction == 'update')
      updateClient();
    else
      playClient();
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

  function setButtonFunc(action) {
    btnAction = action;
  }

  function editClientVersion(version, current, latest) {
    $('#client-version').text(version);
    if(current != latest) {

    }
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
