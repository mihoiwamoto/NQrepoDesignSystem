/* スタイルページ：実装用プロンプトのコピーボタンを置く
   - プレビュー見出し右端（.type-group-name）… 入力スペースなど部品ひとつ分だけのプロンプト。
       プレイグラウンド（nqrepo-fold.js が組み替えたものを含む）は選択中の部品が対象
   - 部品に分かれていない（スクリーンショットのみ）ブロック … App / Admin 単位
   プロンプトはパネル内の仕様（概要・btn-note・バリアント表・サイズ・キャプション）から生成するので、
   ページの記述を更新すればプロンプトも追従する */
(function () {
    'use strict';

    var panels = Array.prototype.slice.call(document.querySelectorAll('.component-detail-panel[data-scope="common"], .component-detail-panel[data-scope="app"], .component-detail-panel[data-scope="admin"]'));
    if (!panels.length) { return; }

    var SCOPE_LABEL = {
        common: 'App + Admin 共通（アプリ・管理画面の両方で使用）',
        app: 'App のみ（タブレット向けアプリ）',
        admin: 'Admin のみ（PC 向け管理画面）'
    };
    var PLATFORM_NOTE = {
        app: 'App（アプリ向け）',
        admin: 'Admin（管理画面向け）'
    };
    var TOKENS = [
        'text/primary `#333333`、text/secondary `#808080`',
        'brand/primary `#009944`、brand/danger `#f34949`',
        'status/success `#19c95f`、status/error `#f85c5c`、status/caution `#dcaa14`、status/done `#4b9ff8`',
        'border/default `#d0d0d0`、background/surface `#ffffff`、background/page `#f1efea`、background/canvas `#f8f8f8`',
        'フォント: Hiragino Kaku Gothic ProN（見出し・ラベルは W6 = 600、本文は W3 = 300）'
    ];
    var REQUIREMENTS = [
        '上記の寸法・角丸・余白・色・タイポグラフィを忠実に再現してください。',
        'バリアント（State / Size / Type など）はプロパティで切り替えられる構造にし、記載のすべての組み合わせを網羅してください。',
        '入力・選択・開閉などの操作は、ネイティブ要素または適切な role / aria 属性で実装し、キーボード操作とフォーカス表示（brand/primary の枠線）に対応してください。',
        'Default / Hover / Focus / Error / Disabled などの状態は、実際の操作で遷移するようにしてください。',
        '色や寸法はハードコードせず、デザイントークン（変数）として定義して参照してください。'
    ];

    /* ---------- DOM → テキスト ---------- */
    function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
    function richText(el) {
        // <code> をバッククォートに、<br> を改行にして読み取る
        if (!el) { return ''; }
        var out = '';
        Array.prototype.forEach.call(el.childNodes, function (n) {
            if (n.nodeType === 3) { out += n.textContent; }
            else if (n.nodeName === 'CODE') { out += '`' + clean(n.textContent) + '`'; }
            else if (n.nodeName === 'BR') { out += '\n'; }
            else { out += richText(n); }
        });
        return out;
    }
    function lines(el) {
        return richText(el).split('\n').map(clean).filter(Boolean);
    }
    function titleOf(panel) {
        var h4 = panel.querySelector('.component-detail-title h4');
        var en = h4 && h4.querySelector('.eyebrow-soft');
        var ja = h4 ? clean(Array.prototype.filter.call(h4.childNodes, function (n) { return n.nodeType === 3; }).map(function (n) { return n.textContent; }).join('')) : '';
        return { ja: ja, en: en ? clean(en.textContent) : '' };
    }
    /* 見出しの部品名（サイズ span や後から挿し込んだボタンを除いた地のテキスト） */
    function groupName(g) {
        return clean(Array.prototype.filter.call(g.childNodes, function (n) { return n.nodeType === 3; })
            .map(function (n) { return n.textContent; }).join(''));
    }
    function blockInfo(block) {
        var h5 = block.querySelector('h5');
        var eyebrow = h5 && h5.querySelector('.eyebrow-soft');
        var plat = block.getAttribute('data-nqf-plat') || clean(h5 ? h5.firstChild.textContent : '').toLowerCase();
        var info = {
            plat: plat,
            label: PLATFORM_NOTE[plat] || clean(h5 ? h5.firstChild.textContent : ''),
            eyebrow: eyebrow ? clean(eyebrow.textContent) : '',
            note: lines(block.querySelector('.btn-note')).join('\n'),
            sets: [],
            sizes: [],
            comps: '',
            imageOnly: !!block.querySelector('.cat-shot') && !block.querySelector('.type-group-name')
        };
        Array.prototype.forEach.call(block.querySelectorAll('.cat-table tbody tr'), function (tr) {
            var td = tr.querySelectorAll('td');
            if (td.length < 2) { return; }
            info.sets.push({ name: clean(td[0].textContent), props: lines(td[1]), count: td[2] ? clean(td[2].textContent) : '' });
        });
        Array.prototype.forEach.call(block.querySelectorAll('.type-group-name:not(.is-play)'), function (g) {
            var span = g.querySelector('span');
            info.sizes.push({ name: groupName(g), size: span ? clean(span.textContent) : '' });
        });
        // プレイグラウンド（1つのプレビューで切り替える項目）は部品チップから読み取る
        Array.prototype.forEach.call(block.querySelectorAll('.nqf-play-chip'), function (chip) {
            info.sizes.push({ name: clean(chip.textContent), size: clean(chip.getAttribute('data-spec') || '') });
        });
        var comps = block.querySelector('.cat-comps');
        if (comps) {
            var head = comps.querySelector('span');
            info.comps = clean(Array.prototype.filter.call(comps.childNodes, function (n) { return n !== head; }).map(function (n) { return n.textContent; }).join(''));
            info.compsHead = head ? clean(head.textContent) : '単体コンポーネント';
        }
        return info;
    }
    function blockSection(info) {
        var s = [];
        s.push('## ' + info.label + (info.eyebrow ? ' — ' + info.eyebrow : ''));
        if (info.imageOnly) {
            s.push('');
            s.push('この項目はスタイルページには Figma のスクリーンショットのみ掲載されています。寸法・色の詳細は Figma「NQrepo UI Kit」の該当コンポーネントを参照し、下記の共通トークンに従って実装してください。');
            if (info.note) { s.push(''); s.push(info.note); }
        } else if (info.note) {
            s.push('');
            s.push('### 仕様');
            s.push(info.note);
        }
        if (info.sets.length) {
            s.push('');
            s.push('### コンポーネントセットとバリアント');
            info.sets.forEach(function (set) {
                s.push('- ' + set.name + (set.count ? '（' + set.count + ' バリアント）' : ''));
                set.props.forEach(function (p) { s.push('  - ' + p); });
            });
        }
        if (info.sizes.length) {
            s.push('');
            s.push('### 構成要素とサイズ');
            info.sizes.forEach(function (z) { s.push('- ' + z.name + (z.size ? ': ' + z.size : '')); });
        }
        if (info.comps) {
            s.push('');
            s.push('### ' + info.compsHead);
            s.push(info.comps);
        }
        return s.join('\n');
    }
    function buildPrompt(panel, onlyBlock) {
        var t = titleOf(panel);
        var scope = panel.getAttribute('data-scope');
        var blocks = Array.prototype.slice.call(panel.querySelectorAll('.btn-block'));
        if (onlyBlock) { blocks = [onlyBlock]; }
        var infos = blocks.map(blockInfo);
        var target = onlyBlock ? (PLATFORM_NOTE[infos[0].plat] || infos[0].label) : (SCOPE_LABEL[scope] || scope);

        var out = [];
        out.push('# NQrepo デザインシステム：' + t.ja + (t.en ? '（' + t.en + '）' : '') + ' の実装');
        out.push('');
        out.push('あなたはフロントエンドエンジニアです。以下の仕様に従って、NQrepo デザインシステムの「' + t.ja + '」コンポーネントを実装してください。');
        out.push('');
        out.push('- 対象: ' + target);
        out.push('- 参照: Figma「NQrepo UI Kit」／ NQrepo Design System スタイルページ「' + t.ja + '」');
        var desc = clean(panel.querySelector('.component-detail-desc') ? panel.querySelector('.component-detail-desc').textContent : '');
        if (desc) {
            out.push('');
            out.push('## 概要');
            out.push(desc);
        }
        infos.forEach(function (info) {
            out.push('');
            out.push(blockSection(info));
        });
        out.push('');
        out.push('## デザイントークン（共通）');
        TOKENS.forEach(function (tk) { out.push('- ' + tk); });
        out.push('');
        out.push('## 実装要件');
        REQUIREMENTS.forEach(function (r) { out.push('- ' + r); });
        out.push('');
        out.push('実装後は、記載したバリアントごとの見た目と状態遷移を一覧で確認できるサンプル（ストーリー／デモ画面）も用意してください。');
        return out.join('\n') + '\n';
    }

    /* ---------- コピー ---------- */
    var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 12.5 9.5 18 20 7"></polyline></svg>';

    function flash(btn, ok) {
        var label = btn.querySelector('span');
        var original = label.textContent;
        btn.classList.add(ok ? 'is-done' : 'is-error');
        btn.querySelector('svg').outerHTML = ok ? CHECK : ICON;
        label.textContent = ok ? 'コピーしました' : 'コピーできません';
        btn.setAttribute('aria-live', 'polite');
        clearTimeout(btn._t);
        btn._t = setTimeout(function () {
            btn.classList.remove('is-done', 'is-error');
            btn.querySelector('svg').outerHTML = ICON;
            label.textContent = original;
        }, 1600);
    }
    function legacyCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ta.remove();
        return ok;
    }
    function showManualDialog(text, title) {
        var dlg = document.createElement('div');
        dlg.className = 'nqp-dialog';
        dlg.setAttribute('role', 'dialog');
        dlg.setAttribute('aria-modal', 'true');
        dlg.setAttribute('aria-label', title + ' のプロンプト');
        var box = document.createElement('div');
        box.className = 'nqp-dialog-box';
        var head = document.createElement('div');
        head.className = 'nqp-dialog-head';
        var h6 = document.createElement('h6'); h6.textContent = title + ' のプロンプト';
        var close = document.createElement('button'); close.type = 'button'; close.className = 'nqp-dialog-close'; close.textContent = '閉じる';
        head.appendChild(h6); head.appendChild(close);
        var note = document.createElement('p'); note.className = 'nqp-dialog-note';
        note.textContent = 'この環境ではクリップボードに書き込めませんでした。下のテキストを選択してコピーしてください。';
        var ta = document.createElement('textarea'); ta.value = text; ta.readOnly = true;
        box.appendChild(head); box.appendChild(note); box.appendChild(ta);
        dlg.appendChild(box);
        function remove() { dlg.remove(); document.removeEventListener('keydown', onKey); }
        function onKey(e) { if (e.key === 'Escape') { remove(); } }
        close.addEventListener('click', remove);
        dlg.addEventListener('click', function (e) { if (e.target === dlg) { remove(); } });
        document.addEventListener('keydown', onKey);
        document.body.appendChild(dlg);
        ta.focus(); ta.select(); ta.scrollTop = 0;
    }
    function copy(text, btn, title) {
        function fallback() {
            if (legacyCopy(text)) { flash(btn, true); }
            else { flash(btn, false); showManualDialog(text, title); }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            // フォーカスのないタブなどでは Promise が返ってこないことがあるため、一定時間で見切ってフォールバックする
            var settled = false;
            var timer = setTimeout(function () { if (!settled) { settled = true; fallback(); } }, 900);
            navigator.clipboard.writeText(text).then(function () {
                if (settled) { return; }
                settled = true; clearTimeout(timer); flash(btn, true);
            }, function () {
                if (settled) { return; }
                settled = true; clearTimeout(timer); fallback();
            });
        } else {
            fallback();
        }
    }
    function makeButton(label, small, title) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'nqp-copy' + (small ? ' nqp-copy--sm' : '');
        b.innerHTML = ICON + '<span></span>';
        b.querySelector('span').textContent = label;
        b.title = title;
        return b;
    }
    /* カード下部のアクション欄に置く塗りつぶしボタン（幅いっぱい） */
    function makeActionButton(label, title) {
        var b = makeButton(label, false, title);
        b.className = 'nqp-copy nqp-copy--block nqf-act nqf-act--solid';
        return b;
    }

    /* ---------- 部品（入力スペースなど）単位 ---------- */
    function normName(s) { return clean(s).replace(/\s+/g, '').toLowerCase(); }

    /* その部品に対応するバリアント表の行を探す（名前または Figma 名で一致） */
    function tableRowFor(block, names) {
        var keys = names.filter(Boolean).map(normName);
        var found = null;
        Array.prototype.forEach.call(block.querySelectorAll('.cat-table tbody tr'), function (tr) {
            if (found) { return; }
            var td = tr.querySelectorAll('td');
            if (td.length < 2) { return; }
            if (keys.indexOf(normName(td[0].textContent)) < 0) { return; }
            found = { name: clean(td[0].textContent), props: lines(td[1]), count: td[2] ? clean(td[2].textContent) : '' };
        });
        return found;
    }

    /* ブロック内の部品一覧。プレイグラウンドは部品チップ、それ以外は .btn-set 単位 */
    function partsOf(block) {
        var out = [];
        var play = block.querySelector('[data-nqf-play]');
        if (play) {
            Array.prototype.forEach.call(play.querySelectorAll('.nqf-play-chip'), function (chip) {
                out.push({
                    kind: 'play', play: play, chip: chip,
                    comp: clean(chip.getAttribute('data-comp') || ''),
                    name: clean(chip.textContent),
                    size: clean(chip.getAttribute('data-spec') || '')
                });
            });
            return out;
        }
        Array.prototype.forEach.call(block.querySelectorAll('.btn-set'), function (set) {
            var g = set.querySelector('.type-group-name');
            if (!g) { return; }
            var span = g.querySelector('span');
            var name = groupName(g);
            if (!name) { return; }
            out.push({ kind: 'set', set: set, head: g, comp: '', name: name, size: span ? clean(span.textContent) : '' });
        });
        return out;
    }

    /* プレイグラウンドのバリアント操作を「ラベル = 値 / 値」の形に読み取る */
    function playVariants(part) {
        var row = part.play.querySelector('.nqf-play-props[data-comp="' + (part.comp || '').replace(/"/g, '\\"') + '"]');
        if (!row) { return []; }
        var out = [];
        Array.prototype.forEach.call(row.querySelectorAll('.nqf-play-toggle, .nqf-play-seg'), function (c) {
            var label = clean(c.getAttribute('data-label') || '');
            if (c.classList.contains('nqf-play-toggle')) { out.push((label || clean(c.getAttribute('data-prop'))) + ' = なし / あり'); return; }
            var vals = Array.prototype.map.call(c.querySelectorAll('button'), function (b) { return clean(b.textContent); }).filter(Boolean);
            if (vals.length) { out.push(label ? label + ' = ' + vals.join(' / ') : vals.join(' / ')); }
        });
        return out;
    }

    /* サンプルに添えたキャプション（= 掲載している状態の一覧） */
    function captionsOf(part) {
        var scope = part.kind === 'set' ? part.set : part.play.querySelector('.nqf-play-item[data-comp="' + (part.comp || '').replace(/"/g, '\\"') + '"]');
        if (!scope) { return []; }
        return Array.prototype.map.call(scope.querySelectorAll('.btn-caption'), function (c) { return clean(c.textContent); }).filter(Boolean);
    }

    function buildPartPrompt(panel, block, part) {
        var t = titleOf(panel);
        var info = blockInfo(block);
        var platform = PLATFORM_NOTE[info.plat] || info.label || (SCOPE_LABEL[panel.getAttribute('data-scope')] || '');
        var row = tableRowFor(block, [part.name, part.comp, (part.comp || '').split('/')[0]]);
        var variants = part.kind === 'play' ? playVariants(part) : [];
        var captions = captionsOf(part);

        var out = [];
        out.push('# NQrepo デザインシステム：' + t.ja + ' / ' + part.name + ' の実装');
        out.push('');
        out.push('あなたはフロントエンドエンジニアです。NQrepo デザインシステムの「' + t.ja + '」のうち、部品「' + part.name + '」だけを実装してください。');
        out.push('');
        out.push('- 対象: ' + platform);
        out.push('- 部品: ' + part.name + (part.comp && normName(part.comp) !== normName(part.name) ? '（Figma コンポーネント名: ' + part.comp + '）' : '') + (part.size ? ' ／ ' + part.size : ''));
        out.push('- 参照: Figma「NQrepo UI Kit」／ NQrepo Design System スタイルページ「' + t.ja + '」');

        out.push('');
        out.push('## この部品の仕様');
        if (part.size) { out.push('- サイズ: ' + part.size); }
        if (row && row.count) { out.push('- バリアント数: ' + row.count); }
        if (row && row.props.length) {
            out.push('');
            out.push('### バリアント');
            row.props.forEach(function (p) { out.push('- ' + p); });
        } else if (variants.length) {
            out.push('');
            out.push('### バリアント');
            variants.forEach(function (v) { out.push('- ' + v); });
        }
        if (captions.length) {
            out.push('');
            out.push('### スタイルページに掲載している状態');
            captions.forEach(function (c) { out.push('- ' + c); });
        }

        if (info.note) {
            out.push('');
            out.push('## 「' + t.ja + '」（' + (PLATFORM_NOTE[info.plat] ? info.plat.toUpperCase() : platform) + '）共通の仕様');
            out.push(info.note);
            out.push('');
            out.push('※ 上記は項目全体の記述です。この部品に関係する寸法・色・タイポグラフィだけを適用してください。');
        }
        if (info.imageOnly) {
            out.push('');
            out.push('寸法・色の詳細は Figma「NQrepo UI Kit」の該当コンポーネントを参照し、下記の共通トークンに従って実装してください。');
        }

        out.push('');
        out.push('## デザイントークン（共通）');
        TOKENS.forEach(function (tk) { out.push('- ' + tk); });
        out.push('');
        out.push('## 実装要件');
        REQUIREMENTS.forEach(function (r) { out.push('- ' + r); });
        out.push('- この部品だけを単体で使える形（1コンポーネント）として実装し、同じ項目の他の部品は含めないでください。');
        out.push('');
        out.push('実装後は、記載したバリアントごとの見た目と状態遷移を一覧で確認できるサンプル（ストーリー／デモ画面）も用意してください。');
        return out.join('\n') + '\n';
    }

    /* ---------- 設置 ---------- */
    panels.forEach(function (panel) {
        var t = titleOf(panel);
        var blocks = Array.prototype.slice.call(panel.querySelectorAll('.btn-block'));
        blocks.forEach(function (block) {
            var info = blockInfo(block);
            var name = info.plat === 'admin' ? 'Admin' : 'App';
            var parts = partsOf(block);

            if (parts.length) {
                addPartButtons(panel, block, parts, t, name);
                return;
            }
            /* 部品に分かれていない（Figma のスクリーンショットだけ等）ブロックは、プラットフォーム単位で。
               nqrepo-fold.js がカードのアクション欄を作っていればそこへ、なければ小見出しの右端へ */
            var slot2 = block.querySelector('.nqcard--shot .nqf-play-actions');
            var sb, head2;
            if (slot2) {
                sb = makeActionButton('プロンプトをコピー', '「' + t.ja + '」の ' + name + ' 部分の実装用プロンプトをコピー');
                head2 = slot2;
            } else {
                var h5 = block.querySelector('h5');
                if (!h5) { return; }
                head2 = document.createElement('div');
                head2.className = 'nqp-head';
                h5.parentNode.insertBefore(head2, h5);
                head2.appendChild(h5);
                sb = makeButton('プロンプトをコピー', true, '「' + t.ja + '」の ' + name + ' 部分の実装用プロンプトをコピー');
            }
            sb.setAttribute('aria-label', t.ja + ' の ' + name + ' 向けプロンプトをコピー');
            sb.addEventListener('click', function () { copy(buildPrompt(panel, block), sb, t.ja + '（' + name + '）'); });
            head2.appendChild(sb);
        });
    });

    /* 部品ごとのコピーボタン。プレイグラウンドは見出しに1つ置き、選択中の部品を対象にする */
    function addPartButtons(panel, block, parts, t, platName) {
        if (parts[0].kind === 'play') {
            var play = parts[0].play;
            var slot = play.querySelector('.nqf-play-actions');
            var head = slot || play.querySelector('.type-group-name.is-play') || play.querySelector('.type-group-name');
            if (!head) { return; }
            var pb = slot ? makeActionButton('プロンプトをコピー', '') : makeButton('プロンプトをコピー', true, '');
            if (!slot) { pb.className += ' nqp-copy--part'; }
            function current() {
                var comp = play.getAttribute('data-comp');
                var hit = null;
                parts.forEach(function (p) { if (!hit && p.comp === comp) { hit = p; } });
                return hit || parts[0];
            }
            function sync() {
                var p = current();
                pb.title = '「' + p.name + '」（' + platName + '）だけの実装用プロンプトをコピー';
                pb.setAttribute('aria-label', t.ja + ' の ' + p.name + '（' + platName + '）のプロンプトをコピー');
            }
            sync();
            if (window.MutationObserver) {
                new MutationObserver(sync).observe(play, { attributes: true, attributeFilter: ['data-comp'] });
            }
            pb.addEventListener('click', function () {
                var p = current();
                copy(buildPartPrompt(panel, block, p), pb, t.ja + ' / ' + p.name);
            });
            head.appendChild(pb);
            return;
        }
        parts.forEach(function (p) {
            var b = makeButton('プロンプトをコピー', true, '「' + p.name + '」（' + platName + '）だけの実装用プロンプトをコピー');
            b.className += ' nqp-copy--part';
            b.setAttribute('aria-label', t.ja + ' の ' + p.name + '（' + platName + '）のプロンプトをコピー');
            b.addEventListener('click', function () { copy(buildPartPrompt(panel, block, p), b, t.ja + ' / ' + p.name); });
            p.head.appendChild(b);
        });
    }

    // 他スクリプトから利用できるように公開（デバッグ・検証用）
    window.NQ_PROMPT = { build: buildPrompt, buildPart: buildPartPrompt, parts: partsOf };
}());
