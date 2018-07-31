const remote = require('electron').remote;

var _context = () => {

  var menuItems = [];

  function closeMenu() {
    $('#context-menu').css('display', 'none');
  }

  return {

    init: () => {

      remote.getCurrentWindow().on('blur', () => $('#context-menu').css('display', 'none'));

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
          console.log('Item length 0');
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
          if (item.icon) {
            var icon = $('<i></i>');
            icon.addClass(item.icon);
            listItem.append(icon);
          }
          if (item.callback)
            listItem.bind('click', item.callback);
          listItem.bind('click', closeMenu);
          listItem.append(span);

          list.append(listItem);
        }
        menu.css('display', 'block');
        var x = e.pageX;
        var y = e.pageY;
        console.log(x + ' ' + (x + 135));
        console.log(y + ' ' + (y - menu.height()));
        if (x + 135 > $('#wrapper').width()) menu.css('left', (x - 135) + 'px');
        else menu.css('left', x + 'px');
        if (y - menu.height() < 0) menu.css('top', y + 'px');
        else menu.css('top', y + 'px');
        return false;
      });

    },

    addMenuItems: (items) => {
      if (!items.selector) {
        console.error('No selector specified.');
        return;
      }
      if (!items.items || items.items.length == 0) {
        console.error('No items specified!');
      }
      menuItems.push(items);
    }

  };

};
module.exports = _context;