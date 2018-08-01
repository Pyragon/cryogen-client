const dateFormat = require('dateformat');

const windows = require('node-process-windows');

var _logged = () => {

  return {

    receive: (data) => {
      sendNotification('Logged Out Event', 'You have logged out @ ' + dateFormat(new Date(), 'h:MM:ss TT'), () => {
        if (!store.get('focusOnLogout')) return;
        if (data && data.pid) {
          windows.getProcesses((error, processes) => {
            if (error) {
              console.error(error);
              return;
            }
            var clients = processes.filter(p => p.pid == data.pid);
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