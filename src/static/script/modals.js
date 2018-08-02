const fs = require('fs');
const Store = require('electron-store');
const extend = require('util')._extend;
const store = new Store({
  name: 'modal-data'
});

var _modals = () => {

  var openModal;
  var modalName;

  var defaults = {
    width: 200,
    height: 200,
    draggable: true,
    saveDragPosition: true
  };

  var pos1 = 0,
    pos2 = 0,
    dragX, dragY;

  function startDrag(e) {
    dragX = e.clientX;
    dragY = e.clientY;
    $(document).mouseup(stopDrag);
    $('#blank-page').mousemove(drag);
    $('#modal').mousemove(drag);
    $('#modal').mouseenter(checkDrag);
    return false;
  }

  function drag(e) {
    pos1 = dragX - e.clientX;
    pos2 = dragY - e.clientY;
    dragX = e.clientX;
    dragY = e.clientY;
    var elm = $('#modal');
    var offset = elm.offset();
    var top = offset.top - pos2;
    var left = offset.left - pos1;
    if (top < 24) top = 24;
    if (top > 450 - elm.height()) top = 450 - elm.height();
    if (left < 0) left = 0;
    if (left > 750 - elm.width()) left = 750 - elm.width();
    elm.css('top', top + 'px');
    elm.css('left', left + 'px');
    return false;
  }

  function stopDrag(e) {
    var elm = $('#modal-bar');
    $('#blank-page').off('mousemove');
    $(document).off('mouseup');
    $('#blank-page').off('mouseenter');
    $('#modal').off('mousemove');
    $('#modal').off('mouseenter');
    var options = $('#modal').data('options');
    if (options.saveDragPosition) {
      var position = $('#modal').position();
      store.set(modalName + '.top', position.top);
      store.set(modalName + '.left', position.left);
    }
    return false;
  }

  function viewModal(options, eventCallback, callback) {
    if (openModal) {
      destroyModal(() => viewModal(options, eventCallback, callback));
      return;
    }
    var extended = extend(defaults, options);
    modalName = extended.name;
    if (!ui.hasStarted()) {
      console.error('Cannot show modal before UI has been loaded.');
      return;
    }
    var location = path.join(__dirname, '../modals/' + extended.name + '.pug');
    if (!fs.existsSync(location)) {
      console.error('Unable to find modal with that name.');
      return;
    }
    var modal = $('<div></div>');
    modal.prop('id', 'modal');
    modal.data('options', extended);

    var modalBar = $('<div></div>');
    modalBar.prop('id', 'modal-bar');

    if (extended.draggable) modalBar.mousedown(startDrag);

    var modalTitle = $('<span></span>');
    modalTitle.prop('id', 'modal-title');
    if (extended.title) modalTitle.html(extended.title);

    var exitButton = $('<div></div>');
    exitButton.prop('id', 'modal-exit-button');
    exitButton.click(destroyModal);

    modalBar.append(modalTitle);
    modalBar.append(exitButton);

    var container = $('<div></div>');

    container.css({
      height: extended.height + 'px',
      width: extended.width + 'px'
    });

    modal.append(modalBar);
    modal.append(container);
    container.load(location, () => {
      $('#main-content').css({
        opacity: 0.1
      });
      $('#wrapper').append(modal);
      $('#wrapper').append($('<div id="blank-page"></div>'));
      var left = 0;
      var top = 0;
      var pos = null;
      if ((pos = store.get(modalName)) != null)
        modal.css({
          left: pos.left + 'px',
          top: pos.top + 'px'
        });
      else if (extended.position)
        modal.css({
          left: extended.position.left + 'px',
          top: extended.position.top + 'px'
        });
      else modal.css({
        left: (750 - modal.width()) / 2 + 'px',
        top: (450 - modal.height()) / 2 + 'px'
      });
    });

    openModal = modal;

  }

  function destroyModal(callback) {
    $('#main-content').css('opacity', 1);
    $('#blank-page').remove();
    openModal.remove();
    openModal = null;
    modalName = null;
  }

  return {

    viewModal: viewModal,
    destroyModal: destroyModal,

    init: () => {

      $(document).on('mousedown.mod', '#blank-page', () => {
        if (!openModal) return;
        destroyModal();
      });

    }

  };

};
module.exports = _modals;