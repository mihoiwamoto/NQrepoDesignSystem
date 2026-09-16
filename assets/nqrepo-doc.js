// --- 目次サイドバー: スクロール位置に合わせて現在地をハイライト ---
(function () {
    var showAll = document.body.classList.contains('doc-show-all');
    var items = [];

    Array.prototype.forEach.call(document.querySelectorAll('.doc-nav a[href^="#"]'), function (a) {
        var el = document.getElementById(a.getAttribute('href').slice(1));
        if (el) items.push({ a: a, el: el });
    });

    if (showAll) {
        // すべてのグループを開いた状態にする
        Array.prototype.forEach.call(document.querySelectorAll('[data-group-toggle]'), function (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
            var group = document.getElementById(toggle.getAttribute('aria-controls'));
            if (group) group.hidden = false;
        });
        // タブはパネルの切り替えではなく、該当位置へのスクロールとして働く
        Array.prototype.forEach.call(document.querySelectorAll('.component-tab[data-target]'), function (tab) {
            var el = document.getElementById(tab.getAttribute('data-target'));
            if (!el) return;
            items.push({ a: tab, el: el });
            tab.addEventListener('click', function () {
                el.scrollIntoView({ block: 'start' });
                if (history.replaceState) history.replaceState(null, '', '#' + el.id);
            });
        });
    }
    if (!items.length) return;

    function update() {
        var line = window.scrollY + 130;
        var current = items[0];
        for (var i = 0; i < items.length; i++) {
            var top = items[i].el.getBoundingClientRect().top + window.scrollY;
            if (top <= line) current = items[i];
        }
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
            current = items[items.length - 1];
        }
        items.forEach(function (it) {
            it.a.classList.remove('is-active');
            it.a.removeAttribute('aria-current');
        });
        current.a.classList.add('is-active');
        current.a.setAttribute('aria-current', 'location');
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
})();
