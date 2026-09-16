/* コンポーネント一覧の検索 / スコープ絞り込み */
(function () {
    'use strict';

    var root = document.querySelector('[data-lib-root]');
    if (!root) { return; }

    var input = root.querySelector('[data-lib-search]');
    var clearBtn = root.querySelector('[data-lib-clear]');
    var chips = Array.prototype.slice.call(root.querySelectorAll('[data-lib-scope]'));
    var status = root.querySelector('[data-lib-status]');
    var items = Array.prototype.slice.call(root.querySelectorAll('.lib-item'));
    var groups = Array.prototype.slice.call(root.querySelectorAll('[data-lib-group]'));
    var empty = root.querySelector('[data-lib-empty]');
    var scope = 'all';

    function haystack(item) {
        if (!item.dataset.libHaystack) {
            item.dataset.libHaystack = (item.textContent + ' ' + (item.dataset.kw || '')).toLowerCase().replace(/\s+/g, ' ');
        }
        return item.dataset.libHaystack;
    }

    function apply() {
        var q = (input && input.value ? input.value : '').trim().toLowerCase();
        var shown = 0;

        items.forEach(function (item) {
            var okScope = scope === 'all' || item.dataset.scope === scope;
            var okText = !q || haystack(item).indexOf(q) !== -1;
            var show = okScope && okText;
            item.hidden = !show;
            if (show) { shown += 1; }
        });

        groups.forEach(function (group) {
            var hit = group.querySelectorAll('.lib-item:not([hidden])').length;
            group.hidden = hit === 0;
            var count = group.querySelector('[data-lib-group-count]');
            if (count) { count.textContent = hit + ' 群'; }
            if (group.tagName === 'DETAILS' && (q || scope !== 'all') && hit > 0) { group.open = true; }
        });

        if (empty) { empty.hidden = shown !== 0; }
        if (status) {
            status.textContent = shown === items.length
                ? items.length + ' 件すべてを表示中'
                : shown + ' / ' + items.length + ' 件を表示中';
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
            scope = chip.dataset.libScope;
            chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
            apply();
        });
    });

    apply();
}());
