const path = require('path');
const _express = require('express');
const electron = require('electron');
const Tray = electron.Tray;

var trayManager = this;

var _tray = function() {

  var tray;

  return {

    init: () => {
      tray = new Tray(path.join(__dirname, '../static/images/favicon.ico'));
      tray.on('click', () => {

      });
    },

    destroy: () => {
      tray.destroy();
    }

  };

};

module.exports = _tray;