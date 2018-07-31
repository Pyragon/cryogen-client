const fs = require('fs');

var _modals = () => {

  var openModal;

  function viewModal(name, eventCallback, callback) {
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