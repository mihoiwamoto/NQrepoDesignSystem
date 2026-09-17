/* スタイルページ：カード下部の「コードを見る」
   - 表示中のプレビューそのものから HTML を書き出し、
     その中で使われているクラスに当たる CSS 規則をページのスタイルシートから拾う
   - 出力はページの実装をそのまま写したものなので、ページを直せばコードも追従する
   nqrepo-fold.js がカード（.nqf-play-actions）を作った後、
   nqrepo-prompt.js より前に読み込むこと（ボタンの並び順がそのまま画面の順になる） */
(function () {
    'use strict';

    var plays = Array.prototype.slice.call(document.querySelectorAll('[data-nqf-play]'));
    if (!plays.length) { return; }

    var CODE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 3 12 9 18"></polyline><polyline points="15 6 21 12 15 18"></polyline></svg>';
    var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
    /* プレビューを動かすためだけの属性・クラス（実装には不要なので落とす） */
    var DROP_ATTR = /^(data-play-when|data-play-class|data-comp|data-nqf-act|data-nqf-play|data-nqf-plat)$/;
    var DROP_CLASS = { 'btn-sample': 1, 'btn-caption': 1, 'nqf-play-item': 1 };

    function esc(v) { return String(v).replace(/"/g, '\\"'); }
    function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

    /* ---------- 表示中のプレビューを取り出す ---------- */
    function currentItem(play) {
        var comp = play.getAttribute('data-comp') || '';
        return play.querySelector('.nqf-play-item[data-comp="' + esc(comp) + '"]') || play.querySelector('.nqf-play-item');
    }
    /* いま画面に出ている部分だけを集める（hidden のバリアントは含めない）。
       .btn-sample はページ上で例を並べるための囲みなので、中身だけを取り出す */
    function visibleNodes(item) {
        var out = [];
        Array.prototype.forEach.call(item.children, function (n) {
            if (n.hasAttribute('hidden')) { return; }
            if (n.classList.contains('btn-sample')) {
                Array.prototype.forEach.call(n.children, function (c) {
                    if (!c.hasAttribute('hidden') && !c.classList.contains('btn-caption')) { out.push(c); }
                });
                return;
            }
            out.push(n);
        });
        return out;
    }
    function sanitize(node) {
        var clone = node.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll('[hidden], .btn-caption'), function (n) { n.remove(); });
        walk(clone);
        return clone;
    }
    function walk(node) {
        if (node.nodeType !== 1) { return; }
        Array.prototype.slice.call(node.attributes).forEach(function (a) {
            if (DROP_ATTR.test(a.name)) { node.removeAttribute(a.name); return; }
            if (a.name === 'src' && a.value.indexOf('data:') === 0) { node.setAttribute('src', 'data:…（画像は省略）'); }
        });
        if (node.classList) {
            Object.keys(DROP_CLASS).forEach(function (c) { node.classList.remove(c); });
            if (!node.getAttribute('class')) { node.removeAttribute('class'); }
        }
        Array.prototype.forEach.call(node.childNodes, walk);
    }

    /* ---------- HTML の書き出し ---------- */
    function openTag(node) {
        var name = node.nodeName.toLowerCase();
        var at = Array.prototype.map.call(node.attributes, function (a) {
            return ' ' + a.name + '="' + String(a.value).replace(/"/g, '&quot;') + '"';
        }).join('');
        return '<' + name + at + '>';
    }
    function textOnly(node) {
        return Array.prototype.every.call(node.childNodes, function (n) { return n.nodeType === 3; });
    }
    function serialize(node, depth, out) {
        var pad = new Array(depth + 1).join('  ');
        if (node.nodeType === 3) {
            var t = clean(node.textContent);
            if (t) { out.push(pad + t); }
            return;
        }
        if (node.nodeType !== 1) { return; }
        var name = node.nodeName.toLowerCase();
        if (VOID[name]) { out.push(pad + openTag(node)); return; }
        /* SVG は中身が長くなるだけなので1行にまとめる */
        if (name === 'svg') { out.push(pad + clean(node.outerHTML)); return; }
        if (!node.childNodes.length) { out.push(pad + openTag(node) + '</' + name + '>'); return; }
        if (textOnly(node)) {
            out.push(pad + openTag(node) + clean(node.textContent) + '</' + name + '>');
            return;
        }
        out.push(pad + openTag(node));
        Array.prototype.forEach.call(node.childNodes, function (n) { serialize(n, depth + 1, out); });
        out.push(pad + '</' + name + '>');
    }
    function htmlOf(nodes) {
        var out = [];
        nodes.forEach(function (n) { serialize(n, 0, out); });
        return out.join('\n') + '\n';
    }

    /* ---------- 使われているクラスに当たる CSS を集める ---------- */
    function classesIn(nodes) {
        var set = {};
        nodes.forEach(function (root) {
            var all = [root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));
            all.forEach(function (n) {
                var cls = n.getAttribute && n.getAttribute('class');
                if (!cls) { return; }
                /* SVG では class が SVGAnimatedString なので文字列として扱う */
                String(cls.baseVal != null ? cls.baseVal : cls).split(/\s+/).forEach(function (c) { if (c) { set[c] = 1; } });
            });
        });
        return set;
    }
    /* セレクタに出てくるクラスがすべて使われているものなら採用する
       （.btn-card .nqf-x のようなページ側の囲みルールを持ち込まないため） */
    function selectorWanted(sel, used) {
        var found = sel.match(/\.[A-Za-z_][-\w]*/g);
        if (!found) { return false; }
        var hit = false;
        for (var i = 0; i < found.length; i++) {
            var c = found[i].slice(1);
            if (!used[c]) { return false; }
            hit = true;
        }
        return hit;
    }
    /* ブラウザが書き戻した値を、デザインシステムの表記に近づける
       （色は 16 進、animation: none は元の書き方に戻す） */
    function hex(n) { var s = Number(n).toString(16); return s.length < 2 ? '0' + s : s; }
    function tidy(css) {
        return clean(css)
            .replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, function (m, r, g, b) { return '#' + hex(r) + hex(g) + hex(b); })
            .replace(/animation: auto ease 0s 1 normal none running none/g, 'animation: none');
    }
    function rulesFrom(list, used, out) {
        Array.prototype.forEach.call(list, function (rule) {
            if (rule.type === 4 /* @media */) {
                var inner = [];
                rulesFrom(rule.cssRules || [], used, inner);
                if (inner.length) { out.push('@media ' + rule.conditionText + ' {\n' + inner.map(function (r) { return '    ' + r; }).join('\n') + '\n}'); }
                return;
            }
            if (rule.type !== 1 /* style */ || !rule.selectorText) { return; }
            var sels = rule.selectorText.split(',').map(clean).filter(function (s) { return selectorWanted(s, used); });
            if (!sels.length) { return; }
            out.push(sels.join(', ') + ' { ' + tidy(rule.style.cssText) + ' }');
        });
    }
    /* :root で定義した変数のうち、拾った CSS から参照されているものだけ先頭に添える */
    function rootVars(css) {
        var names = {};
        (css.match(/var\(--[-\w]+/g) || []).forEach(function (m) { names[m.slice(4)] = 1; });
        if (!Object.keys(names).length) { return ''; }
        var defs = [];
        eachStyleRule(function (rule) {
            if (clean(rule.selectorText) !== ':root') { return; }
            Array.prototype.forEach.call(rule.style, function (prop) {
                if (names[prop]) { defs.push('    ' + prop + ': ' + tidy(rule.style.getPropertyValue(prop)) + ';'); }
            });
        });
        return defs.length ? ':root {\n' + defs.join('\n') + '\n}\n\n' : '';
    }
    function eachStyleRule(fn) {
        Array.prototype.forEach.call(document.styleSheets, function (sheet) {
            var rules;
            try { rules = sheet.cssRules; } catch (e) { return; } // 別オリジン（Google Fonts など）は読めない
            if (!rules) { return; }
            Array.prototype.forEach.call(rules, function (r) { if (r.type === 1 && r.selectorText) { fn(r); } });
        });
    }
    function cssOf(nodes) {
        var used = classesIn(nodes);
        var out = [];
        Array.prototype.forEach.call(document.styleSheets, function (sheet) {
            var rules;
            try { rules = sheet.cssRules; } catch (e) { return; }
            if (rules) { rulesFrom(rules, used, out); }
        });
        var css = out.join('\n');
        return css ? rootVars(css) + css + '\n' : '/* このプレビューに対応する CSS 規則は見つかりませんでした。 */\n';
    }

    /* ---------- ダイアログ ---------- */
    function build(el, cls, text) {
        var n = document.createElement(el);
        if (cls) { n.className = cls; }
        if (text != null) { n.textContent = text; }
        return n;
    }
    function copyText(text, btn) {
        var label = btn.textContent;
        function done(ok) {
            btn.textContent = ok ? 'コピーしました' : 'コピーできません';
            clearTimeout(btn._t);
            btn._t = setTimeout(function () { btn.textContent = label; }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
            return;
        }
        var ta = build('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ta.remove();
        done(ok);
    }
    function openDialog(title, html, css, note) {
        var tabs = [
            { key: 'html', label: 'HTML', text: html },
            { key: 'css', label: 'CSS', text: css }
        ];
        var dlg = build('div', 'nqc-dialog');
        dlg.setAttribute('role', 'dialog');
        dlg.setAttribute('aria-modal', 'true');
        dlg.setAttribute('aria-label', title + ' のコード');

        var box = build('div', 'nqc-box');
        var head = build('div', 'nqc-head');
        head.appendChild(build('h6', '', title + ' のコード'));
        var close = build('button', 'nqc-close', '閉じる');
        close.type = 'button';
        head.appendChild(close);

        var tabRow = build('div', 'nqc-tabs');
        var copyBtn = build('button', 'nqc-copy', 'コピー');
        copyBtn.type = 'button';
        var pre = build('pre', 'nqc-pre');
        var code = build('code');
        pre.appendChild(code);

        var current = tabs[0];
        function select(t) {
            current = t;
            code.textContent = t.text;
            pre.scrollTop = 0;
            Array.prototype.forEach.call(tabRow.children, function (b) {
                b.setAttribute('aria-pressed', String(b.dataset.key === t.key));
            });
        }
        tabs.forEach(function (t) {
            var b = build('button', 'nqc-tab', t.label);
            b.type = 'button';
            b.dataset.key = t.key;
            b.addEventListener('click', function () { select(t); });
            tabRow.appendChild(b);
        });
        copyBtn.addEventListener('click', function () { copyText(current.text, copyBtn); });

        var bar = build('div', 'nqc-bar');
        bar.appendChild(tabRow);
        bar.appendChild(copyBtn);

        box.appendChild(head);
        if (note) { box.appendChild(build('p', 'nqc-note', note)); }
        box.appendChild(bar);
        box.appendChild(pre);
        dlg.appendChild(box);

        function remove() { dlg.remove(); document.removeEventListener('keydown', onKey); }
        function onKey(e) { if (e.key === 'Escape') { remove(); } }
        close.addEventListener('click', remove);
        dlg.addEventListener('click', function (e) { if (e.target === dlg) { remove(); } });
        document.addEventListener('keydown', onKey);
        document.body.appendChild(dlg);
        select(tabs[0]);
        close.focus();
    }

    /* ---------- 設置 ---------- */
    plays.forEach(function (play) {
        var slot = play.querySelector('.nqf-play-actions');
        if (!slot) { return; }
        var btn = build('button', 'nqf-act nqf-act--ghost nqc-open');
        btn.type = 'button';
        btn.innerHTML = CODE_ICON + '<span>コードを見る</span>';

        function currentName() {
            var chip = play.querySelector('.nqf-play-chip[data-comp="' + esc(play.getAttribute('data-comp') || '') + '"]');
            var name = play.querySelector('.nqf-play-name');
            return clean(chip ? chip.textContent : (name ? name.textContent : '部品'));
        }
        function sync() {
            btn.title = '「' + currentName() + '」の表示中のプレビューの HTML と CSS を見る';
            btn.setAttribute('aria-label', currentName() + ' のコードを見る');
        }
        sync();
        if (window.MutationObserver) {
            new MutationObserver(sync).observe(play, { attributes: true, attributeFilter: ['data-comp'] });
        }

        btn.addEventListener('click', function () {
            var item = currentItem(play);
            if (!item) { return; }
            var nodes = visibleNodes(item).map(sanitize);
            if (!nodes.length) { return; }
            var note = 'いま表示しているバリアントの実装です。'
                + (item.querySelector('use') ? 'アイコンはページ先頭の SVG スプライト（#nqi-*）を参照しています。' : '');
            openDialog(currentName(), htmlOf(nodes), cssOf(nodes), note);
        });
        slot.appendChild(btn);
    });
}());
