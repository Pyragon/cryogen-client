const remote = require('electron').remote;

var _context = () => {

    var menuItems = [];

    function closeMenu() {
        $('#context-menu').css('display', 'none');
    }

    function clicked(e) {
        var target = $(e.target).closest('.context-item');
        var callback = target.data('callback');
        var clickEvent = target.data('click-event');
        callback(clickEvent, e);
    }

    return {

        init: () => {

            //remote.getCurrentWindow().on('blur', () => $('#context-menu').css('display', 'none'));

            $(document).on('mousedown', '#wrapper', (e) => {
                var target = $(e.target);

                if (target.is('#context-menu') || target.parents('#context-menu').length > 0)
                    return;
                $('#context-menu').css('display', 'none');
            });

            $(document).on('contextmenu', '#main-content', (e) => {
                var target = $(e.target);

                var items = [];

                for (var i = 0; i < menuItems.length; i++) {
                    var menuItem = menuItems[i];
                    var selector = menuItem.selector;
                    if (target.is(selector) || target.parents(selector).length > 0) {
                        for (var k = 0; k < menuItem.items.length; k++) {
                            items.push(menuItem.items[k]);
                        }
                    }
                }

                if (items.length == 0) {
                    return false;
                }
                var menu = $('#context-menu');
                var list = menu.find('#context-list');
                list.empty();
                for (i = 0; i < items.length; i++) {
                    var item = items[i];
                    var listItem = $('<div></div>');
                    listItem.addClass('context-item');
                    var span = $('<span></span>');
                    span.html(item.name);
                    span.css('cursor', 'pointer');
                    if (item.textCSS) span.css(item.textCSS);
                    if (item.icon) {
                        var icon = $(`<i class="${item.icon} fa-fw"></i>`);
                        icon.css('margin-left', (5 + ((20 - 16) / 2)) + 'px');
                        var style = $(`<style>
                                        .${item.icon.replaceAll('fa ', '')}::before {
                                            cursor: pointer;
                                        }</style>`);
                        $('html > head').append(style);
                        if (item.iconCSS) icon.css(item.iconCSS);
                        listItem.append(icon);
                    }
                    if (item.callback) {
                        listItem.data('callback', item.callback);
                        listItem.data('click-event', e);
                        listItem.bind('click', clicked);
                    }
                    listItem.bind('click', closeMenu);
                    listItem.append(span);

                    if (item.css) listItem.css(item.css);
                    list.append(listItem);
                }
                menu.css('display', 'block');
                var x = e.pageX;
                var y = e.pageY;
                //if right side of menu will go off side, change to left side
                if (x + menu.width() > $('#wrapper').width())
                    menu.css('left', (x - menu.width()) + 'px');
                else //otherwise just place normally
                    menu.css('left', x + 'px');
                if (y + menu.height() > $('#wrapper').height())
                    menu.css('top', (y - menu.height()) + 'px');
                else menu.css('top', y + 'px');
                return false;
            });

        },

        addMenuItems: (items) => {
            if (!items.selector) {
                console.error('No selector specified.');
                return;
            }
            if (menuItems.filter(i => i.selector === items.selector).length > 0) {
                console.log('Selector already active: ' + items.selector);
                return;
            }
            if (!items.items || items.items.length == 0) {
                console.error('No items specified!');
            }
            menuItems.push(items);
        },

        unregisterSelector: (selector) => {
            menuItems = menuItems.filter(i => i.selector != selector);
        }

    };

};
module.exports = _context;