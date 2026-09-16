// NQrepo Design System — スタイルページ用スクリプト（アイコンギャラリー / モーダル / タブ）

// --- アイコンギャラリーとモーダル ---
(function () {
    var grid = document.getElementById('iconGalleryGrid');
    var search = document.getElementById('iconGallerySearch');
    if (!grid) return;

    NQ_ICONS.forEach(function (icon) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'icon-gallery-item';
        btn.dataset.slug = icon.slug;
        btn.innerHTML = '<span class="icon-gallery-glyph">' + icon.markup + '</span>' +
            '<span class="icon-gallery-label">' + icon.ja + '</span>';
        btn.addEventListener('click', function () { openIconModal(icon); });
        grid.appendChild(btn);
    });

    if (search) {
        search.addEventListener('input', function () {
            var q = search.value.trim().toLowerCase();
            var items = grid.querySelectorAll('.icon-gallery-item');
            var visible = 0;
            items.forEach(function (item, i) {
                var icon = NQ_ICONS[i];
                var hit = !q || icon.ja.toLowerCase().indexOf(q) !== -1 ||
                    icon.en.toLowerCase().indexOf(q) !== -1 ||
                    icon.slug.toLowerCase().indexOf(q) !== -1;
                item.style.display = hit ? '' : 'none';
                if (hit) visible++;
            });
            var empty = grid.querySelector('.icon-gallery-empty');
            if (!visible && !empty) {
                empty = document.createElement('div');
                empty.className = 'icon-gallery-empty';
                empty.textContent = '一致するアイコンが見つかりません';
                grid.appendChild(empty);
            } else if (visible && empty) {
                empty.remove();
            }
        });
    }

    var overlay = document.getElementById('iconModalOverlay');
    var titleEl = document.getElementById('iconModalTitle');
    var slugEl = document.getElementById('iconModalSlug');
    var previewEl = document.getElementById('iconModalPreview');
    var codeEl = document.getElementById('iconModalCode');
    var codeBox = document.querySelector('.icon-modal-code-box');
    var ctaLabel = document.getElementById('iconModalCtaLabel');
    var ctaCopyIcon = document.getElementById('iconModalCtaCopyIcon');
    var ctaDownloadIcon = document.getElementById('iconModalCtaDownloadIcon');
    var swatchWrap = document.getElementById('iconModalSwatches');
    var colorPicker = document.getElementById('iconModalColorPicker');
    var pickerPanel = document.getElementById('iconModalPickerPanel');
    var pickerSv = document.getElementById('iconModalPickerSv');
    var pickerSvThumb = document.getElementById('iconModalPickerSvThumb');
    var pickerHue = document.getElementById('iconModalPickerHue');
    var pickerHueThumb = document.getElementById('iconModalPickerHueThumb');
    var pickerChip = document.getElementById('iconModalPickerChip');
    var hexInput = document.getElementById('iconModalHexInput');
    var sizeWrap = document.getElementById('iconModalSizes');
    var sizeInput = document.getElementById('iconModalSizeInput');
    var tabs2 = document.querySelectorAll('.icon-modal-tab');

    var COLORS = [
        { value: null, label: 'テーマに追従（currentColor）' },
        { value: '#0A1712', label: 'インク' },
        { value: '#009944', label: 'グリーン' },
        { value: '#3F8DE0', label: 'ブルー' },
        { value: '#E13F3F', label: 'レッド' },
        { value: '#FDB045', label: 'オレンジ' },
        { value: '#FFFFFF', label: 'ホワイト' }
    ];
    var SIZES = [16, 24, 32, 48, 64];
    var MIN_SIZE = 8;
    var MAX_SIZE = 512;
    var DEFAULT_SIZE = 64;

    var currentIcon = null;
    var currentTab = 'svg';
    var iconColor = null;
    var iconSize = DEFAULT_SIZE;
    var pngToken = 0;

    COLORS.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'icon-modal-swatch' + (c.value ? '' : ' is-auto');
        b.title = c.label;
        b.setAttribute('aria-label', c.label);
        b.dataset.value = c.value || '';
        if (c.value) b.style.background = c.value;
        b.addEventListener('click', function () { setColor(c.value); });
        swatchWrap.insertBefore(b, colorPicker.parentNode);
    });

    SIZES.forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'icon-modal-size';
        b.textContent = s;
        b.dataset.size = s;
        b.addEventListener('click', function () { setSize(s); });
        sizeWrap.insertBefore(b, sizeInput);
    });

    function normalizeHex(value) {
        var v = String(value == null ? '' : value).trim().replace(/^#/, '');
        if (/^[0-9a-fA-F]{3}$/.test(v)) {
            v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
        } else if (!/^[0-9a-fA-F]{6}$/.test(v)) {
            return null;
        }
        return '#' + v.toUpperCase();
    }

    function displayHex() {
        if (!iconColor) return '';
        return normalizeHex(iconColor) || iconColor.toUpperCase();
    }

    var pickerHsv = { h: 146, s: 1, v: 0.6 };

    function hsvToHex(h, sv, v) {
        var c = v * sv;
        var hp = ((h % 360) + 360) % 360 / 60;
        var x = c * (1 - Math.abs(hp % 2 - 1));
        var m = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(hp) % 6];
        var base = v - c;
        return '#' + m.map(function (n) {
            return ('0' + Math.round((n + base) * 255).toString(16)).slice(-2).toUpperCase();
        }).join('');
    }

    function hexToHsv(hex) {
        var v = normalizeHex(hex);
        if (!v) return null;
        var r = parseInt(v.slice(1, 3), 16) / 255;
        var g = parseInt(v.slice(3, 5), 16) / 255;
        var b = parseInt(v.slice(5, 7), 16) / 255;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var d = max - min;
        var h = 0;
        if (d) {
            if (max === r) h = 60 * (((g - b) / d) % 6);
            else if (max === g) h = 60 * ((b - r) / d + 2);
            else h = 60 * ((r - g) / d + 4);
        }
        return { h: ((h % 360) + 360) % 360, s: max ? d / max : 0, v: max };
    }

    function pickerHex() { return hsvToHex(pickerHsv.h, pickerHsv.s, pickerHsv.v); }

    function renderPickerUi() {
        var hue = hsvToHex(pickerHsv.h, 1, 1);
        pickerSv.style.backgroundImage = 'linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, ' + hue + ')';
        pickerSvThumb.style.left = (pickerHsv.s * 100) + '%';
        pickerSvThumb.style.top = ((1 - pickerHsv.v) * 100) + '%';
        pickerSvThumb.style.background = pickerHex();
        pickerHueThumb.style.left = (pickerHsv.h / 360 * 100) + '%';
        pickerHueThumb.style.background = hue;
        pickerChip.style.background = iconColor || pickerHex();
    }

    function syncPickerFromColor() {
        var hsv = hexToHsv(iconColor);
        if (!hsv) return;
        if (hsv.s > 0) pickerHsv.h = hsv.h;
        pickerHsv.s = hsv.s;
        pickerHsv.v = hsv.v;
    }

    function openPicker() {
        syncPickerFromColor();
        renderPickerUi();
        pickerPanel.hidden = false;
        colorPicker.setAttribute('aria-expanded', 'true');
    }

    function closePicker() {
        pickerPanel.hidden = true;
        colorPicker.setAttribute('aria-expanded', 'false');
    }

    function ratio(event, el, axis) {
        var rect = el.getBoundingClientRect();
        var size = axis === 'x' ? rect.width : rect.height;
        var pos = axis === 'x' ? event.clientX - rect.left : event.clientY - rect.top;
        if (!size) return 0;
        return Math.min(1, Math.max(0, pos / size));
    }

    function dragTrack(el, onMove) {
        el.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            el.setPointerCapture(e.pointerId);
            onMove(e);
            var move = function (ev) { onMove(ev); };
            var up = function () {
                el.removeEventListener('pointermove', move);
                el.removeEventListener('pointerup', up);
                el.removeEventListener('pointercancel', up);
            };
            el.addEventListener('pointermove', move);
            el.addEventListener('pointerup', up);
            el.addEventListener('pointercancel', up);
        });
    }

    function syncControls() {
        var isPreset = false;
        swatchWrap.querySelectorAll('.icon-modal-swatch').forEach(function (b) {
            var v = b.dataset.value || '';
            var active = v.toLowerCase() === (iconColor || '').toLowerCase();
            if (active) isPreset = true;
            b.classList.toggle('is-active', active);
        });
        colorPicker.classList.toggle('is-active', !!iconColor && !isPreset);
        sizeWrap.querySelectorAll('.icon-modal-size').forEach(function (b) {
            b.classList.toggle('is-active', Number(b.dataset.size) === iconSize);
        });
        if (document.activeElement !== sizeInput) sizeInput.value = iconSize;
        var hex = displayHex();
        hexInput.classList.remove('is-invalid');
        pickerChip.style.background = iconColor || pickerHex();
        hexInput.title = 'カラーコード（HEX）を入力できます';
        if (document.activeElement !== hexInput) hexInput.value = hex;
    }

    function isRaster(icon) { return icon.markup.indexOf('<img') !== -1; }
    function rasterSrc(icon) {
        var m = icon.markup.match(/src="([^"]+)"/);
        return m ? m[1] : '';
    }

    function sizedSvg(icon, size, color) {
        var svg = icon.markup;
        var head = svg.match(/^<svg[^>]*>/);
        if (head) {
            var tag = head[0];
            var next = /\swidth="[^"]*"/.test(tag)
                ? tag.replace(/\swidth="[^"]*"/, ' width="' + size + '"')
                : tag.replace('<svg', '<svg width="' + size + '"');
            next = /\sheight="[^"]*"/.test(next)
                ? next.replace(/\sheight="[^"]*"/, ' height="' + size + '"')
                : next.replace('<svg', '<svg height="' + size + '"');
            svg = next + svg.slice(tag.length);
        }
        if (color) svg = svg.split('currentColor').join(color);
        return svg;
    }

    function markupFor(icon, size) {
        if (isRaster(icon)) {
            return '<img src="' + rasterSrc(icon) + '" width="' + size + '" height="' + size + '" alt="' + icon.ja + '">';
        }
        return sizedSvg(icon, size, null);
    }

    function svgSnippet(icon) {
        if (isRaster(icon)) return markupFor(icon, iconSize);
        return sizedSvg(icon, iconSize, iconColor);
    }

    function htmlSnippet(icon) {
        return '<span class="nq-icon" style="display:inline-flex;width:' + iconSize + 'px;height:' +
            iconSize + 'px;color:' + (iconColor || 'currentColor') + ';">\n  ' +
            markupFor(icon, iconSize) + '\n</span>';
    }

    function renderPng(callback) {
        if (!currentIcon) return callback(null);
        if (isRaster(currentIcon)) return callback(rasterSrc(currentIcon));
        var resolved = iconColor || getComputedStyle(previewEl).color;
        var source = sizedSvg(currentIcon, iconSize, resolved);
        var url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = iconSize;
            canvas.height = iconSize;
            canvas.getContext('2d').drawImage(img, 0, 0, iconSize, iconSize);
            URL.revokeObjectURL(url);
            callback(canvas.toDataURL('image/png'));
        };
        img.onerror = function () { URL.revokeObjectURL(url); callback(null); };
        img.src = url;
    }

    function renderPreview() {
        if (!currentIcon) return;
        previewEl.style.color = iconColor || '';
        previewEl.innerHTML = markupFor(currentIcon, iconSize);
    }

    function renderCode() {
        if (!currentIcon) return;
        var token = ++pngToken;
        codeBox.classList.toggle('is-wrap', currentTab === 'png');
        ctaCopyIcon.hidden = currentTab === 'png';
        ctaDownloadIcon.hidden = currentTab !== 'png';
        if (currentTab === 'png') {
            ctaLabel.textContent = 'PNGをダウンロードする';
            codeEl.textContent = 'PNGを生成中…';
            renderPng(function (dataUrl) {
                if (token !== pngToken) return;
                codeEl.textContent = dataUrl
                    ? '<img src="' + dataUrl + '" width="' + iconSize + '" height="' + iconSize + '" alt="' + currentIcon.ja + '">'
                    : 'PNGを生成できませんでした';
            });
        } else if (currentTab === 'svg') {
            ctaLabel.textContent = 'SVGをコピーする';
            codeEl.textContent = svgSnippet(currentIcon);
        } else {
            ctaLabel.textContent = 'HTMLをコピーする';
            codeEl.textContent = htmlSnippet(currentIcon);
        }
    }

    function setColor(value) {
        iconColor = value;
        renderPreview();
        syncControls();
        renderCode();
    }

    function clampSize(value) {
        var n = Math.round(Number(value));
        if (!isFinite(n)) return DEFAULT_SIZE;
        return Math.min(MAX_SIZE, Math.max(MIN_SIZE, n));
    }

    function setSize(value) {
        iconSize = clampSize(value);
        syncControls();
        renderPreview();
        renderCode();
    }

    function openIconModal(icon) {
        currentIcon = icon;
        currentTab = 'svg';
        iconColor = null;
        iconSize = DEFAULT_SIZE;
        tabs2.forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-tab') === 'svg'); });
        titleEl.textContent = icon.ja;
        slugEl.textContent = icon.en;
        closePicker();
        renderPreview();
        syncControls();
        renderCode();
        overlay.classList.add('is-open');
    }
    window.openIconModal = openIconModal;

    colorPicker.addEventListener('click', function (e) {
        e.stopPropagation();
        if (pickerPanel.hidden) openPicker(); else closePicker();
    });
    pickerPanel.addEventListener('click', function (e) { e.stopPropagation(); });
    dragTrack(pickerSv, function (e) {
        pickerHsv.s = ratio(e, pickerSv, 'x');
        pickerHsv.v = 1 - ratio(e, pickerSv, 'y');
        setColor(pickerHex());
        renderPickerUi();
    });
    dragTrack(pickerHue, function (e) {
        pickerHsv.h = ratio(e, pickerHue, 'x') * 360;
        setColor(pickerHex());
        renderPickerUi();
    });
    hexInput.addEventListener('input', function () {
        var hex = normalizeHex(hexInput.value);
        hexInput.classList.toggle('is-invalid', !hex && hexInput.value.trim() !== '');
        if (hex) {
            setColor(hex);
            syncPickerFromColor();
            renderPickerUi();
        }
    });
    hexInput.addEventListener('change', function () {
        var hex = normalizeHex(hexInput.value);
        if (hex) setColor(hex);
        hexInput.value = displayHex();
        hexInput.classList.remove('is-invalid');
    });
    hexInput.addEventListener('blur', function () {
        hexInput.value = displayHex();
        hexInput.classList.remove('is-invalid');
    });
    hexInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); hexInput.blur(); }
    });
    hexInput.addEventListener('focus', function () { hexInput.select(); });
    sizeInput.addEventListener('input', function () {
        var n = Math.round(Number(sizeInput.value));
        if (!isFinite(n) || n < MIN_SIZE || n > MAX_SIZE) return;
        setSize(n);
    });
    sizeInput.addEventListener('change', function () {
        setSize(sizeInput.value);
        sizeInput.value = iconSize;
    });
    sizeInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); sizeInput.blur(); }
    });
    document.getElementById('iconModalReset').addEventListener('click', function () {
        iconSize = DEFAULT_SIZE;
        setColor(null);
    });

    function closeIconModal() {
        closePicker();
        overlay.classList.remove('is-open');
    }

    document.getElementById('iconModalClose').addEventListener('click', closeIconModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeIconModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !overlay.classList.contains('is-open')) return;
        if (!pickerPanel.hidden) { closePicker(); colorPicker.focus(); return; }
        closeIconModal();
    });
    document.addEventListener('click', function () {
        if (!pickerPanel.hidden) closePicker();
    });

    tabs2.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs2.forEach(function (t) { t.classList.remove('is-active'); });
            tab.classList.add('is-active');
            currentTab = tab.getAttribute('data-tab');
            renderCode();
        });
    });


    function copyText(text, btn) {
        function done() {
            if (!btn) return;
            var original = btn.innerHTML;
            btn.textContent = 'コピーしました';
            setTimeout(function () { btn.innerHTML = original; }, 1400);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
            done();
        }
    }

    function triggerDownload(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function dataUrlToBlob(dataUrl) {
        var parts = dataUrl.split(',');
        var mime = parts[0].match(/:(.*?);/)[1];
        var bin = atob(parts[1]);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new Blob([arr], { type: mime });
    }

    function downloadCurrent() {
        if (!currentIcon) return;
        if (currentTab === 'png' || isRaster(currentIcon)) {
            renderPng(function (dataUrl) {
                if (!dataUrl) return;
                triggerDownload(dataUrlToBlob(dataUrl), currentIcon.slug + '-' + iconSize + '.png');
            });
        } else {
            triggerDownload(new Blob([svgSnippet(currentIcon)], { type: 'image/svg+xml' }), currentIcon.slug + '.svg');
        }
    }

    document.getElementById('iconModalCta').addEventListener('click', function () {
        if (!currentIcon) return;
        if (currentTab === 'png') {
            downloadCurrent();
            return;
        }
        copyText(codeEl.textContent, null);
        var label = ctaLabel.textContent;
        ctaLabel.textContent = 'コピーしました';
        setTimeout(function () { ctaLabel.textContent = label; }, 1400);
    });
})();

// --- コンポーネント一覧のタブ ---
(function () {
    var tabs = document.querySelectorAll('.component-tab');

    function activateTab(tab) {
        tabs.forEach(function (t) {
            t.classList.remove('is-active');
            t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.component-detail-panel').forEach(function (panel) {
            panel.classList.remove('is-visible');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        var target = document.getElementById(tab.getAttribute('data-target'));
        if (target) target.classList.add('is-visible');
        expandGroupOf(tab);
    }

    // グループ見出しのアコーディオン開閉
    function setGroupOpen(toggle, open) {
        var items = document.getElementById(toggle.getAttribute('aria-controls'));
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (items) items.hidden = !open;
    }

    function expandGroupOf(tab) {
        var items = tab.closest('.component-tab-items');
        if (!items) return;
        var toggle = document.querySelector('[aria-controls="' + items.id + '"]');
        if (toggle) setGroupOpen(toggle, true);
    }

    document.querySelectorAll('[data-group-toggle]').forEach(function (toggle) {
        toggle.addEventListener('click', function () {
            setGroupOpen(toggle, toggle.getAttribute('aria-expanded') !== 'true');
        });
    });

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () { activateTab(tab); });
    });

    // #colors のようにパネル内にあるアンカーは、該当タブを開いてから移動する
    function revealHash(hash) {
        var el = null;
        try { el = hash && hash.length > 1 ? document.querySelector(hash) : null; } catch (e) { return false; }
        if (!el) return false;
        var panel = el.closest('.component-detail-panel');
        if (!panel) return false;
        var tab = document.querySelector('.component-tab[data-target="' + panel.id + '"]');
        if (tab) activateTab(tab);
        el.scrollIntoView();
        return true;
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function () { revealHash(a.getAttribute('href')); });
    });
    window.addEventListener('hashchange', function () { revealHash(window.location.hash); });

    // 読み込み時: 他ページから #panel-... / #colors などで来た場合はそのタブを開く。
    // それ以外は「アイコン」を選択した状態から始める
    if (!revealHash(window.location.hash)) {
        var defaultTab = document.querySelector('.component-tab[data-target="panel-icon"]');
        if (defaultTab) activateTab(defaultTab);
    }
})();
