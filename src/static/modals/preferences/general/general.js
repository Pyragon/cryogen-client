const {
    remote,
    ipcRenderer
} = require('electron');
const {
    app,
    dialog
} = remote;
$(document).ready(() => {

    var delays = [];

    loadOptions();

    function loadOptions() {
        $('.switch').each(function() {
            var id = $(this).prop('id');
            if (store.get(id))
                $(this).find('input').prop('checked', true);
        });
    }

    $('#autoLogin').find('input').prop('checked', store.get('autoLogin') || store.get('savePassForAutoLogin'));

    $('#client-path').val(store.get('clientPath'));

    $('#browse-btn').click(() => {
        dialog.showOpenDialog(remote.getCurrentWindow(), {
            title: 'Select download location',
            defaultPath: store.get('clientPath'),
            properties: [
                'openDirectory'
            ]
        }, (paths) => {
            if (!paths || paths.length <= 0) return;
            store.set('clientPath', paths[0]);
            $('#client-path').val(paths[0]);
            ipcRenderer.send('client:check');
        });
    });

    $('.switch input').change(function() {
        var el = $(this);
        var id = el.closest('.switch').prop('id');
        var value = el.is(':checked');
        if (delays[id] > new Date().getTime()) {
            el.prop('checked', !value);
            return;
        }
        delays[id] = new Date().getTime() + 1000;
        switch (id) {
            case 'launchOnStart':
                app.setLoginItemSettings({
                    openAtLogin: value
                });
                break;
            case 'autoLogin':
                if (!value) {
                    console.log('wtf');
                    store.set('autoLogin', false);
                    store.set('savePassForAutoLogin', false);
                    store.delete('username');
                    store.delete('password');
                    return;
                }
                store.set('savePassForAutoLogin', true);
                sendNotification('Preferences', 'Auto Login will begin to work after you next login.');
                break;
        }
    });

});