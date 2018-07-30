const dateFormat = require('dateformat');

var _logged = () => {

  return {

    receive: (data) => {
      console.log('logged in');
      sendNotification('Logged In Event', 'You have logged in @ ' + dateFormat(new Date(), 'h:MM:ss TT'));
    }

  };

};
module.exports = _logged;