var _modals = () => {

    var modals = {};

    var defaults = {
        width: 200,
        height: 200,
        draggable: true,
        saveDragPosition: true,
        container: 'main-content'
    };

    function destroyModal(container, callback) {
        $(`#${container} .modal`).remove();
        delete modals.container;
    }

    function drag(id, e) {
        e = e || window.event;
        var elem = $('#' + id);
        var pos = elem.position();
        var posX = e.clientX,
            posY = e.clientY,
            divTop = pos.top,
            divLeft = pos.left;
        var diffX = posX - divLeft,
            diffY = posY - divTop;
        document.onmousemove = (e) => {
            e = e || window.event;
            var posX = e.clientX,
                posY = e.clientY,
                aX = posX - diffX,
                aY = posY - diffY;
            var cont = $('#' + $('#' + id).data('options').container);
            var pos = cont.position();
            if (aX < 0) aX = 0;
            if (aX + elem.width() > cont.width()) aX = cont.width() - elem.width();
            if (aY < 24) aY = 24;
            if (aY + elem.height() > cont.height()) aY = cont.height() - elem.height();
            $('#' + id).css({
                left: aX + 'px',
                top: aY + 'px'
            });
        };
        document.onmouseup = (e) => {
            document.onmousemove = function() {};
        };
    }

    function viewModal(options, callback) {
        var extended = extend(JSON.parse(JSON.stringify(defaults)), options);
        if (modals.container) {
            destroyModal(extended.container, () => viewModal(options, callback));
            return;
        }
        if (!ui.hasStarted()) {
            console.error('Cannot show modal before UI has been loaded.');
            return;
        }
        var location;
        if (!extended.html) {
            location = path.join(__dirname, '../modals/' + extended.name + '.pug');
            if (!fs.existsSync(location)) {
                console.error('Unable to find modal with that name.');
                return;
            }
        }
        var modal = $('<div></div>');
        modal.addClass('modal');
        modal.data('options', extended);

        var id;
        if (extended.id) id = extended.id;
        else id = extended.name;
        modal.prop('id', id);

        var modalBar = $('<div></div>');
        modalBar.addClass('modal-bar');

        if (extended.draggable) modalBar.mousedown((e) => drag(id, e));

        var modalTitle = $('<span></span>');
        modalTitle.addClass('modal-title');
        if (extended.title) modalTitle.html(extended.title);

        var exitButton = $('<div></div>');
        exitButton.addClass('modal-exit-button');
        exitButton.click(() => {
            if (extended.onClose) extended.onClose();
            else destroyModal(extended.container);
        });

        modalBar.append(modalTitle);
        modalBar.append(exitButton);

        var container = $('<div></div>');

        var h = extended.height + 'px';
        var w = extended.width + 'px';
        modal.css({
            "min-height": h,
            "min-width": w,
            "max-height": h + 24,
            "max-width": w
        });

        modal.append(modalBar);
        modal.append(container);
        var loadC = () => {
            $('#' + extended.container).append(modal);
            var left = 0;
            var top = 0;
            var pos = null;
            var width = $('#' + extended.container).width();
            var height = $('#' + extended.container).height();
            if (extended.saveDragPosition && (pos = store.get(id)) != null)
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
                left: (width - modal.width()) / 2 + 'px',
                top: ((height + 24) - modal.height()) / 2 + 'px'
            });
            if (callback) callback();
        };
        var html = extended.html ? extended.html : pug.renderFile(location, extended.model);
        container.html(html);
        loadC();

        modals[extended.container] = modal;
        if (extended.onDestroy) modal.on('remove', extended.onDestroy);
    }

    return {

        viewModal: viewModal,
        destroyModal: destroyModal,


    };

};
module.exports = _modals;