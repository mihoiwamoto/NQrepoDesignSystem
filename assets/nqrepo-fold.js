/* スタイルページ：1セクション（App / Admin ブロック）の部品を1つのプレビューにまとめる
   - 既存の .btn-set（部品ごとの小見出し＋プレビュー）を読み取り、
     入力フィールドと同じプレイグラウンド（[data-nqf-play]）の形に組み替える
   - 部品 … .btn-set 単位でチップ切り替え
   - バリアント … その部品の .btn-sample（キャプション付き）を切り替え
   nqrepo-play.js が実際の切り替えを担当するので、必ずその前に読み込むこと。
   HTML 側は書き換えないので、ページの記述を直せばそのまま反映される */
(function () {
    'use strict';

    function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) { n.className = cls; }
        if (text != null) { n.textContent = text; }
        return n;
    }
    function children(node, cls) {
        return Array.prototype.filter.call(node.children, function (n) { return n.classList && n.classList.contains(cls); });
    }
    /* 見出しの部品名（サイズ span を除いた地のテキスト） */
    function groupName(g) {
        return clean(Array.prototype.filter.call(g.childNodes, function (n) { return n.nodeType === 3; })
            .map(function (n) { return n.textContent; }).join(''));
    }
    /* チップに載せる短いラベル（「（クリックで…）」などの補足は落とす） */
    function shortLabel(s) {
        return clean(String(s).replace(/（[^）]*）/g, '')) || clean(s);
    }
    /* すべてのバリアントで値が同じプロパティ（例：Size = Large）はチップから省く */
    function chipLabels(captions) {
        var rows = captions.map(function (c) {
            return shortLabel(c).split('/').map(clean).filter(Boolean);
        });
        /* 「Key = Value」だけで構成されたキャプションのときだけ分解する
           （「プロパティ1 = Default / Hover」のような1文はそのまま使う） */
        var pairsOnly = rows.every(function (tokens) {
            return tokens.length && tokens.every(function (tk) { return tk.indexOf('=') > 0; });
        });
        if (!pairsOnly) {
            return rows.map(function (tokens, j) { return tokens.join(' / ') || ('例' + (j + 1)); });
        }
        var counts = {};
        rows.forEach(function (tokens) {
            var seen = {};
            tokens.forEach(function (tk) {
                var i = tk.indexOf('=');
                if (i < 0) { return; }
                var key = clean(tk.slice(0, i));
                if (seen[key]) { return; }
                seen[key] = 1;
                counts[key] = counts[key] || {};
                counts[key][clean(tk.slice(i + 1))] = 1;
            });
        });
        var drop = {};
        Object.keys(counts).forEach(function (key) {
            if (rows.length > 1 && Object.keys(counts[key]).length === 1) { drop[key] = 1; }
        });
        return rows.map(function (tokens, j) {
            var kept = tokens.filter(function (tk) {
                var i = tk.indexOf('=');
                return i < 0 || !drop[clean(tk.slice(0, i))];
            });
            return kept.join(' / ') || tokens.join(' / ') || ('例' + (j + 1));
        });
    }

    Array.prototype.forEach.call(document.querySelectorAll('.btn-block'), function (block) {
        if (block.querySelector('[data-nqf-play]')) { return; } // 既にプレイグラウンド
        var sets = children(block, 'btn-set').filter(function (s) {
            return s.querySelector('.type-group-name') && s.querySelector('.btn-samples');
        });
        if (!sets.length) { return; }

        var play = el('div', 'btn-set nqf-play nqcard');
        play.setAttribute('data-nqf-play', '');

        var head = el('div', 'type-group-name is-play nqcard-head');
        head.appendChild(el('span', 'nqf-play-name'));
        head.appendChild(el('span', 'nqf-play-spec'));

        var card = el('div', 'btn-card nqf-canvas');
        var row = el('div', 'btn-size-row');
        var samples = el('div', 'btn-samples nqf-samples');
        row.appendChild(samples);
        card.appendChild(row);

        var bar = el('div', 'nqf-play-bar');
        var chipRow = el('div', 'nqf-play-row');
        chipRow.appendChild(el('span', 'nqf-play-legend', '部品'));
        bar.appendChild(chipRow);

        var propRows = [];
        var used = {};
        sets.forEach(function (set, i) {
            var g = set.querySelector('.type-group-name');
            var sizeSpan = g.querySelector('span');
            var label = groupName(g) || ('部品' + (i + 1));
            /* 表示は日本語の部品名、data-comp は Figma のコンポーネント名（data-figma）を使う
               （重複時のみ連番を足す） */
            var figma = clean(g.getAttribute('data-figma') || '');
            var base = figma || label;
            var comp = base;
            while (used[comp]) { comp = base + ' ' + (++used[base]); }
            used[comp] = 1;
            used[base] = used[base] || 1;

            var chip = el('button', 'nqf-play-chip', label);
            chip.type = 'button';
            chip.setAttribute('data-comp', comp);
            if (figma) { chip.setAttribute('data-figma', figma); }
            chip.setAttribute('data-spec', sizeSpan ? clean(sizeSpan.textContent) : '');
            chip.setAttribute('aria-pressed', String(i === 0));
            chipRow.appendChild(chip);

            var item = el('div', 'nqf-play-item');
            item.setAttribute('data-comp', comp);
            var src = set.querySelector('.btn-samples');
            var vars = children(src, 'btn-sample');

            if (vars.length > 1) {
                /* バリアントはチップで示すので、プレビュー内のキャプションは伏せる（CSS 側で非表示） */
                item.setAttribute('data-has-variants', '');
                var seg = el('span', 'nqf-play-seg');
                seg.setAttribute('data-prop', 'v');
                var labels = chipLabels(vars.map(function (sample) {
                    var cap = sample.querySelector('.btn-caption');
                    return cap ? cap.textContent : '';
                }));
                vars.forEach(function (sample, j) {
                    sample.setAttribute('data-play-when', 'v=v' + j);
                    item.appendChild(sample);
                    var b = el('button', '', labels[j]);
                    b.type = 'button';
                    b.setAttribute('data-value', 'v' + j);
                    b.setAttribute('aria-pressed', String(j === 0));
                    seg.appendChild(b);
                });
                var props = el('div', 'nqf-play-row nqf-play-props');
                props.setAttribute('data-comp', comp);
                props.setAttribute('hidden', '');
                props.appendChild(el('span', 'nqf-play-legend', 'バリアント'));
                props.appendChild(seg);
                propRows.push(props);
            } else {
                while (src.firstChild) { item.appendChild(src.firstChild); }
            }
            samples.appendChild(item);
        });

        if (sets.length < 2) { chipRow.classList.add('nqf-play-row--solo'); }
        propRows.forEach(function (r) { bar.appendChild(r); });
        /* 切り替えるものが何もないときは、操作パネルの体裁をやめて注記だけにする */
        if (sets.length < 2 && !propRows.length) { bar.classList.add('nqf-play-bar--bare'); }
        bar.appendChild(el('p', 'nqf-play-hint', 'プレビューはそのまま操作できます。チップで部品とバリアントを切り替えます。'));

        /* カードの並び：プレビュー → 部品名 → 操作 → アクション
           （アクションには nqrepo-code.js / nqrepo-prompt.js がボタンを差し込む） */
        play.appendChild(card);
        play.appendChild(head);
        play.appendChild(bar);
        play.appendChild(el('div', 'nqf-play-actions'));
        block.insertBefore(play, sets[0]);
        sets.forEach(function (s) { s.remove(); });
    });

    /* HTML に直接書いたプレイグラウンドも同じカードの体裁にそろえる
       （プレビュー → 部品名 → 操作 → アクション の順に並べ替える） */
    Array.prototype.forEach.call(document.querySelectorAll('[data-nqf-play]'), function (play) {
        if (play.querySelector('.nqf-play-actions')) { return; }
        play.classList.add('nqcard');
        var head = play.querySelector('.type-group-name');
        var card = play.querySelector('.btn-card');
        var bar = play.querySelector('.nqf-play-bar');
        if (head) { head.classList.add('is-play', 'nqcard-head'); }
        if (card) { play.appendChild(card); }
        if (head) { play.appendChild(head); }
        if (bar) { play.appendChild(bar); }
        play.appendChild(el('div', 'nqf-play-actions'));
    });

    /* Figma のスクリーンショットだけのブロックも、同じカードの体裁にそろえる
       （部品ごとのバリアントがないので、プレビュー＋名前＋アクションのみ） */
    Array.prototype.forEach.call(document.querySelectorAll('.btn-block'), function (block) {
        var set = block.querySelector('.btn-set:not(.nqf-play)');
        if (!set || set.querySelector('.type-group-name') || !set.querySelector('.btn-card')) { return; }
        var panel = block.closest ? block.closest('.component-detail-panel') : null;
        var h4 = panel && panel.querySelector('.component-detail-title h4');
        var name = h4 ? clean(Array.prototype.filter.call(h4.childNodes, function (n) { return n.nodeType === 3; })
            .map(function (n) { return n.textContent; }).join('')) : '';
        var h5 = block.querySelector('h5');
        var plat = h5 ? clean(h5.firstChild ? h5.firstChild.textContent : '') : '';

        set.classList.add('nqcard', 'nqcard--shot');
        var head = el('div', 'type-group-name is-play nqcard-head');
        head.appendChild(el('span', 'nqf-play-name', name || plat));
        head.appendChild(el('span', 'nqf-play-spec', plat ? plat + ' ／ Figma のスクリーンショット' : 'Figma のスクリーンショット'));
        set.appendChild(head);
        set.appendChild(el('div', 'nqf-play-actions'));
    });
}());
