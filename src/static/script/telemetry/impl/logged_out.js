const dateFormat = require('dateformat');

const windows = require('node-process-windows');

var _logged = () => {

  return {

    receive: (data) => {
      sendNotification('Logged Out Event', 'You have logged out @ ' + dateFormat(new Date(), 'h:MM:ss TT'), () => {
        if (data && data.pid) {
          windows.getProcess((error, processes) => {
            if (error) {
              console.error(error);
              return;
            }
            processes.forEach(console.log);
            var clients = processes.filter(p => {
              console.log(p.pid);
              return p.pid == data.pid;
            });
            if (clients.length > 0)
              windows.focusWindow(clients[0]);
          });
        } else {
          console.log('Error parsing: ' + data);
        }
      });
    }

  };

};
module.exports = _logged;