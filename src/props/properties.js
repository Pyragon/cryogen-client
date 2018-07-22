const fs = require('fs');
const app = require('electron').app;

var _properties = function() {

  var config;

  return {

    saveProperties: () => {
      var p = app.getPath('userData') + '/props.json';
      if (!fs.existsSync(app.getPath('userData')))
        fs.mkdirSync(app.getPath('userData'));
      fs.writeFile(p, '{}', (error) => {
        if (error)
          console.log(error);
        //TODO - popup error.
      });
    },

    loadProperties: () => {
      var defaults = require(__dirname + "/defaults.js");
      try {
        if (!fs.existsSync(app.getPath('userData')))
          throw 'no config folder created';
        var p = app.getPath('userData') + '/props.json';
        fs.readFile(p, (error, data) => {
          if (error) {
            config = defaults;
            this.saveProperties();
            return;
          }
          config = Object.assign(defaults, JSON.parse(data));
        });
      } catch (error) {
        console.log(error);
        config = defaults;
        this.saveProperties();
        //TODO - popup error stating defaults being set
      }
    },

    getConfig: () => {
      return config;
    }

  };

};
module.exports = _properties;