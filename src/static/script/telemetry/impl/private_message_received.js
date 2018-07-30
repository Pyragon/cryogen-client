var _message = function() {

  return {

    receive: (data) => {
      //TODO - have setting to only send if client is not focused on
      sendNotification('PM Received From: ' + data.author, data.message);
    }

  };

};
module.exports = _message;