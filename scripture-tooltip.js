/* Seeing and Believing — Scripture Tooltip System
   Wraps inline scripture references (e.g. "Romans 3:23") in hoverable spans
   that fetch and display the verse text from the WEB (World English Bible).
   References already inside an explicit .scripture block are skipped.
*/
(function () {
  'use strict';

  var API      = 'https://bible-api.com/';
  var DELAY_MS = 320;   // ms hover before showing
  var MAX_CH   = 420;   // max characters of verse text in tooltip

  /* ── Regex ──────────────────────────────────────────────────────
     Matches: optional number prefix · book name · chapter:verse[-verse]
     The \b word boundaries and chapter:verse requirement prevent matching
     author names ("John Piper") or bare numbers.
  ──────────────────────────────────────────────────────────────── */
  var BOOK_RE = new RegExp(
    '\\b' +
    '((?:[123]\\s+)?)' +   // optional numbered prefix (1 , 2 , 3 )
    '(' +
    'Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|' +
    'Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|' +
    'Ecclesiastes|Song\\s+of\\s+(?:Solomon|Songs?)|Isaiah|Jeremiah|' +
    'Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|' +
    'Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|' +
    'Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|' +
    'Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|' +
    'James|Peter|Jude|Revelation' +
    ')' +
    '\\s+\\d+:\\d+(?:[-\u2013]\\d+)?' +  // chapter:verse, optional range
    '(?:,\\s*\\d+)?',                     // optional ,verse
    'g'
  );

  /* ── Exclusion check ─────────────────────────────────────────── */
  var SKIP_CLASSES = [
    'scripture', 'scripture-ref', 'sidebar', 'toggle-panel',
    'module-nav', 'heresy-nav', 'sv-tooltip', 'sv-ref',
    'book-ref', 'sequence-note', 'page-label'
  ];
  var SKIP_TAGS = ['script', 'style', 'a', 'h1', 'h2', 'h3',
                   'nav', 'button', 'label', 'input', 'textarea'];

  function isExcluded(node) {
    var el = node.nodeType === 3 ? node.parentElement : node;
    while (el && el !== document.body) {
      var tag = (el.tagName || '').toLowerCase();
      if (SKIP_TAGS.indexOf(tag) !== -1) return true;
      var cls = el.className;
      if (typeof cls === 'string') {
        for (var i = 0; i < SKIP_CLASSES.length; i++) {
          if (cls.indexOf(SKIP_CLASSES[i]) !== -1) return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  }

  /* ── Text node walker ────────────────────────────────────────── */
  function collectTextNodes(root) {
    var results = [];
    var walker  = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      if (!isExcluded(node) && BOOK_RE.test(node.nodeValue)) {
        results.push(node);
      }
      BOOK_RE.lastIndex = 0;
    }
    return results;
  }

  /* ── Wrap references ─────────────────────────────────────────── */
  function wrapNode(textNode) {
    var text = textNode.nodeValue;
    BOOK_RE.lastIndex = 0;
    var match;
    var frags    = [];
    var lastIdx  = 0;

    while ((match = BOOK_RE.exec(text)) !== null) {
      if (match.index > lastIdx) {
        frags.push(document.createTextNode(text.slice(lastIdx, match.index)));
      }
      var span = document.createElement('span');
      span.className   = 'sv-ref';
      span.textContent = match[0];
      span.setAttribute('data-svref', match[0]);
      bindTooltip(span);
      frags.push(span);
      lastIdx = match.index + match[0].length;
    }

    if (!frags.length) return;
    if (lastIdx < text.length) frags.push(document.createTextNode(text.slice(lastIdx)));

    var parent = textNode.parentNode;
    if (!parent) return;
    frags.forEach(function (f) { parent.insertBefore(f, textNode); });
    parent.removeChild(textNode);
  }

  /* ── API helpers ─────────────────────────────────────────────── */
  var cache = Object.create(null);

  function apiKey(ref) {
    return ref
      .replace(/\u2013/g, '-')   // em-dash → hyphen
      .replace(/\s+/g, '+')
      .toLowerCase();
  }

  function fetchVerse(ref, cb) {
    var key = apiKey(ref);
    if (key in cache) { cb(cache[key]); return; }
    fetch(API + key + '?translation=web')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var txt = (d.text || '').trim().replace(/\s+/g, ' ');
        if (txt.length > MAX_CH) txt = txt.slice(0, MAX_CH).trimEnd() + '\u2026';
        cache[key] = { label: d.reference || ref, text: txt };
        cb(cache[key]);
      })
      .catch(function () {
        cache[key] = null;
        cb(null);
      });
  }

  /* ── Tooltip element ─────────────────────────────────────────── */
  var tip = null;

  function getTip() {
    if (!tip) {
      tip          = document.createElement('div');
      tip.id       = 'sv-tooltip-el';
      tip.className = 'sv-tooltip';
      tip.innerHTML =
        '<span class="sv-tt-ref"></span>' +
        '<span class="sv-tt-text"></span>' +
        '<span class="sv-tt-src">World English Bible</span>';
      document.body.appendChild(tip);
    }
    return tip;
  }

  function placeTip(anchor) {
    var t    = getTip();
    var rect = anchor.getBoundingClientRect();
    var tw   = t.offsetWidth  || 340;
    var th   = t.offsetHeight || 120;
    var vw   = window.innerWidth;
    var vh   = window.innerHeight;

    var left = rect.left;
    var top  = rect.bottom + 10;

    if (left + tw > vw - 10) left = vw - tw - 10;
    if (left < 8)            left = 8;
    if (top + th > vh - 8)   top  = rect.top - th - 10;
    if (top < 8)             top  = 8;

    t.style.left = left + 'px';
    t.style.top  = top  + 'px';
  }

  function showTip(anchor, ref) {
    var t = getTip();
    t.querySelector('.sv-tt-ref').textContent  = ref;
    t.querySelector('.sv-tt-text').textContent = 'Loading\u2026';
    t.querySelector('.sv-tt-src').textContent  = '';
    t.classList.add('sv-visible');
    placeTip(anchor);

    fetchVerse(ref, function (data) {
      if (!t.classList.contains('sv-visible')) return;
      if (!data) {
        t.querySelector('.sv-tt-text').textContent = '(Reference unavailable)';
        return;
      }
      t.querySelector('.sv-tt-ref').textContent  = data.label;
      t.querySelector('.sv-tt-text').textContent = data.text;
      t.querySelector('.sv-tt-src').textContent  = 'World English Bible';
      placeTip(anchor); // reposition now we know height
    });
  }

  function hideTip() {
    if (tip) tip.classList.remove('sv-visible');
  }

  /* ── Tooltip binding ─────────────────────────────────────────── */
  var showTimer = 0;
  var hideTimer = 0;

  function bindTooltip(span) {
    var ref = span.getAttribute('data-svref');

    span.addEventListener('mouseenter', function () {
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
      showTimer = setTimeout(function () { showTip(span, ref); }, DELAY_MS);
    });

    span.addEventListener('mouseleave', function () {
      clearTimeout(showTimer);
      hideTimer = setTimeout(hideTip, 180);
    });

    // Touch support: tap to toggle
    span.addEventListener('click', function (e) {
      e.stopPropagation();
      var t = getTip();
      if (t.classList.contains('sv-visible') &&
          t.querySelector('.sv-tt-ref').textContent.indexOf(
            ref.replace(/\s+\d+:\d+.*/, '')) !== -1) {
        hideTip();
      } else {
        clearTimeout(showTimer);
        showTip(span, ref);
      }
    });
  }

  // Dismiss on outside click (mobile)
  document.addEventListener('click', hideTip);

  /* ── Init ───────────────────────────────────────────────────────
     Run after DOM is ready; scope to .main to avoid nav/sidebar.
  ──────────────────────────────────────────────────────────────── */
  function init() {
    var main = document.querySelector('.main');
    if (!main) return;
    var nodes = collectTextNodes(main);
    // Process in reverse so DOM mutations don't affect the walker results
    for (var i = nodes.length - 1; i >= 0; i--) {
      wrapNode(nodes[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
