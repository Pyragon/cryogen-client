const {
    remote,
    ipcRenderer
} = require('electron');
const {
    app,
    dialog
} = remote;
const fs = require('fs');
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
    $('#token-expiry').val(store.get('tokenExpiry'));

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

    $('#client-path').keydown(function(e) {
        var key = e.which;
        if (key == 13) $(this).blur();
    });

    $('#client-path').blur(function() {
        var p = $(this).val();
        if (!fs.existsSync(p)) {
            $(this).val(store.get('clientPath'));
            sendNotification('Path does not exist!', 'Click here to create and set new path.', () => {
                fs.mkdirSync(p);
                store.set('clientPath', p);
                $(this).val(p);
            });
            return;
        }
        store.set('clientPath', p);
    });

    $('#token-expiry').keydown(function(e) {
        var key = e.which;
        if (key == 13) $(this).blur();
    });

    $('#token-expiry').blur(function() {
        var expiry = $(this).val();
        var min = (60 * 60) * 1000;
        var max = (24 * 60 * 60) * 1000;
        var error;
        if (expiry < min) error = 'Expiry time must be at least 1 hour.';
        else if (expiry > max) error = 'The maximum expiry time is 1 day.';
        if (error) {
            $(this).val(store.get('tokenExpiry'));
            sendNotification('Error saving expiry time', error);
            return;
        }
        store.set('tokenExpiry', expiry);
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