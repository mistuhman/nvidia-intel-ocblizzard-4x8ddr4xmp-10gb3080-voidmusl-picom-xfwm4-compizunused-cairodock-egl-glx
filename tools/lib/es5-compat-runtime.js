/* es5-compat-runtime.js - the FF52-class compatibility runtime emitted into every passthrough bundle.
**
** __bi: arbitrary-precision integer implementation that REPLACES the absent BigInt (Firefox 52 /
**       Arctic Fox 47 Goanna has no BigInt, and core-js 3.50.0 does not polyfill it).
** __rx: RegExp factory for literals whose pattern uses post-FF52 syntax (lookbehind, named groups,
**       dotAll): rebuilt from an FF52-parsable pattern plus an exec() that enforces the assertions
**       the engine cannot express.
**
** Floor: ES5 syntax and pre-ES6 built-ins only. The gate that proves it is
** `node tools/mac-es5-passthrough.ts selftest --compiler` (acorn ecmaVersion 5 parse + a post-ES5
** identifier scan); the same command verifies SEMANTICS by differential fuzz against this machine's
** native BigInt and RegExp. Every __bi operator takes plain operands and dispatches at runtime, so
** a value that is NOT a bigint keeps the native operator's behaviour exactly - including the
** TypeError native BigInt throws when it is mixed with a Number.
**
** Representation: sign + little-endian magnitude digits, base 2^15 (a product of two digits stays
** exact inside a double, so no Math.imul / typed arrays / BigInt are needed or allowed).
*/
(function (g) {
  'use strict';

  var B_BITS = 15;
  var B_BASE = 1 << B_BITS;              /* 32768 */
  var B_MASK = B_BASE - 1;
  var W_BITS = 30;                       /* two digits per bitwise word (two's complement view) */
  var W_BASE = 1 << W_BITS;
  var W_MASK = W_BASE - 1;
  var POW52 = 4503599627370496;          /* 2^52 */
  var DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';
  var WS = /^[ \t\n\r\u000b\f\u00a0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]$/;
  var MIX = 'Cannot mix BigInt and other types, use explicit conversions.';
  var MAX_BITS = 4194304;                  /* width a linear-time path (shifts) may still produce */
  var POW_MAX_BITS = 65536;                /* width the quadratic multiply path may produce: the bound
                                              ** that matters on the target is time, not memory, and a
                                              ** squaring loop over wider operands is a hang there */

  /* ------------------------------------------------------------- magnitude ops ---- */

  function trim(d) { while (d.length > 1 && d[d.length - 1] === 0) { d.pop(); } return d; }
  function isZero(d) { return d.length === 1 && d[0] === 0; }

  function cmpD(a, b) {
    if (a.length !== b.length) { return a.length > b.length ? 1 : -1; }
    for (var i = a.length - 1; i >= 0; i -= 1) {
      if (a[i] !== b[i]) { return a[i] > b[i] ? 1 : -1; }
    }
    return 0;
  }
  function addD(a, b) {
    var n = a.length > b.length ? a.length : b.length;
    var r = [], c = 0, i, t;
    for (i = 0; i < n; i += 1) {
      t = (a[i] || 0) + (b[i] || 0) + c;
      r[i] = t & B_MASK;
      c = t >>> B_BITS;
    }
    if (c) { r[i] = c; }
    return trim(r);
  }
  function subD(a, b) {                       /* requires cmpD(a, b) >= 0 */
    var r = [], bb = 0, i, t;
    for (i = 0; i < a.length; i += 1) {
      t = (a[i] || 0) - (b[i] || 0) - bb;
      if (t < 0) { t += B_BASE; bb = 1; } else { bb = 0; }
      r[i] = t;
    }
    return trim(r);
  }
  function mulD(a, b) {
    var n = a.length, m = b.length, i, j, v, c;
    if (n > 1048576 || m > 1048576) { throw new RangeError('Maximum BigInt size exceeded'); }
    var r = [];
    for (i = 0; i < n + m; i += 1) { r[i] = 0; }
    for (i = 0; i < n; i += 1) {
      if (!a[i]) { continue; }
      for (j = 0; j < m; j += 1) { r[i + j] += a[i] * b[j]; }
    }
    c = 0;
    for (i = 0; i < r.length; i += 1) {
      v = r[i] + c;
      c = Math.floor(v / B_BASE);
      r[i] = v - c * B_BASE;
    }
    return trim(r);
  }
  function mulSmallD(a, m) {
    var r = [], c = 0, i, v;
    for (i = 0; i < a.length; i += 1) {
      v = a[i] * m + c;
      c = Math.floor(v / B_BASE);
      r[i] = v - c * B_BASE;
    }
    while (c) { r[i] = c & B_MASK; c = Math.floor(c / B_BASE); i += 1; }
    return trim(r.length ? r : [0]);
  }
  function divSmallD(a, m) {                  /* single-limb divisor -> {q, r} */
    var q = [], rem = 0, i, cur;
    for (i = a.length - 1; i >= 0; i -= 1) {
      cur = rem * B_BASE + a[i];
      q[i] = Math.floor(cur / m);
      rem = cur - q[i] * m;
    }
    return { q: trim(q.length ? q : [0]), r: rem };
  }
  function shlOneD(a) {
    var r = [], c = 0, i, v;
    for (i = 0; i < a.length; i += 1) {
      v = a[i] * 2 + c;
      c = v >= B_BASE ? 1 : 0;
      r[i] = c ? v - B_BASE : v;
    }
    if (c) { r[i] = c; }
    return r;
  }
  function shlShiftD(d, bits) {
    var drop = Math.floor(bits / B_BITS), sh = bits - drop * B_BITS, i, c, v;
    var r = [];
    for (i = 0; i < drop; i += 1) { r[i] = 0; }
    if (!sh) {
      for (i = 0; i < d.length; i += 1) { r[drop + i] = d[i]; }
      return trim(r.length ? r : [0]);
    }
    c = 0;
    for (i = 0; i < d.length; i += 1) {
      v = d[i] << sh;
      r[drop + i] = ((v & B_MASK) | c) & B_MASK;
      c = v >>> B_BITS;
    }
    if (c) { r[drop + d.length] = c & B_MASK; }
    return trim(r.length ? r : [0]);
  }
  function shrShiftD(a, bits) {               /* magnitude shift right (floor) */
    var drop = Math.floor(bits / B_BITS), sh = bits - drop * B_BITS, i;
    if (drop >= a.length) { return [0]; }
    var r = [], v;
    for (i = drop; i < a.length; i += 1) {
      v = a[i] >>> sh;
      if (sh && i + 1 < a.length) { v |= (a[i + 1] & ((1 << sh) - 1)) << (B_BITS - sh); }
      r[i - drop] = v & B_MASK;
    }
    return trim(r.length ? r : [0]);
  }
  function lowBitsD(a, bits) {                /* a mod 2^bits */
    var drop = Math.floor(bits / B_BITS), sh = bits - drop * B_BITS;
    var n = sh ? drop + 1 : drop;
    if (n > a.length) { n = a.length; }
    var r = [], i;
    if (n <= 0) { return [0]; }
    for (i = 0; i < n; i += 1) { r[i] = a[i]; }
    if (sh) { r[n - 1] &= (1 << sh) - 1; }
    return trim(r);
  }
  function bitLenD(a) {
    var n = (a.length - 1) * B_BITS, t = a[a.length - 1];
    while (t) { n += 1; t = Math.floor(t / 2); }
    return n;
  }
  function getBitD(a, i) {
    var k = Math.floor(i / B_BITS);
    return k < a.length ? ((a[k] >>> (i - k * B_BITS)) & 1) : 0;
  }
  function setBitD(a, i) {
    var k = Math.floor(i / B_BITS);
    while (a.length <= k) { a.push(0); }
    a[k] |= 1 << (i - k * B_BITS);
  }
  function divModD(a, b) {                    /* magnitudes; b !== 0 */
    if (b.length === 1) {
      var s = divSmallD(a, b[0]);
      return { q: s.q, r: [s.r] };
    }
    if (cmpD(a, b) < 0) { return { q: [0], r: a.slice() }; }
    var bits = bitLenD(a), i;
    var q = [], rem = [0];
    for (i = bits - 1; i >= 0; i -= 1) {
      rem = shlOneD(rem);
      if (getBitD(a, i)) { rem[0] |= 1; }
      if (cmpD(rem, b) >= 0) { rem = subD(rem, b); setBitD(q, i); }
    }
    return { q: trim(q.length ? q : [0]), r: trim(rem) };
  }

  /* -------------------------------------------------------------- conversions ---- */

  function fmtD(d, radix) {
    var chunk = 1, k = 0, rest = d.slice(), out = '', more = true, q, part, j;
    while (chunk * radix < B_BASE) { chunk *= radix; k += 1; }
    while (more) {
      q = divSmallD(rest, chunk);
      more = !isZero(q.q);
      part = digitsOf(q.r, radix);
      if (more) { for (j = part.length; j < k; j += 1) { part = DIGITS.charAt(0) + part; } }
      out = part + out;
      rest = q.q;
    }
    return out.length ? out : '0';
  }
  function digitsOf(v, radix) {
    if (v === 0) { return '0'; }
    var s = '';
    while (v) { s = DIGITS.charAt(v % radix) + s; v = Math.floor(v / radix); }
    return s;
  }
  var TABLE = null;
  function digitTable() {
    if (TABLE) { return TABLE; }
    TABLE = {};
    for (var r = 0; r < DIGITS.length; r += 1) {
      TABLE[DIGITS.charAt(r)] = r;
      TABLE[DIGITS.charAt(r).toUpperCase()] = r;
    }
    return TABLE;
  }
  function parseRadixD(s, radix) {            /* unsigned digit string -> digits, null if invalid */
    var table = digitTable(), d = [0], i, v;
    for (i = 0; i < s.length; i += 1) {
      v = table[s.charAt(i)];
      if (v === undefined || v >= radix) { return null; }
      d = addD(mulSmallD(d, radix), [v]);
    }
    return trim(d);
  }
  function strToD(s) {                        /* StringToBigInt: returns {sign, digits} or throws */
    var text = String(s), i = 0, j = text.length;
    while (i < j && WS.test(text.charAt(i))) { i += 1; }
    while (j > i && WS.test(text.charAt(j - 1))) { j -= 1; }
    text = text.slice(i, j);
    var sign = 1, body = text, radix = 10;
    if (body.charAt(0) === '+') { body = body.slice(1); }
    else if (body.charAt(0) === '-') { sign = -1; body = body.slice(1); }
    if (body.length > 2 && body.charAt(0) === '0') {
      var p = body.charAt(1).toLowerCase();
      if (p === 'x') { radix = 16; body = body.slice(2); }
      else if (p === 'o') { radix = 8; body = body.slice(2); }
      else if (p === 'b') { radix = 2; body = body.slice(2); }
    }
    if (!body.length) { throw new SyntaxError('Cannot convert ' + s + ' to a BigInt'); }
    var d = parseRadixD(body, radix);
    if (d === null) { throw new SyntaxError('Cannot convert ' + s + ' to a BigInt'); }
    return { sign: sign, d: d };
  }
  function dblToD(n) {                        /* finite double -> exact {magnitude, scale} digits */
    var a = n < 0 ? -n : n, m = a, sc = 0, d = [], t;
    while (m !== Math.floor(m)) { m = m * 2; sc -= 1; }
    while (m > POW52) { m = m / 2; sc += 1; }
    t = m;
    while (t >= B_BASE) { d.push(t % B_BASE); t = Math.floor(t / B_BASE); }
    d.push(t);
    return { d: trim(d), sc: sc };
  }

  /* ------------------------------------------------------------- payload core ---- */
  /* payload p = { s: -1|0|1, d: digits } */

  function mk(sign, d) {
    d = trim(d);
    if (isZero(d)) { return { s: 0, d: [0] }; }
    return { s: sign, d: d };
  }
  function cmpS(a, b) {
    if (a.s !== b.s) { return a.s > b.s ? 1 : -1; }
    if (a.s === 0) { return 0; }
    var c = cmpD(a.d, b.d);
    return a.s < 0 ? -c : c;
  }
  function addS(a, b) {
    if (a.s === 0) { return b; }
    if (b.s === 0) { return a; }
    if (a.s === b.s) { return mk(a.s, addD(a.d, b.d)); }
    var c = cmpD(a.d, b.d);
    if (c === 0) { return { s: 0, d: [0] }; }
    return c > 0 ? mk(a.s, subD(a.d, b.d)) : mk(b.s, subD(b.d, a.d));
  }
  function negS(a) { return { s: -a.s, d: a.d }; }
  function mulS(a, b) {
    if (a.s === 0 || b.s === 0) { return { s: 0, d: [0] }; }
    return mk((a.s < 0) !== (b.s < 0) ? -1 : 1, mulD(a.d, b.d));
  }
  function divS(a, b) {                       /* truncate toward zero */
    if (b.s === 0) { throw new RangeError('Division by zero'); }
    return mk((a.s < 0) !== (b.s < 0) ? -1 : 1, divModD(a.d, b.d).q);
  }
  function modS(a, b) {                       /* sign follows the dividend */
    if (b.s === 0) { throw new RangeError('Division by zero'); }
    var r = divModD(a.d, b.d).r;
    return mk(isZero(r) ? 0 : (a.s < 0 ? -1 : 1), r);
  }
  function shlS(a, bits) {
    if (a.s === 0 || bits === 0) { return a; }
    if (bits < 0) { return shrS(a, -bits); }
    if (bits > MAX_BITS) { throw new RangeError('Maximum BigInt size exceeded'); }
    return mk(a.s, shlShiftD(a.d, bits));
  }
  function shrS(a, bits) {                    /* arithmetic shift = floor division by 2^bits */
    if (bits === 0 || a.s === 0) { return a; }
    if (bits < 0) { return shlS(a, -bits); }
    /* shifting a magnitude away entirely needs no allocation: 0 for x >= 0, -1 for x < 0 */
    if (bits > MAX_BITS) { return a.s < 0 ? mk(-1, [1]) : { s: 0, d: [0] }; }
    var m = shrShiftD(a.d, bits);
    if (a.s > 0) { return mk(1, m); }
    return isZero(lowBitsD(a.d, bits)) ? mk(-1, m) : mk(-1, addD(m, [1]));
  }
  function wordsFor(a) {
    var n = Math.ceil((bitLenD(a.d) + 1) / W_BITS);
    return n < 1 ? 1 : n;
  }
  function toWordsS(a, words) {               /* two's complement over `words` 30-bit words */
    var w = [], i, lo, hi, v, c, neg = a.s < 0;
    for (i = 0; i < words; i += 1) {
      lo = a.d[2 * i] || 0;
      hi = a.d[2 * i + 1] || 0;
      v = (hi * B_BASE + lo) & W_MASK;
      w[i] = neg ? (~v) & W_MASK : v;
    }
    if (neg) {
      c = 1;
      for (i = 0; i < words && c; i += 1) { v = w[i] + c; w[i] = v & W_MASK; c = v > W_MASK ? 1 : 0; }
    }
    return w;
  }
  function fromWordsS(w) {
    var words = w.length, i, v, c;
    var neg = (w[words - 1] & (1 << (W_BITS - 1))) !== 0;
    var a = w.slice();
    if (neg) {
      for (i = 0; i < words; i += 1) { a[i] = (~a[i]) & W_MASK; }
      c = 1;
      for (i = 0; i < words && c; i += 1) { v = a[i] + c; a[i] = v & W_MASK; c = v > W_MASK ? 1 : 0; }
    }
    var d = [];
    for (i = 0; i < words; i += 1) {
      d[2 * i] = a[i] & B_MASK;
      d[2 * i + 1] = Math.floor(a[i] / B_BASE) & B_MASK;
    }
    return mk(neg ? -1 : 1, trim(d.length ? d : [0]));
  }
  function bitOpS(a, b, op) {
    var n = Math.max(wordsFor(a), wordsFor(b)), i;
    var x = toWordsS(a, n), y = toWordsS(b, n), r = [];
    for (i = 0; i < n; i += 1) {
      r[i] = op === 0 ? (x[i] & y[i]) : op === 1 ? (x[i] | y[i]) : (x[i] ^ y[i]);
    }
    return fromWordsS(r);
  }
  function notS(a) {                          /* ~x === -x - 1 */
    if (a.s === 0) { return mk(-1, [1]); }
    if (a.s > 0) { return mk(-1, addD(a.d, [1])); }
    var m = subD(a.d, [1]);
    return mk(isZero(m) ? 0 : 1, m);
  }
  function powTwoShiftD(d) {                  /* |value| === 2^k (k >= 1) -> k, otherwise 0 */
    var i, seen = 0, k = 0;
    for (i = 0; i < d.length; i += 1) {
      if (d[i] === 0) { continue; }
      if ((d[i] & (d[i] - 1)) !== 0) { return 0; }
      if (seen) { return 0; }
      seen = 1;
      var t = d[i], n = 0;
      while (t > 1) { t >>>= 1; n += 1; }
      k = i * B_BITS + n;
    }
    return k > 0 ? k : 0;
  }
  function powS(a, e) {                        /* a ** e, e a non-negative payload */
    if (e.s < 0) { throw new RangeError('Exponent must be positive'); }
    if (e.s === 0) { return mk(1, [1]); }       /* x ** 0n === 1n for every x, 0n included */
    if (a.s === 0) { return mk(1, [0]); }       /* 0n ** e === 0n for e > 0 */
    /* |a| === 1: the answer is 1 or -1 and the ONLY thing that matters is the parity of the
    ** exponent. Reading the exponent as a Number here is what made (-1n) ** (2n**53n + 1n) wrong:
    ** 9007199254740993 does not survive the round trip through a double. */
    if (a.d.length === 1 && a.d[0] === 1) { return a.s < 0 && getBitD(e.d, 0) === 1 ? mk(-1, [1]) : mk(1, [1]); }
    var k = powTwoShiftD(a.d);
    if (k > 0) {
      /* exact power of two: one shift instead of a squaring loop, so the exponents a modern engine
      ** handles in milliseconds (2n ** 1000000n) do not cost the target an hour */
      var sh = mulSmallD(e.d, k);
      if (sh.length > 2) { throw new RangeError('Maximum BigInt size exceeded'); }
      var bits = sh[0] + (sh.length > 1 ? sh[1] * B_BASE : 0);
      if (bits > MAX_BITS) { throw new RangeError('Maximum BigInt size exceeded'); }
      return mk(a.s < 0 && getBitD(e.d, 0) === 1 ? -1 : 1, shlShiftD([1], bits));
    }
    if (e.d.length > 2) { throw new RangeError('Maximum BigInt size exceeded'); }
    var n = e.d[0] + (e.d.length > 1 ? e.d[1] * B_BASE : 0);
    if (n * bitLenD(a.d) > POW_MAX_BITS) { throw new RangeError('Maximum BigInt size exceeded'); }
    var base = a, out = mk(1, [1]);
    while (n > 0) {
      if (n & 1) { out = mulS(out, base); }
      n = n >>> 1;
      if (n) { base = mulS(base, base); }
    }
    return out;
  }
  function cmpNumS(a, n) {                     /* payload vs finite double, exact */
    if (n === Infinity) { return -1; }
    if (n === -Infinity) { return 1; }
    var neg = n < 0 || (n === 0 && 1 / n < 0);
    var r = dblToD(neg ? -n : n);
    var right = mk(neg ? -1 : 1, r.d);
    var left = a;
    if (r.sc > 0) { right = mk(right.s, shlShiftD(right.d, r.sc)); }
    else if (r.sc < 0) { left = mk(left.s, shlShiftD(left.d, -r.sc)); }
    return cmpS(left, right);
  }
  function numS(p) { return Number((p.s < 0 ? '-' : '') + fmtD(p.d, 10)); }

  /* ---------------------------------------------------------------- instances ---- */

  var CACHE = {}, CACHE_N = 0;
  function hide(o, props) {
    for (var k in props) {
      if (Object.prototype.hasOwnProperty.call(props, k)) {
        Object.defineProperty(o, k, { value: props[k], enumerable: false, writable: false, configurable: true });
      }
    }
    return o;
  }
  function fmtP(p, radix) {
    var r = radix === undefined ? 10 : Number(radix);
    if (r !== Math.floor(r) || r < 2 || r > 36) { throw new RangeError('toString() radix must be between 2 and 36'); }
    if (p.s === 0) { return '0'; }
    var s = fmtD(p.d, r);
    return p.s < 0 ? '-' + s : s;
  }
  function group(s) {                          /* en-US grouping: approximated, reported as a WARN */
    var out = '', i;
    for (i = s.length; i > 0; i -= 3) { out = (i > 3 ? ',' : '') + s.slice(i - 3 < 0 ? 0 : i - 3, i) + out; }
    return out;
  }
  function makeInstance(p, key) {
    var o = hide({}, {
      _: p,
      toString: function (r) { return fmtP(p, r); },
      toLocaleString: function () { return (p.s < 0 ? '-' : '') + group(fmtD(p.d, 10)); },
      toJSON: function () { throw new TypeError('Do not know how to serialize a BigInt'); },
      valueOf: function () { throw new TypeError('Cannot convert a BigInt value to a number'); }
    });
    if (key && CACHE_N < 4096) { CACHE[key] = o; CACHE_N += 1; }
    return o;
  }
  var ZERO_OBJ = makeInstance({ s: 0, d: [0] }, null);
  function wrap(p) {
    if (p.s === 0) { return ZERO_OBJ; }
    var key = (p.s < 0 ? '-' : '') + fmtD(p.d, 10);   /* interning keeps == sound for unlowered sites */
    var hit = CACHE[key];
    return hit || makeInstance(p, key);
  }
  function dig(x) {                            /* payload of a bigint (shim or native), else null */
    if (x === null || x === undefined) { return null; }
    var t = typeof x;
    if (t === 'bigint') { var r = strToD(String(x)); return mk(r.sign, r.d); }
    if (t === 'object' && x._) { return x._; }
    if (t === 'number' || t === 'string' || t === 'boolean') { return null; }
    return null;
  }
  function toPrim(v) {
    if (v === null || typeof v !== 'object') { return v; }
    var f = v.valueOf;
    if (typeof f === 'function') { var r = f.call(v); if (r === null || typeof r !== 'object') { return r; } }
    var g2 = v.toString;
    if (typeof g2 === 'function') { var r2 = g2.call(v); if (r2 === null || typeof r2 !== 'object') { return r2; } }
    throw new TypeError('Cannot convert object to primitive value');
  }
  function need(x) {
    var p = dig(x);
    if (!p) { throw new TypeError(MIX); }
    return p;
  }

  /* ------------------------------------------------------------- BigInt() ---- */

  function BigIntFn(v) {
    if (this !== undefined && this !== g && this !== bi) { throw new TypeError('BigInt is not a constructor'); }
    if (v === undefined) { return ZERO_OBJ; }
    var t = typeof v;
    if (t === 'object' && v !== null && v._) { return v; }
    if (t === 'bigint') { var b = strToD(String(v)); return isZero(b.d) ? ZERO_OBJ : wrap(mk(b.sign, b.d)); }
    if (t === 'number') {
      if (v !== v) { throw new RangeError('The number NaN cannot be converted to a BigInt because it is not an integer'); }
      if (!isFinite(v) || v !== Math.floor(v)) { throw new RangeError('The number ' + v + ' cannot be converted to a BigInt because it is not an integer'); }
      if (v === 0) { return ZERO_OBJ; }
      var r = dblToD(v);
      return wrap(mk(v < 0 ? -1 : 1, r.sc > 0 ? shlShiftD(r.d, r.sc) : r.d));
    }
    if (t === 'boolean') { return v ? wrap(mk(1, [1])) : ZERO_OBJ; }
    var s = strToD(String(v));
    if (isZero(s.d)) { return ZERO_OBJ; }
    return wrap(mk(s.sign, s.d));
  }
  function indexBits(bits) {
    var n = Number(bits);
    if (n !== Math.floor(n) || n < 0 || n > 1048576 || n !== n) {
      throw new RangeError('Cannot convert ' + bits + ' to a BigInt');
    }
    return n;
  }
  BigIntFn.asIntN = function (bits, x) {
    var n = indexBits(bits), p = need(x);
    if (n === 0) { return ZERO_OBJ; }
    var full = mk(1, shlShiftD([1], n));
    var m = addS(p, mulS(mk(-1, [1]), mulS(divS(p, full), full)));   /* p mod 2^n, non-negative */
    if (m.s < 0) { m = addS(m, full); }
    var half = mk(1, shlShiftD([1], n - 1));
    if (cmpS(m, half) >= 0) { m = addS(m, negS(full)); }
    return wrap(m);
  };
  BigIntFn.asUintN = function (bits, x) {
    var n = indexBits(bits), p = need(x);
    if (n === 0) { return ZERO_OBJ; }
    var full = mk(1, shlShiftD([1], n));
    var m = addS(p, mulS(mk(-1, [1]), mulS(divS(p, full), full)));
    if (m.s < 0) { m = addS(m, full); }
    return wrap(m);
  };
  BigIntFn.abs = function (x) { var p = need(x); return wrap({ s: p.s === 0 ? 0 : 1, d: p.d }); };
  function minMax(args, wantMax) {
    var best = null, i, p;
    for (i = 0; i < args.length; i += 1) {
      p = need(args[i]);
      if (best === null || (wantMax ? cmpS(p, best) > 0 : cmpS(p, best) < 0)) { best = p; }
    }
    return wrap(best === null ? { s: 0, d: [0] } : best);
  }
  BigIntFn.max = function () { return minMax(arguments, true); };
  BigIntFn.min = function () { return minMax(arguments, false); };
  Object.defineProperty(BigIntFn, 'prototype', { value: undefined, writable: false, configurable: false });

  /* ------------------------------------------------------------------ api ---- */
  /* Each operator dispatches on its operands, so lowering a site whose operand is NOT a bigint
  ** still yields the native result; a site where only one side is a bigint yields the native
  ** TypeError. That is what makes the compiler's conservative bigint inference safe. */

  var bi = {
    BigInt: BigIntFn,
    lit: function (s) { var r = strToD(String(s)); return isZero(r.d) ? ZERO_OBJ : wrap(mk(r.sign, r.d)); },
    add: function (x, y) {
      /* native: bigint + bigint adds; bigint + String concatenates (either order);
      ** bigint mixed with any other type throws. Receipt: node differential probe 2026-09-16i. */
      var bx = dig(x), by = dig(y);
      if (bx && by) { return wrap(addS(bx, by)); }
      if (bx || by) {
        /* native + : ToPrimitive both sides, string beats everything, THEN bigint mixing throws */
        var lx = bx ? null : toPrim(x), ly = by ? null : toPrim(y);
        var bs = bx ? fmtP(bx, 10) : by ? fmtP(by, 10) : null;
        if (typeof lx === 'string') { return lx + (by ? bs : ly); }
        if (typeof ly === 'string') { return (bx ? bs : lx) + ly; }
        throw new TypeError(MIX);
      }
      return x + y;
    },
    sub: function (x, y) { var bx = dig(x), by = dig(y); if (bx || by) { return wrap(addS(need(x), negS(need(y)))); } return x - y; },
    mul: function (x, y) { var bx = dig(x), by = dig(y); if (bx || by) { return wrap(mulS(need(x), need(y))); } return x * y; },
    div: function (x, y) { var bx = dig(x), by = dig(y); if (bx || by) { return wrap(divS(need(x), need(y))); } return x / y; },
    mod: function (x, y) { var bx = dig(x), by = dig(y); if (bx || by) { return wrap(modS(need(x), need(y))); } return x % y; },
    pow: function (x, y) { var bx = dig(x), by = dig(y); if (bx || by) { return wrap(powS(need(x), need(y))); } return Math.pow(x, y); },
    neg: function (x) { var p = dig(x); if (p) { return wrap(negS(p)); } return -x; },
    pos: function (x) { if (dig(x)) { throw new TypeError('Cannot convert a BigInt value to a number'); } return +x; },
    not: function (x) { var p = dig(x); if (p) { return wrap(notS(p)); } return ~x; },
    and: function (x, y) { if (dig(x) || dig(y)) { return wrap(bitOpS(need(x), need(y), 0)); } return x & y; },
    or: function (x, y) { if (dig(x) || dig(y)) { return wrap(bitOpS(need(x), need(y), 1)); } return x | y; },
    xor: function (x, y) { if (dig(x) || dig(y)) { return wrap(bitOpS(need(x), need(y), 2)); } return x ^ y; },
    shl: function (x, y) { return shift(x, y, true); },
    shr: function (x, y) { return shift(x, y, false); },
    ursh: function (x, y) { if (dig(x) || dig(y)) { throw new TypeError(MIX); } return x >>> y; },
    eq: function (x, y) {
      var bx = dig(x), by = dig(y);
      if (bx && by) { return cmpS(bx, by) === 0; }
      if (bx || by) { return false; }
      return x === y;
    },
    ne: function (x, y) { return !bi.eq(x, y); },
    eqL: function (x, y) {
      var bx = dig(x), by = dig(y);
      if (bx && by) { return cmpS(bx, by) === 0; }
      if (bx || by) {
        var other = bx ? y : x;
        if (other === null || other === undefined) { return false; }
        var n = Number(other);
        if (n !== n) { return false; }
        return cmpNumS(bx || by, n) === 0;
      }
      return looseEq(x, y);
    },
    neL: function (x, y) { return !bi.eqL(x, y); },
    lt: function (x, y) { return rel(x, y, -1); },
    le: function (x, y) { return rel(x, y, 0); },
    gt: function (x, y) { return rel(x, y, 1); },
    ge: function (x, y) { return rel(x, y, 2); },
    cmp: function (x, y) { return cmpS(need(x), need(y)); },
    str: function (x, r) { var p = dig(x); if (p) { return fmtP(p, r); } if (r === undefined) { return String(x); } return typeof x === 'number' ? x.toString(r) : String(x); },
    num: function (x) { var p = dig(x); return p ? numS(p) : Number(x); },
    valOf: function (x) { var p = dig(x); return p ? wrapBox(p) : x.valueOf(); },
    tz: function (x) { var p = dig(x); return p ? p.s !== 0 : !!x; },
    typ: function (x) { return dig(x) ? 'bigint' : typeof x; },
    is: function (x) { return dig(x) !== null; },
    abs: BigIntFn.abs,
    max: BigIntFn.max,
    min: BigIntFn.min,
    asIntN: BigIntFn.asIntN,
    asUintN: BigIntFn.asUintN
  };
  function looseEq(x, y) { return x == y; } /* eslint-disable-line eqeqeq */
  function wrapBox(p) { return wrap(p); }
  function shift(x, y, left) {
    var bx = dig(x), by = dig(y);
    if (bx && by) {
      var e = numS(by);
      if (e !== Math.floor(e)) { throw new RangeError('Shift count must be an integer'); }
      if (e < 0) { e = -e; left = !left; }              /* native flips the direction */
      return wrap(left ? shlS(bx, e) : shrS(bx, e));
    }
    if (bx || by) { throw new TypeError(MIX); }
    return left ? x << y : x >> y;
  }
  function rel(x, y, want) {
    var bx = dig(x), by = dig(y);
    if (!bx && !by) {
      return want === -1 ? x < y : want === 0 ? x <= y : want === 1 ? x > y : x >= y;
    }
    var c;
    if (bx && by) { c = cmpS(bx, by); }
    else if (bx) { var n1 = Number(y); c = n1 !== n1 ? null : cmpNumS(bx, n1); }
    else { var n0 = Number(x); c = n0 !== n0 ? null : -cmpNumS(by, n0); }
    if (c === null || c === undefined) { return false; }
    return want === -1 ? c < 0 : want === 0 ? c <= 0 : want === 1 ? c > 0 : c >= 0;
  }

  /* ------------------------------------------------------------------- regex ---- */
  /* __rx(literal, origSrc, origFlags, fullSrc, fullFlags, branches, names)
  **  fullSrc/fullFlags  an FF52-parsable rendering of the whole pattern: it only has to exist so
  **                     the instance keeps real RegExp semantics (global/sticky/unicode getters and
  **                     lastIndex), matching is done by the branch scanners below.
  **  branches           [{ s: pattern, f: flags, c: [{ n: 1 when negated,
  **                                                    w: fixed width in code units,
  **                                                    s: constraint pattern,
  **                                                    f: constraint flags }] | null }]
  **                     a constraint must hold (or, when negated, must NOT hold) of the w code units
  **                     ENDING at the match start - which is what a leading lookbehind asserts.
  **                     Several branches = the alternation was split because the constraints differ
  **                     per branch; the leftmost match wins and ties keep branch order, which is
  **                     exactly how native alternation preference works.
  **  names              { name: captureIndex } so match.groups keeps working without FF78 groups.
  ** The instance is a REAL RegExp, so String#match/replace/search/split keep routing through exec
  ** (ES2015 semantics, which FF52 implements); exec is overridden leftmost-first so a candidate
  ** that fails a constraint never hides a later candidate that would pass.
  */
  function __rx(literal, origSrc, origFlags, src, flags, branches, names) {
    var re = new RegExp(src, flags);
    var scanners = [], i, j;
    for (i = 0; i < branches.length; i += 1) {
      var b = branches[i];
      var sflags = b.f.indexOf('y') >= 0 ? b.f : b.f + 'y';
      var checks = [];
      if (b.c) {
        for (j = 0; j < b.c.length; j += 1) {
          checks.push({ n: b.c[j].n, w: b.c[j].w, re: new RegExp('^(?:' + b.c[j].s + ')$', b.c[j].f) });
        }
      }
      scanners.push({ scan: new RegExp(b.s, sflags), checks: checks, sticky: b.f.indexOf('y') >= 0 });
    }
    function holds(sc, s, at) {
      for (var k = 0; k < sc.checks.length; k += 1) {
        var c = sc.checks[k], hit = false;
        if (at >= c.w) { hit = c.re.test(s.slice(at - c.w, at)); }
        if (c.n ? hit : !hit) { return false; }
      }
      return true;
    }
    function attach(m) {
      if (!names || !m) { return m; }
      /* spec: groups is an ordinary object with NO prototype - reproduce it, apps that String()
      ** or for-in the object see exactly what a modern engine gives them */
      var groups = Object.create ? Object.create(null) : {}, k;
      for (k in names) {
        if (Object.prototype.hasOwnProperty.call(names, k)) { groups[k] = m[names[k]]; }
      }
      m.groups = groups;
      return m;
    }
    /* run(s, pos) is the single matcher: constraints are enforced here, and every consumer
    ** (exec, and the Symbol.split below) goes through it. Engines are NOT consistent about
    ** whether String#split routes through the instance's exec - V8 bypasses it for the built-in
    ** matcher - so split is implemented here instead of trusting the routing. */
    function run(s, pos) {
      var best = null, bi;
      for (bi = 0; bi < scanners.length; bi += 1) {
        var sc = scanners[bi];
        sc.scan.lastIndex = pos;
        var m = sc.scan.exec(s);
        if (m && !holds(sc, s, m.index)) { m = null; }
        if (m && (best === null || m.index < best.index)) { best = m; }
      }
      return best;
    }
    re.exec = function (str) {
      var s = String(str === null || str === undefined ? 'undefined' : str);
      var usesLastIndex = !!(this.global || this.sticky);
      var pos = usesLastIndex ? toPos(this.lastIndex) : 0;
      for (;;) {
        if (pos > s.length) { if (usesLastIndex) { this.lastIndex = 0; } return null; }
        var m = run(s, pos);
        if (m) {
          if (usesLastIndex) { this.lastIndex = m.index + m[0].length; }
          return attach(m);
        }
        if (this.sticky || pos === s.length) { if (usesLastIndex) { this.lastIndex = 0; } return null; }
        pos += 1;
      }
    };
    if (typeof Symbol === 'function' && Symbol.split) {
      /* Pieces are boundaries, not a running buffer, because a zero-width match closes the piece
      ** BEFORE it without opening an empty one at index 0 - that is what "abc".split(/(?:)/) ===
      ** ["a","b","c"] means, and it is the rule a hand-written split loop reliably gets wrong. */
      var splitter = function (str, limit) {
        var s = String(str === null || str === undefined ? 'undefined' : str);
        var lim = limit === undefined ? 4503599627370495 : toPos(limit, 4503599627370495);
        var A = [], i;
        if (lim === 0) { return A; }
        if (s.length === 0) {
          var m0 = run(s, 0);
          if (m0 && m0[0] === '' && m0.index === 0) { return A; }
          A.push('');
          return A;
        }
        var last = 0, z = 0;
        while (z < s.length) {
          var m = run(s, z);
          if (!m) { z += 1; continue; }
          var e = m.index + m[0].length;
          if (e === z) {                                  /* zero-width: close, never lead with "" */
            if (z > last) {
              A.push(s.slice(last, z));
              for (i = 1; i < m.length; i += 1) { A.push(m[i]); }
              last = z;
            }
            z += 1;
            if (A.length >= lim) { return A.slice(0, lim); }
            continue;
          }
          A.push(s.slice(last, m.index));
          for (i = 1; i < m.length; i += 1) { A.push(m[i]); }
          last = e; z = e;
          if (A.length >= lim) { return A.slice(0, lim); }
        }
        A.push(s.slice(last));
        return A.slice(0, lim);
      };
      try { Object.defineProperty(re, Symbol.split, { value: splitter, writable: true, configurable: true, enumerable: false }); } catch (e2) { re[Symbol.split] = splitter; }
    }
    hide(re, {
      source: origSrc,
      flags: origFlags,
      literal: literal,
      toString: function () { return literal; },
      dotAll: origFlags.indexOf('s') >= 0,
      hasIndices: origFlags.indexOf('d') >= 0
    });
    return re;
  }
  function toPos(v, fallback) {
    if (v === undefined) { return fallback === undefined ? 0 : fallback; }
    var n = Number(v);
    if (!(n >= 0)) { return 0; }
    return Math.floor(n);
  }

  g.__bi = bi;
  g.__rx = __rx;
}(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this));
