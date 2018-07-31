const fs = require('fs');

var _modals = () => {

  var openModal;

  var pos1 = 0,
    pos2 = 0,
    dragX, dragY;

  function startDrag(e) {
    dragX = e.clientX;
    dragY = e.clientY;
    console.log('starting drag');
    $('#wrapper').mouseup(stopDrag);
    $('#wrapper').mousemove(drag);
    return false;
  }

  function drag(e) {
    pos1 = dragX - e.clientX;
    pos2 = dragY - e.clientY;
    dragX = e.clientX;
    dragY = e.clientY;
    var elm = $('#modal');
    var offset = elm.offset();
    elm.css('top', (offset.top - pos2) + 'px');
    elm.css('left', (offset.left - pos1) + 'px');
    return false;
  }

  function stopDrag(e) {
    var elm = $('#modal-bar');
    $('#wrapper').off('mousemove');
    $('#wrapper').off('mouseup');
    return false;
  }

  function viewModal(name, title, eventCallback, callback) {
    if (openModal) {
      destroyModal(() => viewModal(eventCallback, callback));
      return;
    }
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