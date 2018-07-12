$(document).ready(() => {

  console.log(user);

  setTitle('Cryogen UI - Logged in as '+(user == null ? 'Guest' : user.display_name));

  ipcRenderer.send('git:last-commit');

  ipcRenderer.on('git:last-commit', (event, data) => {
    $('#last-commit').text(data.commit);
  });

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

  $('#wrapper').css({
    'width': '750px',
    'height': '450px'
  });

});
