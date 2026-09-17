/* スタイルページ上部の絞り込み（検索 + スコープ）
   - パネル（.component-detail-panel[data-scope]）を絞り込む
   - 空になったグループ見出しと、サイドバーの該当項目もあわせて隠す */
(function () {
    'use strict';

    var root = document.querySelector('[data-filter-root]');
    if (!root) { return; }

    var input = root.querySelector('[data-filter-search]');
    var clearBtn = root.querySelector('[data-filter-clear]');
    var chips = Array.prototype.slice.call(root.querySelectorAll('[data-filter-scope]'));
    var status = root.querySelector('[data-filter-status]');
    var empty = root.querySelector('[data-filter-empty]');

    var panels = Array.prototype.slice.call(document.querySelectorAll('.component-detail-panel[data-scope]'));
    var groups = Array.prototype.slice.call(document.querySelectorAll('[data-filter-group]'));
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.component-tab[data-target]'));
    var tabGroups = Array.prototype.slice.call(document.querySelectorAll('[data-group-toggle]'));
    var scope = 'all';

    function haystack(panel) {
        return (panel.dataset.filterText || panel.textContent).toLowerCase();
    }

    function apply() {
        var q = (input && input.value ? input.value : '').trim().toLowerCase();
        var shown = 0;
        var visible = {};

        panels.forEach(function (panel) {
            var show = (scope === 'all' || panel.dataset.scope === scope) &&
                       (!q || haystack(panel).indexOf(q) !== -1);
            panel.hidden = !show;
            visible[panel.id] = show;
            if (show) { shown += 1; }
        });

        groups.forEach(function (group) {
            var hit = group.dataset.filterGroup === 'all' ||
                      panels.some(function (p) { return p.dataset.scope === group.dataset.filterGroup && visible[p.id]; });
            group.hidden = !hit;
        });

        tabs.forEach(function (tab) {
            tab.hidden = visible[tab.getAttribute('data-target')] === false;
        });

        tabGroups.forEach(function (toggle) {
            var items = document.getElementById(toggle.getAttribute('aria-controls'));
            if (!items) { return; }
            var hit = items.querySelectorAll('.component-tab:not([hidden])').length;
            toggle.hidden = hit === 0;
            if (items.hidden !== undefined && hit > 0 && (q || scope !== 'all')) {
                items.hidden = false;
                toggle.setAttribute('aria-expanded', 'true');
            }
        });

        if (empty) { empty.hidden = shown !== 0; }
        if (status) {
            status.innerHTML = shown === panels.length
                ? '<b>' + panels.length + '</b> 件すべてを表示中'
                : '<b>' + shown + '</b> / ' + panels.length + ' 件を表示中';
        }
        if (clearBtn) { clearBtn.parentNode.classList.toggle('has-value', !!q); }
    }

    if (input) {
        input.addEventListener('input', apply);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { input.value = ''; apply(); }
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            input.value = '';
            input.focus();
            apply();
        });
    }
    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            scope = chip.dataset.filterScope;
            chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
            apply();
        });
    });

    apply();
}());
