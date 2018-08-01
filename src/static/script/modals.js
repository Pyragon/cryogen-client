const fs = require('fs');
const Store = require('electron-store');
const store = new Store({
  name: 'modal-data'
});

var _modals = () => {

  var openModal;
  var modalName;

  var pos1 = 0,
    pos2 = 0,
    dragX, dragY;

  function startDrag(e) {
    dragX = e.clientX;
    dragY = e.clientY;
    $(document).mouseup(stopDrag);
    $('#blank-page').mousemove(drag);
    $('#blank-page').mouseenter(checkDrag);
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
    var position = $('#modal').position();
    store.set(modalName + '.top', position.top);
    store.set(modalName + '.left', position.left);
    return false;
  }

  function viewModal(name, title, eventCallback, callback) {
    if (openModal) {
      destroyModal(() => viewModal(eventCallback, callback));
      return;
    }
    modalName = name;
    if (!ui.hasStarted()) {
      console.error('Cannot show modal before UI has been loaded.');
      return;
    }
    var location = path.join(__dirname, '../modals/' + name + '.pug');
    if (!fs.existsSync(location)) {
      console.error('Unable to find modal with that name.');
      return;
    }
    var modal = $('<div></div>');
    modal.prop('id', 'modal');

    var modalBar = $('<div></div>');
    modalBar.prop('id', 'modal-bar');

    modalBar.mousedown(startDrag);

    var modalTitle = $('<span></span>');
    modalTitle.prop('id', 'modal-title');
    if (title) modalTitle.html(title);

    var exitButton = $('<div></div>');
    exitButton.prop('id', 'modal-exit-button');
    exitButton.click(destroyModal);

    modalBar.append(modalTitle);
    modalBar.append(exitButton);

    var container = $('<div></div>');

    modal.append(modalBar);
    modal.append(container);
    container.load(location, () => {
      $('#main-content').css({
        opacity: 0.1
      });
      $('#wrapper').append(modal);
      $('#wrapper').append($('<div id="blank-page"></div>'));
      if (store.get(modalName)) {
        var pos = store.get(modalName);
        modal.css({
          left: pos.left + 'px',
          top: pos.top + 'px'
        });
      } else
        modal.css({
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