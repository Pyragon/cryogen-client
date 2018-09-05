const pug = require('pug');
var extend = require('util')._extend;

const defaults = {
    onConfirm: function() {

    },
    onClose: function() {

    },
    ask: false,
    question: '',

};

module.exports = {

    loadFile: function(path, options) {
        var extended = extend(defaults, options);
        return pug.renderFile(path, extended);
    }

};