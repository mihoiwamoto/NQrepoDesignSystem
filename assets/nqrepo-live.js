/* スタイルページ：Figma「NQrepo UI Kit」の静的モック（nqf-*）を、実際に操作できる部品にする
   - 入力欄には <input> / <textarea> を差し込む
   - ボタン・タブ・アコーディオン・チェック・ラジオ・セレクト・日付などに data-nqf-act を付与し、
     document への委譲イベントで振る舞いを与える（複製したモーダル内でもそのまま動く）
   - ポップオーバー（メニュー／カレンダー／ツールチップ）とモーダル、トーストは body 直下に描く */
(function () {
    'use strict';

    if (!document.querySelector('.nqf-canvas')) { return; }

    /* ---------- ユーティリティ ---------- */
    function $(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) { n.className = cls; }
        if (text !== undefined) { n.textContent = text; }
        return n;
    }
    function useId(svg) {
        var u = svg && svg.querySelector('use');
        return u ? (u.getAttribute('href') || '').replace('#', '') : '';
    }
    function setUse(svg, id) {
        var u = svg && svg.querySelector('use');
        if (u) { u.setAttribute('href', '#' + id); }
    }
    function svgUse(id, size) {
        var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('class', 'nqf-icon');
        s.setAttribute('width', size); s.setAttribute('height', size);
        s.setAttribute('aria-hidden', 'true');
        var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        u.setAttribute('href', '#' + id);
        s.appendChild(u);
        return s;
    }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function labelFor(node) {
        var unit = node.closest('.nqf-item-row, .nqf-dateitem, .nqf-selectitem, .nqf-checkitem, .nqf-longitem, .nqf-selitem-row, .nqf-selitem-head, .nqf-aunit, .nqf-dlg-unit, .nqf-dlg-row');
        var lab = unit && unit.querySelector('.nqf-label-text, .nqf-alabel-title, .nqf-dlg-unit-title');
        return lab ? lab.textContent.replace(/※/g, '').trim() : '';
    }
    function act(node, name, role) {
        if (node.dataset.nqfAct) { return false; }
        node.dataset.nqfAct = name;
        node.classList.add('nqf-press');
        if (role) { node.setAttribute('role', role); }
        if (!node.hasAttribute('tabindex')) { node.tabIndex = 0; }
        return true;
    }

    /* チェック済みチェックボックスのアイコン（Figma には Off しかないため追加） */
    var defs = document.querySelector('.nqf-defs defs');
    if (defs && !document.getElementById('nqf-i-ckeckbox-on')) {
        defs.insertAdjacentHTML('beforeend',
            '<symbol id="nqf-i-ckeckbox-on" viewBox="0 0 24 24" fill="none">' +
            '<rect x="4" y="4" width="16" height="16" rx="2" fill="#009944"/>' +
            '<path d="M7.6 12.3L10.6 15.3L16.6 8.8" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</symbol>');
    }

    /* ---------- ポップオーバー ---------- */
    var openPop = null;
    function closePop() {
        if (!openPop) { return; }
        var p = openPop; openPop = null;
        p.remove();
        if (p._onClose) { p._onClose(); }
    }
    function placePop(pop, anchor, align) {
        var r = anchor.getBoundingClientRect();
        var pw = pop.offsetWidth, ph = pop.offsetHeight;
        var left = r.left, top = r.bottom + 6;
        if (align === 'center') { left = r.left + r.width / 2 - pw / 2; }
        if (left + pw > window.innerWidth - 8) { left = window.innerWidth - 8 - pw; }
        if (left < 8) { left = 8; }
        pop.classList.remove('is-above');
        if (top + ph > window.innerHeight - 8 && r.top - ph - 6 > 8) { top = r.top - ph - 6; pop.classList.add('is-above'); }
        pop.style.left = (left + window.scrollX) + 'px';
        pop.style.top = (top + window.scrollY) + 'px';
    }
    function showPop(pop, anchor, opts) {
        opts = opts || {};
        closePop();
        pop.classList.add('nqf-pop');
        pop.style.visibility = 'hidden';
        document.body.appendChild(pop);
        placePop(pop, anchor, opts.align);
        pop.style.visibility = '';
        pop._anchor = anchor;
        pop._align = opts.align;
        pop._onClose = opts.onClose;
        openPop = pop;
        return pop;
    }
    document.addEventListener('pointerdown', function (e) {
        if (openPop && !openPop.contains(e.target) && !openPop._anchor.contains(e.target)) { closePop(); }
    });
    document.addEventListener('scroll', function () {
        if (openPop) { placePop(openPop, openPop._anchor, openPop._align); }
    }, true);
    window.addEventListener('resize', closePop);

    /* ---------- メニュー（SelectBox / CertificationState） ---------- */
    var OPTIONS = {
        '工場選択': ['本社工場', '第二工場', '東日本工場', '西日本工場'],
        '権限選択': ['実施者', '確認者', '承認者', '管理者'],
        'ログ種別': ['ログイン', '操作', 'エラー', 'システム'],
        'default': ['選択肢01', '選択肢02', '選択肢03']
    };
    function openMenu(anchor, items, current, onPick) {
        var menu = el('div', 'nqf-menu');
        menu.setAttribute('role', 'listbox');
        var r = anchor.getBoundingClientRect();
        menu.style.minWidth = Math.max(146, r.width) + 'px';
        items.forEach(function (item) {
            var o = el('div', 'nqf-pditem');
            o.setAttribute('role', 'option');
            o.tabIndex = -1;
            o.setAttribute('aria-selected', String(item.value === current));
            o.appendChild(el('span', '', item.label));
            o.addEventListener('click', function () { onPick(item); closePop(); anchor.focus(); });
            o.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.click(); }
            });
            menu.appendChild(o);
        });
        menu.addEventListener('keydown', function (e) {
            var opts = $('[role="option"]', menu);
            var i = opts.indexOf(document.activeElement);
            if (e.key === 'ArrowDown') { e.preventDefault(); opts[Math.min(opts.length - 1, i + 1)].focus(); }
            if (e.key === 'ArrowUp') { e.preventDefault(); opts[Math.max(0, i - 1)].focus(); }
            if (e.key === 'Tab') { closePop(); }
        });
        anchor.classList.add('is-open');
        anchor.setAttribute('aria-expanded', 'true');
        showPop(menu, anchor, { onClose: function () {
            anchor.classList.remove('is-open');
            anchor.setAttribute('aria-expanded', 'false');
        } });
        var sel = menu.querySelector('[aria-selected="true"]') || menu.querySelector('[role="option"]');
        if (sel) { sel.focus(); }
    }

    /* ---------- カレンダー（InputDate） ---------- */
    var DOW = ['日', '月', '火', '水', '木', '金', '土'];
    function openCalendar(anchor) {
        var text = anchor.querySelector('.nqf-date-text');
        var today = new Date();
        var cur = anchor.dataset.value ? new Date(anchor.dataset.value + 'T00:00:00') : null;
        var view = new Date((cur || today).getFullYear(), (cur || today).getMonth(), 1);
        var pop = el('div', 'nqf-calpop');
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-label', '日付を選択');

        function pick(d) {
            if (d) {
                anchor.dataset.value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
                text.textContent = d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate());
                text.classList.add('has-value');
            } else {
                delete anchor.dataset.value;
                text.textContent = text.dataset.ph;
                text.classList.remove('has-value');
            }
            closePop();
            anchor.focus();
        }
        function render() {
            pop.innerHTML = '';
            var head = el('div', 'nqf-calpop-head');
            var prev = el('button', 'nqf-calpop-nav'); prev.type = 'button'; prev.setAttribute('aria-label', '前の月');
            prev.appendChild(svgUse('nqf-i-arrow-left', 16));
            var next = el('button', 'nqf-calpop-nav'); next.type = 'button'; next.setAttribute('aria-label', '次の月');
            next.appendChild(svgUse('nqf-i-arrow-right', 16));
            prev.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
            next.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
            head.appendChild(prev);
            head.appendChild(el('span', 'nqf-calpop-label', view.getFullYear() + '年' + (view.getMonth() + 1) + '月'));
            head.appendChild(next);
            pop.appendChild(head);

            var grid = el('div', 'nqf-calpop-grid');
            DOW.forEach(function (d) { grid.appendChild(el('span', 'nqf-calpop-dow', d)); });
            var first = view.getDay();
            var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
            for (var i = 0; i < first; i++) { grid.appendChild(el('span', 'nqf-calpop-day is-empty')); }
            for (var d = 1; d <= days; d++) {
                var date = new Date(view.getFullYear(), view.getMonth(), d);
                var cell = el('button', 'nqf-calpop-day', String(d));
                cell.type = 'button';
                if (date.toDateString() === today.toDateString()) { cell.classList.add('is-today'); }
                if (cur && date.toDateString() === cur.toDateString()) { cell.classList.add('is-selected'); cell.setAttribute('aria-current', 'date'); }
                cell.setAttribute('aria-label', view.getFullYear() + '年' + (view.getMonth() + 1) + '月' + d + '日');
                cell.addEventListener('click', pick.bind(null, date));
                grid.appendChild(cell);
            }
            pop.appendChild(grid);

            var foot = el('div', 'nqf-calpop-foot');
            var clear = el('button', 'nqf-calpop-clear', 'クリア'); clear.type = 'button';
            clear.addEventListener('click', function () { pick(null); });
            foot.appendChild(clear);
            pop.appendChild(foot);
            if (openPop === pop) { placePop(pop, anchor); }
        }
        render();
        anchor.classList.add('is-open');
        anchor.setAttribute('aria-expanded', 'true');
        showPop(pop, anchor, { onClose: function () {
            anchor.classList.remove('is-open');
            anchor.setAttribute('aria-expanded', 'false');
        } });
        var focusTo = pop.querySelector('.is-selected') || pop.querySelector('.is-today') || pop.querySelector('.nqf-calpop-day:not(.is-empty)');
        if (focusTo) { focusTo.focus(); }
    }

    /* ---------- ツールチップ ---------- */
    var TIP_TEXT = 'ツールチップの説明文が入ります。項目の意味や入力のヒントを補足します。';
    var tipFor = null, tipPinned = false;
    function showTip(anchor, pinned) {
        if (openPop && openPop.classList.contains('nqf-tip') && tipFor === anchor) { tipPinned = tipPinned || pinned; return; }
        var tip = el('div', 'nqf-tip', TIP_TEXT);
        tip.setAttribute('role', 'tooltip');
        tipFor = anchor; tipPinned = !!pinned;
        showPop(tip, anchor, { onClose: function () { tipFor = null; tipPinned = false; } });
    }
    function hideTip(anchor) {
        if (tipFor === anchor && !tipPinned) { closePop(); }
    }
    document.addEventListener('mouseover', function (e) {
        var t = e.target.closest && e.target.closest('[data-nqf-act="tip"]');
        if (t) { showTip(t, false); }
    });
    document.addEventListener('mouseout', function (e) {
        var t = e.target.closest && e.target.closest('[data-nqf-act="tip"]');
        if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) { hideTip(t); }
    });
    document.addEventListener('focusin', function (e) {
        var t = e.target.closest && e.target.closest('[data-nqf-act="tip"]');
        if (t) { showTip(t, false); }
    });
    document.addEventListener('focusout', function (e) {
        var t = e.target.closest && e.target.closest('[data-nqf-act="tip"]');
        if (t) { hideTip(t); }
    });

    /* ---------- トースト ---------- */
    function toastHost() {
        var h = document.querySelector('.nqf-toast-host');
        if (!h) { h = el('div', 'nqf-toast-host'); h.setAttribute('aria-live', 'polite'); document.body.appendChild(h); }
        return h;
    }
    function dismissToast(t) {
        if (t.classList.contains('is-leaving')) { return; }
        t.classList.add('is-leaving');
        setTimeout(function () { t.remove(); }, 240);
    }
    function showToastNode(node) {
        var t = node.cloneNode(true);
        t.removeAttribute('data-nqf-try');
        t.setAttribute('role', 'status');
        toastHost().appendChild(t);
        t.addEventListener('click', function () { dismissToast(t); });
        setTimeout(function () { dismissToast(t); }, 3200);
    }
    function toast(kind, text) {
        var t = el('div', 'nqf-toast' + (kind === 'error' ? ' nqf-toast--error' : ''));
        t.appendChild(el('span', 'nqf-toast-mark', kind === 'error' ? '✕' : '✓'));
        t.appendChild(el('span', 'nqf-toast-text', text));
        showToastNode(t);
    }

    /* ---------- ページネーション ---------- */
    function renderPagination(pg, current, total) {
        var cells = $('.nqf-pg-cell', pg);
        var prev = cells[0], next = cells[cells.length - 1];
        cells.slice(1, -1).forEach(function (c) { c.remove(); });
        // 現在ページを中心にした 5 ページの窓 + 先頭と末尾（Figma のサンプル 1〜5 … 10 と同じ並び）
        var start = Math.max(1, Math.min(current - 2, total - 4));
        var pages = [];
        for (var p = 1; p <= total; p++) {
            if (p === 1 || p === total || (p >= start && p < start + 5)) { pages.push(p); }
            else if (pages[pages.length - 1] !== '…') { pages.push('…'); }
        }
        pages.forEach(function (p) {
            var c = el('span', 'nqf-pg-cell', String(p));
            if (p === '…') { c.setAttribute('aria-hidden', 'true'); }
            else {
                act(c, 'pg', 'button');
                c.setAttribute('aria-label', p + 'ページ');
                if (p === current) { c.classList.add('nqf-pg-cell--current'); c.setAttribute('aria-current', 'page'); }
            }
            pg.insertBefore(c, next);
        });
        pg.dataset.current = current;
        pg.dataset.total = total;
        prev.setAttribute('aria-disabled', String(current === 1));
        next.setAttribute('aria-disabled', String(current === total));
        prev.style.opacity = current === 1 ? '0.4' : '';
        next.style.opacity = current === total ? '0.4' : '';
    }

    /* ---------- モックへの注釈（構造の差し替え + data-nqf-act 付与） ---------- */
    function wrapSample(node) {
        var parent = node.parentElement;
        if (parent.classList.contains('btn-sample')) { return parent; }
        var w = el('div', 'btn-sample');
        parent.insertBefore(w, node);
        w.appendChild(node);
        return w;
    }
    function annotate(scope) {
        scope = scope || document;

        // InputText（App）
        $('.nqf-input', scope).forEach(function (box) {
            if (box.querySelector('input')) { return; }
            var ph = box.textContent.trim() || '入力テキスト';
            box.textContent = '';
            var f = el('input', 'nqf-field'); f.type = 'text'; f.placeholder = ph;
            f.setAttribute('aria-label', labelFor(box) || ph);
            box.appendChild(f);
        });
        // InputText（Admin）
        $('.nqf-ainput', scope).forEach(function (box) {
            if (box.querySelector('input')) { return; }
            var t = box.querySelector('.nqf-ainput-text');
            var ph = t ? t.textContent.trim() : '入力テキスト';
            var f = el('input', 'nqf-ainput-text nqf-field'); f.type = 'text'; f.placeholder = ph;
            f.setAttribute('aria-label', labelFor(box) || ph);
            if (t) { box.replaceChild(f, t); } else { box.appendChild(f); }
        });
        // 複数行入力（App）
        $('.nqf-textarea, .nqf-dlg-longtext', scope).forEach(function (box) {
            if (box.querySelector('textarea')) { return; }
            var ph = box.textContent.trim();
            box.textContent = '';
            var f = el('textarea', 'nqf-field'); f.placeholder = ph; f.rows = 2;
            f.setAttribute('aria-label', labelFor(box) || ph);
            box.appendChild(f);
        });
        // Textarea（Admin）
        $('.nqf-ta', scope).forEach(function (box) {
            if (box.querySelector('textarea')) { return; }
            var ph = box.querySelector('.nqf-ta-ph');
            var lab = box.querySelector('.nqf-ta-label');
            var f = el('textarea', 'nqf-ta-field');
            f.placeholder = ph ? ph.textContent.trim() : 'テキストを入力';
            if (lab) { f.setAttribute('aria-label', lab.textContent.trim()); }
            if (box.classList.contains('nqf-ta--disabled')) { f.disabled = true; }
            if (ph) { ph.remove(); }
            box.appendChild(f);
        });
        // SelectBox（App / Admin）
        $('.nqf-select, .nqf-abox', scope).forEach(function (box) {
            var t = box.querySelector('.nqf-select-text');
            if (!t || !act(box, 'select', 'combobox')) { return; }
            if (!t.dataset.ph) { t.dataset.ph = t.textContent.trim(); }
            box.setAttribute('aria-haspopup', 'listbox');
            box.setAttribute('aria-expanded', 'false');
            box.setAttribute('aria-label', labelFor(box) || t.dataset.ph);
        });
        // CertificationState（Admin）
        $('.nqf-cert', scope).forEach(function (box) {
            if (!act(box, 'cert', 'button')) { return; }
            box.setAttribute('aria-haspopup', 'listbox');
            box.setAttribute('aria-expanded', 'false');
            box.setAttribute('aria-label', '認証状態を変更');
        });
        // InputDate
        $('.nqf-date', scope).forEach(function (box) {
            var t = box.querySelector('.nqf-date-text');
            if (!t || !act(box, 'date', 'button')) { return; }
            if (!t.dataset.ph) { t.dataset.ph = t.textContent.trim(); }
            box.setAttribute('aria-haspopup', 'dialog');
            box.setAttribute('aria-expanded', 'false');
            box.setAttribute('aria-label', (labelFor(box) ? labelFor(box) + '：' : '') + '日付を選択');
        });
        // CheckboxContainer
        $('.nqf-check-inner', scope).forEach(function (box) {
            if (!act(box, 'check', 'checkbox')) { return; }
            box.setAttribute('aria-checked', String(useId(box.querySelector('svg')) === 'nqf-i-ckeckbox-on'));
        });
        // Check / NG（80 × 48）
        $('.nqf-okng', scope).forEach(function (box) {
            if (!act(box, 'okng', 'checkbox')) { return; }
            var ng = useId(box.querySelector('svg')) === 'nqf-i-cancel';
            box.setAttribute('aria-label', (labelFor(box) ? labelFor(box) + '：' : '') + (ng ? 'NG' : 'チェック'));
            box.setAttribute('aria-checked', String(box.classList.contains('nqf-okng--on-ok') || box.classList.contains('nqf-okng--on-ng')));
        });
        // SelectButton（OK / NG）
        $('.nqf-selbtn-half', scope).forEach(function (half) {
            if (!act(half, 'half', 'radio')) { return; }
            var ng = useId(half.querySelector('svg')) === 'nqf-i-cancel';
            half.setAttribute('aria-label', ng ? 'NG' : 'OK');
            half.setAttribute('aria-checked', String(half.classList.contains('nqf-selbtn-half--ok') || half.classList.contains('nqf-selbtn-half--ng')));
        });
        // RadioButton（Admin）/ ダウンロード形式
        $('.nqf-radio, .nqf-adlg-dl-row', scope).forEach(function (r) {
            if (!act(r, 'radio', 'radio')) { return; }
            r.setAttribute('aria-checked', String(useId(r.querySelector('svg')) === 'nqf-i-radio-on'));
        });
        // 選択肢チップ（Dialog）
        $('.nqf-dlg-choices', scope).forEach(function (group) {
            if (!group.dataset.nqfMuted) { group.dataset.nqfMuted = group.querySelector('.nqf-dlg-choice--muted') ? '1' : '0'; }
            group.setAttribute('role', 'radiogroup');
        });
        $('.nqf-dlg-choice', scope).forEach(function (c) {
            if (!act(c, 'choice', 'radio')) { return; }
            c.setAttribute('aria-checked', String(c.classList.contains('nqf-dlg-choice--selected')));
        });
        // ボタン類
        $('.nqf-dlg-btn, .nqf-adlg-btn', scope).forEach(function (b) { act(b, 'dlgbtn', 'button'); });
        $('.nqf-btn-outline, .nqf-btn-lg', scope).forEach(function (b) { act(b, 'btn', 'button'); });
        $('.nqf-btn-reset', scope).forEach(function (b) { act(b, 'reset', 'button'); });
        $('.nqf-btn-search', scope).forEach(function (b) { act(b, 'search', 'button'); });
        // タブ（App Tab Container / Admin TabBar）
        $('.nqf-tabc-tab', scope).forEach(function (t) {
            if (!act(t, 'tabc', 'tab')) { return; }
            t.setAttribute('aria-selected', String(t.classList.contains('nqf-tabc-tab--active')));
        });
        // TabBar 内は排他切り替え、単体の Tab はクリックで Active をトグル
        $('.nqf-tab', scope).forEach(function (t) {
            if (!act(t, 'tab', 'tab')) { return; }
            t.setAttribute('aria-selected', String(t.classList.contains('nqf-tab--active')));
        });
        $('.nqf-tabc, .nqf-tabbar', scope).forEach(function (bar) { bar.setAttribute('role', 'tablist'); });
        // アコーディオン
        $('.nqf-acc-head', scope).forEach(function (h) {
            if (!act(h, 'acc', 'button')) { return; }
            h.setAttribute('aria-expanded', String(h.parentElement.classList.contains('nqf-acc--active')));
        });
        // ページネーション
        $('.nqf-pg', scope).forEach(function (pg) {
            if (pg.dataset.current) { return; }
            var cells = $('.nqf-pg-cell', pg);
            var nums = cells.filter(function (c) { return /^\d+$/.test(c.textContent.trim()); });
            var total = nums.length ? parseInt(nums[nums.length - 1].textContent, 10) : 10;
            var curEl = pg.querySelector('.nqf-pg-cell--current');
            var current = curEl ? parseInt(curEl.textContent, 10) : 1;
            act(cells[0], 'pgprev', 'button'); cells[0].setAttribute('aria-label', '前のページ');
            act(cells[cells.length - 1], 'pgnext', 'button'); cells[cells.length - 1].setAttribute('aria-label', '次のページ');
            pg.setAttribute('role', 'navigation'); pg.setAttribute('aria-label', 'ページネーション');
            // 初期表示は Figma のサンプルのまま。数字セルだけ押せるようにし、操作後に描き直す
            nums.forEach(function (c) { act(c, 'pg', 'button'); c.setAttribute('aria-label', c.textContent.trim() + 'ページ'); });
            if (curEl) { curEl.setAttribute('aria-current', 'page'); }
            pg.dataset.current = current; pg.dataset.total = total;
            cells[0].setAttribute('aria-disabled', String(current === 1)); cells[0].style.opacity = current === 1 ? '0.4' : '';
        });
        // カレンダーの日付セル
        $('.nqf-cal-day', scope).forEach(function (d) {
            if (!act(d, 'calday', 'button')) { return; }
            d.setAttribute('aria-pressed', String(d.classList.contains('nqf-cal-day--active')));
        });
        // カード
        $('.nqf-card', scope).forEach(function (c) {
            if (!act(c, 'card', 'button')) { return; }
            c.setAttribute('aria-pressed', String(c.classList.contains('nqf-card--selected')));
        });
        // フィルター検索の開閉
        $('.nqf-fs-head', scope).forEach(function (h) {
            var fs = h.closest('.nqf-fs');
            if (!fs || !act(h, 'fs', 'button')) { return; }
            var body = fs.querySelector('.nqf-fs-body');
            if (!body) {
                var tpl = document.querySelector('.nqf-fs--active .nqf-fs-body');
                if (tpl) {
                    body = tpl.cloneNode(true);
                    $('input, textarea', body).forEach(function (f) { f.value = ''; });
                    fs.appendChild(body);
                }
            }
            var open = fs.classList.contains('nqf-fs--active');
            if (body) { body.hidden = !open; }
            h.setAttribute('aria-expanded', String(open));
        });
        // ドロップダウン項目
        $('.nqf-dditem', scope).forEach(function (d) { act(d, 'dd', 'menuitem'); });
        $('.nqf-ddmenu', scope).forEach(function (m) { m.setAttribute('role', 'menu'); });
        // ツールチップ（? アイコン）
        $('svg', scope).forEach(function (s) {
            if (useId(s) !== 'nqf-i-question' || s.dataset.nqfAct) { return; }
            act(s, 'tip', 'button');
            s.removeAttribute('aria-hidden');
            s.setAttribute('aria-label', 'ヘルプ');
            s.setAttribute('focusable', 'true');
        });
        // トースト：表示する
        $('.nqf-toast', scope).forEach(function (t) {
            if (t.dataset.nqfTry || t.closest('.nqf-toast-host')) { return; }
            t.dataset.nqfTry = '1';
            var sample = wrapSample(t);
            var b = el('button', 'nqf-try', '表示する'); b.type = 'button'; b.dataset.nqfAct = 'showToast';
            sample.appendChild(b);
        });
    }

    /* ---------- 振る舞い（委譲） ---------- */
    function setRadioGroup(node, groupSel) {
        var group = (groupSel && node.closest(groupSel)) || node.parentElement;
        $('[data-nqf-act="radio"]', group).forEach(function (r) {
            var on = r === node;
            setUse(r.querySelector('svg'), on ? 'nqf-i-radio-on' : 'nqf-i-radio-off');
            r.setAttribute('aria-checked', String(on));
        });
    }
    function resetFilter(fs) {
        $('input, textarea', fs).forEach(function (f) { f.value = ''; });
        $('.nqf-select-text, .nqf-date-text', fs).forEach(function (t) {
            if (t.dataset.ph) { t.textContent = t.dataset.ph; }
            t.classList.remove('has-value');
        });
        $('[data-nqf-act="date"]', fs).forEach(function (d) { delete d.dataset.value; });
    }

    document.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('[data-nqf-act]');
        if (!t) { return; }
        if (e.target.closest('input, textarea')) { return; }
        var name = t.dataset.nqfAct;

        switch (name) {
        case 'select': {
            if (t.classList.contains('is-open')) { closePop(); return; }
            var text = t.querySelector('.nqf-select-text');
            var list = (OPTIONS[text.dataset.ph] || OPTIONS['default']).map(function (v) { return { value: v, label: v }; });
            openMenu(t, list, text.classList.contains('has-value') ? text.textContent : null, function (item) {
                text.textContent = item.label;
                text.classList.add('has-value');
            });
            return;
        }
        case 'cert': {
            if (t.classList.contains('is-open')) { closePop(); return; }
            var states = [
                { value: '', label: '認証待ち' },
                { value: 'nqf-cert--verified', label: '認証済み' }
            ];
            var curCls = t.classList.contains('nqf-cert--verified') ? 'nqf-cert--verified' : '';
            openMenu(t, states, curCls, function (item) {
                t.classList.remove('nqf-cert--verified');
                if (item.value) { t.classList.add(item.value); }
                t.querySelector('.nqf-cert-text').textContent = item.label;
            });
            return;
        }
        case 'date':
            if (t.classList.contains('is-open')) { closePop(); return; }
            openCalendar(t);
            return;
        case 'check': {
            var svg = t.querySelector('svg');
            var on = useId(svg) !== 'nqf-i-ckeckbox-on';
            setUse(svg, on ? 'nqf-i-ckeckbox-on' : 'nqf-i-ckeckbox');
            t.setAttribute('aria-checked', String(on));
            return;
        }
        case 'okng': {
            var cls = useId(t.querySelector('svg')) === 'nqf-i-cancel' ? 'nqf-okng--on-ng' : 'nqf-okng--on-ok';
            var now = t.classList.toggle(cls);
            t.setAttribute('aria-checked', String(now));
            return;
        }
        case 'half': {
            var wrap = t.closest('.nqf-selbtn');
            var halves = $('.nqf-selbtn-half', wrap);
            var ng = useId(t.querySelector('svg')) === 'nqf-i-cancel';
            var hcls = ng ? 'nqf-selbtn-half--ng' : 'nqf-selbtn-half--ok';
            var was = t.classList.contains(hcls);
            halves.forEach(function (h) {
                h.classList.remove('nqf-selbtn-half--ng', 'nqf-selbtn-half--ok');
                h.setAttribute('aria-checked', 'false');
            });
            if (!was) { t.classList.add(hcls); t.setAttribute('aria-checked', 'true'); }
            // 同じ行にステータスタグがあれば連動させる
            var row = t.closest('.nqf-dlg-row, .nqf-selitem-row, .nqf-selitem-head');
            var tag = row && row.querySelector('.nqf-stag');
            if (tag) {
                tag.classList.remove('nqf-stag--success', 'nqf-stag--error', 'nqf-stag--unchecked');
                if (was) { tag.classList.add('nqf-stag--unchecked'); tag.textContent = '未点検'; }
                else if (ng) { tag.classList.add('nqf-stag--error'); tag.textContent = '異常あり'; }
                else { tag.classList.add('nqf-stag--success'); tag.textContent = '正常'; }
            }
            return;
        }
        case 'radio':
            setRadioGroup(t, '.nqf-adlg-dl-body, .nqf-play-item, .btn-samples, .nqf-dlg-unit');
            return;
        case 'choice': {
            var group = t.closest('.nqf-dlg-choices');
            var muted = group && group.dataset.nqfMuted === '1';
            $('.nqf-dlg-choice', group || t.parentElement).forEach(function (c) {
                var sel = c === t;
                c.classList.toggle('nqf-dlg-choice--selected', sel);
                c.classList.toggle('nqf-dlg-choice--muted', muted && !sel);
                c.setAttribute('aria-checked', String(sel));
            });
            return;
        }
        case 'dlgbtn':
            return;
        case 'btn':
            return;
        case 'reset': {
            var fs = t.closest('.nqf-fs');
            if (fs) { resetFilter(fs); }
            return;
        }
        case 'search':
            toast('success', '検索条件を適用しました');
            return;
        case 'tabc':
            $('.nqf-tabc-tab', t.closest('.nqf-tabc')).forEach(function (tab) {
                tab.classList.toggle('nqf-tabc-tab--active', tab === t);
                tab.setAttribute('aria-selected', String(tab === t));
            });
            return;
        case 'tab': {
            var bar = t.closest('.nqf-tabbar');
            if (!bar) {
                var on = t.classList.toggle('nqf-tab--active');
                t.setAttribute('aria-selected', String(on));
                return;
            }
            $('.nqf-tab', bar).forEach(function (tab) {
                tab.classList.toggle('nqf-tab--active', tab === t);
                tab.setAttribute('aria-selected', String(tab === t));
            });
            return;
        }
        case 'acc': {
            var acc = t.parentElement;
            var open = !acc.classList.contains('nqf-acc--active');
            acc.classList.toggle('nqf-acc--active', open);
            t.setAttribute('aria-expanded', String(open));
            setUse(t.querySelector(':scope > svg'), open ? 'nqf-i-minus24' : 'nqf-i-plus24');
            var answer = acc.querySelector('.nqf-acc-answer');
            if (!answer) {
                var tpl = document.querySelector('.nqf-acc-answer');
                answer = tpl ? tpl.cloneNode(true) : el('div', 'nqf-acc-answer');
                if (!tpl) {
                    var body = el('div', 'nqf-acc-answer-body');
                    body.appendChild(el('p', '', 'ここに回答が表示されます。'));
                    answer.appendChild(body);
                }
                acc.appendChild(answer);
            }
            answer.hidden = !open;
            return;
        }
        case 'pg': {
            var pg = t.closest('.nqf-pg');
            renderPagination(pg, parseInt(t.textContent, 10), parseInt(pg.dataset.total, 10));
            return;
        }
        case 'pgprev':
        case 'pgnext': {
            var pg2 = t.closest('.nqf-pg');
            var cur = parseInt(pg2.dataset.current, 10), total = parseInt(pg2.dataset.total, 10);
            var nextPage = Math.min(total, Math.max(1, cur + (name === 'pgnext' ? 1 : -1)));
            if (nextPage !== cur) { renderPagination(pg2, nextPage, total); }
            return;
        }
        case 'calday': {
            var on2 = t.classList.toggle('nqf-cal-day--active');
            t.setAttribute('aria-pressed', String(on2));
            var tag2 = t.querySelector('.nqf-cal-tag');
            if (on2 && !tag2) { t.appendChild(el('span', 'nqf-cal-tag', '休業日')); }
            if (!on2 && tag2) { tag2.remove(); }
            return;
        }
        case 'card': {
            var sel2 = t.classList.toggle('nqf-card--selected');
            t.setAttribute('aria-pressed', String(sel2));
            return;
        }
        case 'fs': {
            var fs2 = t.closest('.nqf-fs');
            var open2 = fs2.classList.toggle('nqf-fs--active');
            t.setAttribute('aria-expanded', String(open2));
            setUse(t.querySelector('svg'), open2 ? 'nqf-i-minus20' : 'nqf-i-plus20-green');
            var body2 = fs2.querySelector('.nqf-fs-body');
            if (body2) { body2.hidden = !open2; }
            return;
        }
        case 'dd':
            // Hover は実際のホバーで表現するので、クリックでは押下フィードバックのみ
            return;
        case 'tip':
            if (tipFor === t && tipPinned) { closePop(); } else { showTip(t, true); }
            return;
        case 'showToast': {
            var node = t.parentElement.querySelector('.nqf-toast');
            if (node) { showToastNode(node); }
            return;
        }
        default:
            return;
        }
    });

    // Enter / Space で押せるように（ネイティブの button / input を除く）
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closePop(); return; }
        if (e.key !== 'Enter' && e.key !== ' ') { return; }
        var t = e.target;
        if (!t.dataset || !t.dataset.nqfAct) { return; }
        if (/^(BUTTON|INPUT|TEXTAREA|A)$/.test(t.tagName)) { return; }
        e.preventDefault();
        t.click();
    });

    annotate(document);
}());
