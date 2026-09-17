/* スタイルページ：1つのプレビューでコンポーネントとバリアントを切り替える
   - [data-nqf-play] … プレイグラウンド本体。data-comp が現在のコンポーネント
   - .nqf-play-chip[data-comp][data-spec] … コンポーネント切り替え
   - .nqf-play-props[data-comp] … そのコンポーネントのバリアント操作（現在のもののみ表示）
       .nqf-play-toggle[data-prop][data-label]     … あり / なし
       .nqf-play-seg[data-prop][data-label] button … 排他選択（button[data-value]）
   - .nqf-play-item[data-comp] … プレビュー本体（現在のもののみ表示）
       data-play-when="checkbox=on"                       … 条件を満たすときだけ表示
       data-play-class="size=md:nqf-ainput--md; ..."      … 条件を満たすときだけクラスを付与 */
(function () {
    'use strict';

    var plays = Array.prototype.slice.call(document.querySelectorAll('[data-nqf-play]'));
    if (!plays.length) { return; }

    function $(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    function esc(v) { return String(v).replace(/"/g, '\\"'); }
    /* SVG 要素では .hidden プロパティが効かないので属性で切り替える */
    function show(node, on) {
        if (on) { node.removeAttribute('hidden'); } else { node.setAttribute('hidden', ''); }
    }
    function propsRow(play, comp) { return play.querySelector('.nqf-play-props[data-comp="' + esc(comp) + '"]'); }

    /* 現在のバリアント値（{ checkbox: 'on', size: 'lg' } 形式） */
    function values(play, comp) {
        var row = propsRow(play, comp);
        var out = {};
        if (!row) { return out; }
        $('.nqf-play-toggle', row).forEach(function (b) {
            out[b.dataset.prop] = b.getAttribute('aria-pressed') === 'true' ? 'on' : 'off';
        });
        $('.nqf-play-seg', row).forEach(function (seg) {
            var on = seg.querySelector('button[aria-pressed="true"]') || seg.querySelector('button');
            out[seg.dataset.prop] = on ? on.dataset.value : '';
        });
        return out;
    }

    /* "checkbox=on" / "size=md,state=error"（カンマは AND） */
    function matches(cond, vals) {
        return String(cond).split(',').every(function (part) {
            var kv = part.split('=');
            var key = kv[0].trim();
            var want = (kv[1] || '').trim();
            return (vals[key] || '') === want;
        });
    }

    /* 見出し右の読み取り用テキスト（例：幅 672 ／ チェックボックス = あり / 備考 = なし） */
    function variantLabel(play, comp, vals) {
        var row = propsRow(play, comp);
        if (!row) { return ''; }
        var parts = [];
        $('.nqf-play-toggle, .nqf-play-seg', row).forEach(function (c) {
            var label = c.dataset.label || '';
            if (c.classList.contains('nqf-play-toggle')) {
                parts.push((label || c.dataset.prop) + ' = ' + (vals[c.dataset.prop] === 'on' ? 'あり' : 'なし'));
                return;
            }
            var on = c.querySelector('button[aria-pressed="true"]') || c.querySelector('button');
            var txt = on ? on.textContent.trim() : '';
            parts.push(label ? label + ' = ' + txt : txt);
        });
        return parts.join(' / ');
    }

    function render(play) {
        var comp = play.dataset.comp;
        var vals = values(play, comp);

        $('.nqf-play-chip', play).forEach(function (c) {
            c.setAttribute('aria-pressed', String(c.dataset.comp === comp));
        });
        $('.nqf-play-props', play).forEach(function (r) { show(r, r.dataset.comp === comp); });
        $('.nqf-play-item', play).forEach(function (i) { show(i, i.dataset.comp === comp); });

        var item = play.querySelector('.nqf-play-item[data-comp="' + esc(comp) + '"]');
        if (item) {
            $('[data-play-when]', item).forEach(function (n) {
                show(n, matches(n.dataset.playWhen, vals));
            });
            $('[data-play-class]', item).forEach(function (n) {
                n.dataset.playClass.split(';').forEach(function (rule) {
                    var i = rule.indexOf(':');
                    if (i < 0) { return; }
                    var on = matches(rule.slice(0, i).trim(), vals);
                    rule.slice(i + 1).trim().split(/\s+/).forEach(function (cls) {
                        if (cls) { n.classList.toggle(cls, on); }
                    });
                });
            });
        }

        var chip = play.querySelector('.nqf-play-chip[data-comp="' + esc(comp) + '"]');
        var name = play.querySelector('.nqf-play-name');
        var spec = play.querySelector('.nqf-play-spec');
        if (name) { name.textContent = chip ? chip.textContent.trim() : comp; }
        if (spec) {
            var size = chip && chip.dataset.spec ? chip.dataset.spec : '';
            var variant = variantLabel(play, comp, vals);
            /* 表示名は日本語なので、Figma のコンポーネント名は仕様行の先頭に添える */
            var figma = chip ? (chip.dataset.figma || chip.dataset.comp || '') : '';
            if (figma === (chip ? chip.textContent.trim() : '')) { figma = ''; }
            spec.textContent = [figma, size, variant].filter(Boolean).join(' ／ ');
        }
    }

    document.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('.nqf-play-chip, .nqf-play-toggle, .nqf-play-seg button');
        if (!t) { return; }
        var play = t.closest('[data-nqf-play]');
        if (!play) { return; }

        if (t.classList.contains('nqf-play-chip')) {
            play.dataset.comp = t.dataset.comp;
        } else if (t.classList.contains('nqf-play-toggle')) {
            t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true'));
        } else {
            $('button', t.closest('.nqf-play-seg')).forEach(function (b) {
                b.setAttribute('aria-pressed', String(b === t));
            });
        }
        render(play);
    });

    plays.forEach(function (play) {
        if (!play.dataset.comp) {
            var first = play.querySelector('.nqf-play-chip');
            play.dataset.comp = first ? first.dataset.comp : '';
        }
        render(play);
    });
}());
