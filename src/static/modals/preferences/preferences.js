$(document).ready(() => {

    var active = 'general';
    if (store.get('preferences.activeTab'))
        active = store.get('preferences.activeTab');

    loadTab();

    setTabHeights();

    $('.tab').click(selectTab);

    function setTabHeights() {
        var count = $('.tab').length;
        var height = (350 - (count - 1)) / count;
        $('.tab').css({
            height: height + 'px'
        });
    }

    function selectTab() {
        var tabName = $(this).prop('id');
        if (tabName == active) return;
        getActiveElement().toggleClass('active');
        active = tabName;
        loadTab();
    }

    function loadTab() {
        modals.destroyModal('preferences');
        store.set('preferences.activeTab', active);
        $('#preferences-content').load(__dirname + '/modals/preferences/' + getActiveElement().data('url'));
        getActiveElement().toggleClass('active');
    }

    function getActiveElement() {
        return $(`#${active}`);
    }

});