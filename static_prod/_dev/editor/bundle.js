(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* big.js v3.1.3 https://github.com/MikeMcl/big.js/LICENCE */
;(function (global) {
    'use strict';

/*
  big.js v3.1.3
  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
  https://github.com/MikeMcl/big.js/
  Copyright (c) 2014 Michael Mclaughlin <M8ch88l@gmail.com>
  MIT Expat Licence
*/

/***************************** EDITABLE DEFAULTS ******************************/

    // The default values below must be integers within the stated ranges.

    /*
     * The maximum number of decimal places of the results of operations
     * involving division: div and sqrt, and pow with negative exponents.
     */
    var DP = 20,                           // 0 to MAX_DP

        /*
         * The rounding mode used when rounding to the above decimal places.
         *
         * 0 Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
         * 1 To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
         * 2 To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
         * 3 Away from zero.                                  (ROUND_UP)
         */
        RM = 1,                            // 0, 1, 2 or 3

        // The maximum value of DP and Big.DP.
        MAX_DP = 1E6,                      // 0 to 1000000

        // The maximum magnitude of the exponent argument to the pow method.
        MAX_POWER = 1E6,                   // 1 to 1000000

        /*
         * The exponent value at and beneath which toString returns exponential
         * notation.
         * JavaScript's Number type: -7
         * -1000000 is the minimum recommended exponent value of a Big.
         */
        E_NEG = -7,                   // 0 to -1000000

        /*
         * The exponent value at and above which toString returns exponential
         * notation.
         * JavaScript's Number type: 21
         * 1000000 is the maximum recommended exponent value of a Big.
         * (This limit is not enforced or checked.)
         */
        E_POS = 21,                   // 0 to 1000000

/******************************************************************************/

        // The shared prototype object.
        P = {},
        isValid = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,
        Big;


    /*
     * Create and return a Big constructor.
     *
     */
    function bigFactory() {

        /*
         * The Big constructor and exported function.
         * Create and return a new instance of a Big number object.
         *
         * n {number|string|Big} A numeric value.
         */
        function Big(n) {
            var x = this;

            // Enable constructor usage without new.
            if (!(x instanceof Big)) {
                return n === void 0 ? bigFactory() : new Big(n);
            }

            // Duplicate.
            if (n instanceof Big) {
                x.s = n.s;
                x.e = n.e;
                x.c = n.c.slice();
            } else {
                parse(x, n);
            }

            /*
             * Retain a reference to this Big constructor, and shadow
             * Big.prototype.constructor which points to Object.
             */
            x.constructor = Big;
        }

        Big.prototype = P;
        Big.DP = DP;
        Big.RM = RM;
        Big.E_NEG = E_NEG;
        Big.E_POS = E_POS;

        return Big;
    }


    // Private functions


    /*
     * Return a string representing the value of Big x in normal or exponential
     * notation to dp fixed decimal places or significant digits.
     *
     * x {Big} The Big to format.
     * dp {number} Integer, 0 to MAX_DP inclusive.
     * toE {number} 1 (toExponential), 2 (toPrecision) or undefined (toFixed).
     */
    function format(x, dp, toE) {
        var Big = x.constructor,

            // The index (normal notation) of the digit that may be rounded up.
            i = dp - (x = new Big(x)).e,
            c = x.c;

        // Round?
        if (c.length > ++dp) {
            rnd(x, i, Big.RM);
        }

        if (!c[0]) {
            ++i;
        } else if (toE) {
            i = dp;

        // toFixed
        } else {
            c = x.c;

            // Recalculate i as x.e may have changed if value rounded up.
            i = x.e + i + 1;
        }

        // Append zeros?
        for (; c.length < i; c.push(0)) {
        }
        i = x.e;

        /*
         * toPrecision returns exponential notation if the number of
         * significant digits specified is less than the number of digits
         * necessary to represent the integer part of the value in normal
         * notation.
         */
        return toE === 1 || toE && (dp <= i || i <= Big.E_NEG) ?

          // Exponential notation.
          (x.s < 0 && c[0] ? '-' : '') +
            (c.length > 1 ? c[0] + '.' + c.join('').slice(1) : c[0]) +
              (i < 0 ? 'e' : 'e+') + i

          // Normal notation.
          : x.toString();
    }


    /*
     * Parse the number or string value passed to a Big constructor.
     *
     * x {Big} A Big number instance.
     * n {number|string} A numeric value.
     */
    function parse(x, n) {
        var e, i, nL;

        // Minus zero?
        if (n === 0 && 1 / n < 0) {
            n = '-0';

        // Ensure n is string and check validity.
        } else if (!isValid.test(n += '')) {
            throwErr(NaN);
        }

        // Determine sign.
        x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

        // Decimal point?
        if ((e = n.indexOf('.')) > -1) {
            n = n.replace('.', '');
        }

        // Exponential form?
        if ((i = n.search(/e/i)) > 0) {

            // Determine exponent.
            if (e < 0) {
                e = i;
            }
            e += +n.slice(i + 1);
            n = n.substring(0, i);

        } else if (e < 0) {

            // Integer.
            e = n.length;
        }

        // Determine leading zeros.
        for (i = 0; n.charAt(i) == '0'; i++) {
        }

        if (i == (nL = n.length)) {

            // Zero.
            x.c = [ x.e = 0 ];
        } else {

            // Determine trailing zeros.
            for (; n.charAt(--nL) == '0';) {
            }

            x.e = e - i - 1;
            x.c = [];

            // Convert string to array of digits without leading/trailing zeros.
            for (e = 0; i <= nL; x.c[e++] = +n.charAt(i++)) {
            }
        }

        return x;
    }


    /*
     * Round Big x to a maximum of dp decimal places using rounding mode rm.
     * Called by div, sqrt and round.
     *
     * x {Big} The Big to round.
     * dp {number} Integer, 0 to MAX_DP inclusive.
     * rm {number} 0, 1, 2 or 3 (DOWN, HALF_UP, HALF_EVEN, UP)
     * [more] {boolean} Whether the result of division was truncated.
     */
    function rnd(x, dp, rm, more) {
        var u,
            xc = x.c,
            i = x.e + dp + 1;

        if (rm === 1) {

            // xc[i] is the digit after the digit that may be rounded up.
            more = xc[i] >= 5;
        } else if (rm === 2) {
            more = xc[i] > 5 || xc[i] == 5 &&
              (more || i < 0 || xc[i + 1] !== u || xc[i - 1] & 1);
        } else if (rm === 3) {
            more = more || xc[i] !== u || i < 0;
        } else {
            more = false;

            if (rm !== 0) {
                throwErr('!Big.RM!');
            }
        }

        if (i < 1 || !xc[0]) {

            if (more) {

                // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                x.e = -dp;
                x.c = [1];
            } else {

                // Zero.
                x.c = [x.e = 0];
            }
        } else {

            // Remove any digits after the required decimal places.
            xc.length = i--;

            // Round up?
            if (more) {

                // Rounding up may mean the previous digit has to be rounded up.
                for (; ++xc[i] > 9;) {
                    xc[i] = 0;

                    if (!i--) {
                        ++x.e;
                        xc.unshift(1);
                    }
                }
            }

            // Remove trailing zeros.
            for (i = xc.length; !xc[--i]; xc.pop()) {
            }
        }

        return x;
    }


    /*
     * Throw a BigError.
     *
     * message {string} The error message.
     */
    function throwErr(message) {
        var err = new Error(message);
        err.name = 'BigError';

        throw err;
    }


    // Prototype/instance methods


    /*
     * Return a new Big whose value is the absolute value of this Big.
     */
    P.abs = function () {
        var x = new this.constructor(this);
        x.s = 1;

        return x;
    };


    /*
     * Return
     * 1 if the value of this Big is greater than the value of Big y,
     * -1 if the value of this Big is less than the value of Big y, or
     * 0 if they have the same value.
    */
    P.cmp = function (y) {
        var xNeg,
            x = this,
            xc = x.c,
            yc = (y = new x.constructor(y)).c,
            i = x.s,
            j = y.s,
            k = x.e,
            l = y.e;

        // Either zero?
        if (!xc[0] || !yc[0]) {
            return !xc[0] ? !yc[0] ? 0 : -j : i;
        }

        // Signs differ?
        if (i != j) {
            return i;
        }
        xNeg = i < 0;

        // Compare exponents.
        if (k != l) {
            return k > l ^ xNeg ? 1 : -1;
        }

        i = -1;
        j = (k = xc.length) < (l = yc.length) ? k : l;

        // Compare digit by digit.
        for (; ++i < j;) {

            if (xc[i] != yc[i]) {
                return xc[i] > yc[i] ^ xNeg ? 1 : -1;
            }
        }

        // Compare lengths.
        return k == l ? 0 : k > l ^ xNeg ? 1 : -1;
    };


    /*
     * Return a new Big whose value is the value of this Big divided by the
     * value of Big y, rounded, if necessary, to a maximum of Big.DP decimal
     * places using rounding mode Big.RM.
     */
    P.div = function (y) {
        var x = this,
            Big = x.constructor,
            // dividend
            dvd = x.c,
            //divisor
            dvs = (y = new Big(y)).c,
            s = x.s == y.s ? 1 : -1,
            dp = Big.DP;

        if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throwErr('!Big.DP!');
        }

        // Either 0?
        if (!dvd[0] || !dvs[0]) {

            // If both are 0, throw NaN
            if (dvd[0] == dvs[0]) {
                throwErr(NaN);
            }

            // If dvs is 0, throw +-Infinity.
            if (!dvs[0]) {
                throwErr(s / 0);
            }

            // dvd is 0, return +-0.
            return new Big(s * 0);
        }

        var dvsL, dvsT, next, cmp, remI, u,
            dvsZ = dvs.slice(),
            dvdI = dvsL = dvs.length,
            dvdL = dvd.length,
            // remainder
            rem = dvd.slice(0, dvsL),
            remL = rem.length,
            // quotient
            q = y,
            qc = q.c = [],
            qi = 0,
            digits = dp + (q.e = x.e - y.e) + 1;

        q.s = s;
        s = digits < 0 ? 0 : digits;

        // Create version of divisor with leading zero.
        dvsZ.unshift(0);

        // Add zeros to make remainder as long as divisor.
        for (; remL++ < dvsL; rem.push(0)) {
        }

        do {

            // 'next' is how many times the divisor goes into current remainder.
            for (next = 0; next < 10; next++) {

                // Compare divisor and remainder.
                if (dvsL != (remL = rem.length)) {
                    cmp = dvsL > remL ? 1 : -1;
                } else {

                    for (remI = -1, cmp = 0; ++remI < dvsL;) {

                        if (dvs[remI] != rem[remI]) {
                            cmp = dvs[remI] > rem[remI] ? 1 : -1;
                            break;
                        }
                    }
                }

                // If divisor < remainder, subtract divisor from remainder.
                if (cmp < 0) {

                    // Remainder can't be more than 1 digit longer than divisor.
                    // Equalise lengths using divisor with extra leading zero?
                    for (dvsT = remL == dvsL ? dvs : dvsZ; remL;) {

                        if (rem[--remL] < dvsT[remL]) {
                            remI = remL;

                            for (; remI && !rem[--remI]; rem[remI] = 9) {
                            }
                            --rem[remI];
                            rem[remL] += 10;
                        }
                        rem[remL] -= dvsT[remL];
                    }
                    for (; !rem[0]; rem.shift()) {
                    }
                } else {
                    break;
                }
            }

            // Add the 'next' digit to the result array.
            qc[qi++] = cmp ? next : ++next;

            // Update the remainder.
            if (rem[0] && cmp) {
                rem[remL] = dvd[dvdI] || 0;
            } else {
                rem = [ dvd[dvdI] ];
            }

        } while ((dvdI++ < dvdL || rem[0] !== u) && s--);

        // Leading zero? Do not remove if result is simply zero (qi == 1).
        if (!qc[0] && qi != 1) {

            // There can't be more than one zero.
            qc.shift();
            q.e--;
        }

        // Round?
        if (qi > digits) {
            rnd(q, dp, Big.RM, rem[0] !== u);
        }

        return q;
    };


    /*
     * Return true if the value of this Big is equal to the value of Big y,
     * otherwise returns false.
     */
    P.eq = function (y) {
        return !this.cmp(y);
    };


    /*
     * Return true if the value of this Big is greater than the value of Big y,
     * otherwise returns false.
     */
    P.gt = function (y) {
        return this.cmp(y) > 0;
    };


    /*
     * Return true if the value of this Big is greater than or equal to the
     * value of Big y, otherwise returns false.
     */
    P.gte = function (y) {
        return this.cmp(y) > -1;
    };


    /*
     * Return true if the value of this Big is less than the value of Big y,
     * otherwise returns false.
     */
    P.lt = function (y) {
        return this.cmp(y) < 0;
    };


    /*
     * Return true if the value of this Big is less than or equal to the value
     * of Big y, otherwise returns false.
     */
    P.lte = function (y) {
         return this.cmp(y) < 1;
    };


    /*
     * Return a new Big whose value is the value of this Big minus the value
     * of Big y.
     */
    P.sub = P.minus = function (y) {
        var i, j, t, xLTy,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        // Signs differ?
        if (a != b) {
            y.s = -b;
            return x.plus(y);
        }

        var xc = x.c.slice(),
            xe = x.e,
            yc = y.c,
            ye = y.e;

        // Either zero?
        if (!xc[0] || !yc[0]) {

            // y is non-zero? x is non-zero? Or both are zero.
            return yc[0] ? (y.s = -b, y) : new Big(xc[0] ? x : 0);
        }

        // Determine which is the bigger number.
        // Prepend zeros to equalise exponents.
        if (a = xe - ye) {

            if (xLTy = a < 0) {
                a = -a;
                t = xc;
            } else {
                ye = xe;
                t = yc;
            }

            t.reverse();
            for (b = a; b--; t.push(0)) {
            }
            t.reverse();
        } else {

            // Exponents equal. Check digit by digit.
            j = ((xLTy = xc.length < yc.length) ? xc : yc).length;

            for (a = b = 0; b < j; b++) {

                if (xc[b] != yc[b]) {
                    xLTy = xc[b] < yc[b];
                    break;
                }
            }
        }

        // x < y? Point xc to the array of the bigger number.
        if (xLTy) {
            t = xc;
            xc = yc;
            yc = t;
            y.s = -y.s;
        }

        /*
         * Append zeros to xc if shorter. No need to add zeros to yc if shorter
         * as subtraction only needs to start at yc.length.
         */
        if (( b = (j = yc.length) - (i = xc.length) ) > 0) {

            for (; b--; xc[i++] = 0) {
            }
        }

        // Subtract yc from xc.
        for (b = i; j > a;){

            if (xc[--j] < yc[j]) {

                for (i = j; i && !xc[--i]; xc[i] = 9) {
                }
                --xc[i];
                xc[j] += 10;
            }
            xc[j] -= yc[j];
        }

        // Remove trailing zeros.
        for (; xc[--b] === 0; xc.pop()) {
        }

        // Remove leading zeros and adjust exponent accordingly.
        for (; xc[0] === 0;) {
            xc.shift();
            --ye;
        }

        if (!xc[0]) {

            // n - n = +0
            y.s = 1;

            // Result must be zero.
            xc = [ye = 0];
        }

        y.c = xc;
        y.e = ye;

        return y;
    };


    /*
     * Return a new Big whose value is the value of this Big modulo the
     * value of Big y.
     */
    P.mod = function (y) {
        var yGTx,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        if (!y.c[0]) {
            throwErr(NaN);
        }

        x.s = y.s = 1;
        yGTx = y.cmp(x) == 1;
        x.s = a;
        y.s = b;

        if (yGTx) {
            return new Big(x);
        }

        a = Big.DP;
        b = Big.RM;
        Big.DP = Big.RM = 0;
        x = x.div(y);
        Big.DP = a;
        Big.RM = b;

        return this.minus( x.times(y) );
    };


    /*
     * Return a new Big whose value is the value of this Big plus the value
     * of Big y.
     */
    P.add = P.plus = function (y) {
        var t,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        // Signs differ?
        if (a != b) {
            y.s = -b;
            return x.minus(y);
        }

        var xe = x.e,
            xc = x.c,
            ye = y.e,
            yc = y.c;

        // Either zero?
        if (!xc[0] || !yc[0]) {

            // y is non-zero? x is non-zero? Or both are zero.
            return yc[0] ? y : new Big(xc[0] ? x : a * 0);
        }
        xc = xc.slice();

        // Prepend zeros to equalise exponents.
        // Note: Faster to use reverse then do unshifts.
        if (a = xe - ye) {

            if (a > 0) {
                ye = xe;
                t = yc;
            } else {
                a = -a;
                t = xc;
            }

            t.reverse();
            for (; a--; t.push(0)) {
            }
            t.reverse();
        }

        // Point xc to the longer array.
        if (xc.length - yc.length < 0) {
            t = yc;
            yc = xc;
            xc = t;
        }
        a = yc.length;

        /*
         * Only start adding at yc.length - 1 as the further digits of xc can be
         * left as they are.
         */
        for (b = 0; a;) {
            b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;
            xc[a] %= 10;
        }

        // No need to check for zero, as +x + +y != 0 && -x + -y != 0

        if (b) {
            xc.unshift(b);
            ++ye;
        }

         // Remove trailing zeros.
        for (a = xc.length; xc[--a] === 0; xc.pop()) {
        }

        y.c = xc;
        y.e = ye;

        return y;
    };


    /*
     * Return a Big whose value is the value of this Big raised to the power n.
     * If n is negative, round, if necessary, to a maximum of Big.DP decimal
     * places using rounding mode Big.RM.
     *
     * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
     */
    P.pow = function (n) {
        var x = this,
            one = new x.constructor(1),
            y = one,
            isNeg = n < 0;

        if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
            throwErr('!pow!');
        }

        n = isNeg ? -n : n;

        for (;;) {

            if (n & 1) {
                y = y.times(x);
            }
            n >>= 1;

            if (!n) {
                break;
            }
            x = x.times(x);
        }

        return isNeg ? one.div(y) : y;
    };


    /*
     * Return a new Big whose value is the value of this Big rounded to a
     * maximum of dp decimal places using rounding mode rm.
     * If dp is not specified, round to 0 decimal places.
     * If rm is not specified, use Big.RM.
     *
     * [dp] {number} Integer, 0 to MAX_DP inclusive.
     * [rm] 0, 1, 2 or 3 (ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP)
     */
    P.round = function (dp, rm) {
        var x = this,
            Big = x.constructor;

        if (dp == null) {
            dp = 0;
        } else if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throwErr('!round!');
        }
        rnd(x = new Big(x), dp, rm == null ? Big.RM : rm);

        return x;
    };


    /*
     * Return a new Big whose value is the square root of the value of this Big,
     * rounded, if necessary, to a maximum of Big.DP decimal places using
     * rounding mode Big.RM.
     */
    P.sqrt = function () {
        var estimate, r, approx,
            x = this,
            Big = x.constructor,
            xc = x.c,
            i = x.s,
            e = x.e,
            half = new Big('0.5');

        // Zero?
        if (!xc[0]) {
            return new Big(x);
        }

        // If negative, throw NaN.
        if (i < 0) {
            throwErr(NaN);
        }

        // Estimate.
        i = Math.sqrt(x.toString());

        // Math.sqrt underflow/overflow?
        // Pass x to Math.sqrt as integer, then adjust the result exponent.
        if (i === 0 || i === 1 / 0) {
            estimate = xc.join('');

            if (!(estimate.length + e & 1)) {
                estimate += '0';
            }

            r = new Big( Math.sqrt(estimate).toString() );
            r.e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
        } else {
            r = new Big(i.toString());
        }

        i = r.e + (Big.DP += 4);

        // Newton-Raphson iteration.
        do {
            approx = r;
            r = half.times( approx.plus( x.div(approx) ) );
        } while ( approx.c.slice(0, i).join('') !==
                       r.c.slice(0, i).join('') );

        rnd(r, Big.DP -= 4, Big.RM);

        return r;
    };


    /*
     * Return a new Big whose value is the value of this Big times the value of
     * Big y.
     */
    P.mul = P.times = function (y) {
        var c,
            x = this,
            Big = x.constructor,
            xc = x.c,
            yc = (y = new Big(y)).c,
            a = xc.length,
            b = yc.length,
            i = x.e,
            j = y.e;

        // Determine sign of result.
        y.s = x.s == y.s ? 1 : -1;

        // Return signed 0 if either 0.
        if (!xc[0] || !yc[0]) {
            return new Big(y.s * 0);
        }

        // Initialise exponent of result as x.e + y.e.
        y.e = i + j;

        // If array xc has fewer digits than yc, swap xc and yc, and lengths.
        if (a < b) {
            c = xc;
            xc = yc;
            yc = c;
            j = a;
            a = b;
            b = j;
        }

        // Initialise coefficient array of result with zeros.
        for (c = new Array(j = a + b); j--; c[j] = 0) {
        }

        // Multiply.

        // i is initially xc.length.
        for (i = b; i--;) {
            b = 0;

            // a is yc.length.
            for (j = a + i; j > i;) {

                // Current sum of products at this digit position, plus carry.
                b = c[j] + yc[i] * xc[j - i - 1] + b;
                c[j--] = b % 10;

                // carry
                b = b / 10 | 0;
            }
            c[j] = (c[j] + b) % 10;
        }

        // Increment result exponent if there is a final carry.
        if (b) {
            ++y.e;
        }

        // Remove any leading zero.
        if (!c[0]) {
            c.shift();
        }

        // Remove trailing zeros.
        for (i = c.length; !c[--i]; c.pop()) {
        }
        y.c = c;

        return y;
    };


    /*
     * Return a string representing the value of this Big.
     * Return exponential notation if this Big has a positive exponent equal to
     * or greater than Big.E_POS, or a negative exponent equal to or less than
     * Big.E_NEG.
     */
    P.toString = P.valueOf = P.toJSON = function () {
        var x = this,
            Big = x.constructor,
            e = x.e,
            str = x.c.join(''),
            strL = str.length;

        // Exponential notation?
        if (e <= Big.E_NEG || e >= Big.E_POS) {
            str = str.charAt(0) + (strL > 1 ? '.' + str.slice(1) : '') +
              (e < 0 ? 'e' : 'e+') + e;

        // Negative exponent?
        } else if (e < 0) {

            // Prepend zeros.
            for (; ++e; str = '0' + str) {
            }
            str = '0.' + str;

        // Positive exponent?
        } else if (e > 0) {

            if (++e > strL) {

                // Append zeros.
                for (e -= strL; e-- ; str += '0') {
                }
            } else if (e < strL) {
                str = str.slice(0, e) + '.' + str.slice(e);
            }

        // Exponent zero.
        } else if (strL > 1) {
            str = str.charAt(0) + '.' + str.slice(1);
        }

        // Avoid '-0'
        return x.s < 0 && x.c[0] ? '-' + str : str;
    };


    /*
     ***************************************************************************
     * If toExponential, toFixed, toPrecision and format are not required they
     * can safely be commented-out or deleted. No redundant code will be left.
     * format is used only by toExponential, toFixed and toPrecision.
     ***************************************************************************
     */


    /*
     * Return a string representing the value of this Big in exponential
     * notation to dp fixed decimal places and rounded, if necessary, using
     * Big.RM.
     *
     * [dp] {number} Integer, 0 to MAX_DP inclusive.
     */
    P.toExponential = function (dp) {

        if (dp == null) {
            dp = this.c.length - 1;
        } else if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throwErr('!toExp!');
        }

        return format(this, dp, 1);
    };


    /*
     * Return a string representing the value of this Big in normal notation
     * to dp fixed decimal places and rounded, if necessary, using Big.RM.
     *
     * [dp] {number} Integer, 0 to MAX_DP inclusive.
     */
    P.toFixed = function (dp) {
        var str,
            x = this,
            Big = x.constructor,
            neg = Big.E_NEG,
            pos = Big.E_POS;

        // Prevent the possibility of exponential notation.
        Big.E_NEG = -(Big.E_POS = 1 / 0);

        if (dp == null) {
            str = x.toString();
        } else if (dp === ~~dp && dp >= 0 && dp <= MAX_DP) {
            str = format(x, x.e + dp);

            // (-0).toFixed() is '0', but (-0.1).toFixed() is '-0'.
            // (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
            if (x.s < 0 && x.c[0] && str.indexOf('-') < 0) {
        //E.g. -0.5 if rounded to -0 will cause toString to omit the minus sign.
                str = '-' + str;
            }
        }
        Big.E_NEG = neg;
        Big.E_POS = pos;

        if (!str) {
            throwErr('!toFix!');
        }

        return str;
    };


    /*
     * Return a string representing the value of this Big rounded to sd
     * significant digits using Big.RM. Use exponential notation if sd is less
     * than the number of digits necessary to represent the integer part of the
     * value in normal notation.
     *
     * sd {number} Integer, 1 to MAX_DP inclusive.
     */
    P.toPrecision = function (sd) {

        if (sd == null) {
            return this.toString();
        } else if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
            throwErr('!toPre!');
        }

        return format(this, sd - 1, 2);
    };


    // Export


    Big = bigFactory();

    //AMD.
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return Big;
        });

    // Node and other CommonJS-like environments that support module.exports.
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = Big;

    //Browser.
    } else {
        global.Big = Big;
    }
})(this);

},{}],2:[function(require,module,exports){
var VNode = require('./vnode');
var is = require('./is');

function addNS(data, children, sel) {
  data.ns = 'http://www.w3.org/2000/svg';

  if (sel !== 'foreignObject' && children !== undefined) {
    for (var i = 0; i < children.length; ++i) {
      addNS(children[i].data, children[i].children, children[i].sel);
    }
  }
}

module.exports = function h(sel, b, c) {
  var data = {}, children, text, i;
  if (c !== undefined) {
    data = b;
    if (is.array(c)) { children = c; }
    else if (is.primitive(c)) { text = c; }
  } else if (b !== undefined) {
    if (is.array(b)) { children = b; }
    else if (is.primitive(b)) { text = b; }
    else { data = b; }
  }
  if (is.array(children)) {
    for (i = 0; i < children.length; ++i) {
      if (is.primitive(children[i])) children[i] = VNode(undefined, undefined, undefined, children[i]);
    }
  }
  if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g') {
    addNS(data, children, sel);
  }
  return VNode(sel, data, children, text, undefined);
};

},{"./is":4,"./vnode":11}],3:[function(require,module,exports){
function createElement(tagName){
  return document.createElement(tagName);
}

function createElementNS(namespaceURI, qualifiedName){
  return document.createElementNS(namespaceURI, qualifiedName);
}

function createTextNode(text){
  return document.createTextNode(text);
}


function insertBefore(parentNode, newNode, referenceNode){
  parentNode.insertBefore(newNode, referenceNode);
}


function removeChild(node, child){
  node.removeChild(child);
}

function appendChild(node, child){
  node.appendChild(child);
}

function parentNode(node){
  return node.parentElement;
}

function nextSibling(node){
  return node.nextSibling;
}

function tagName(node){
  return node.tagName;
}

function setTextContent(node, text){
  node.textContent = text;
}

module.exports = {
  createElement: createElement,
  createElementNS: createElementNS,
  createTextNode: createTextNode,
  appendChild: appendChild,
  removeChild: removeChild,
  insertBefore: insertBefore,
  parentNode: parentNode,
  nextSibling: nextSibling,
  tagName: tagName,
  setTextContent: setTextContent
};

},{}],4:[function(require,module,exports){
module.exports = {
  array: Array.isArray,
  primitive: function(s) { return typeof s === 'string' || typeof s === 'number'; },
};

},{}],5:[function(require,module,exports){
var NamespaceURIs = {
  "xlink": "http://www.w3.org/1999/xlink"
};

var booleanAttrs = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "compact", "controls", "declare",
                "default", "defaultchecked", "defaultmuted", "defaultselected", "defer", "disabled", "draggable",
                "enabled", "formnovalidate", "hidden", "indeterminate", "inert", "ismap", "itemscope", "loop", "multiple",
                "muted", "nohref", "noresize", "noshade", "novalidate", "nowrap", "open", "pauseonexit", "readonly",
                "required", "reversed", "scoped", "seamless", "selected", "sortable", "spellcheck", "translate",
                "truespeed", "typemustmatch", "visible"];

var booleanAttrsDict = Object.create(null);
for(var i=0, len = booleanAttrs.length; i < len; i++) {
  booleanAttrsDict[booleanAttrs[i]] = true;
}

function updateAttrs(oldVnode, vnode) {
  var key, cur, old, elm = vnode.elm,
      oldAttrs = oldVnode.data.attrs, attrs = vnode.data.attrs, namespaceSplit;

  if (!oldAttrs && !attrs) return;
  oldAttrs = oldAttrs || {};
  attrs = attrs || {};

  // update modified attributes, add new attributes
  for (key in attrs) {
    cur = attrs[key];
    old = oldAttrs[key];
    if (old !== cur) {
      if(!cur && booleanAttrsDict[key])
        elm.removeAttribute(key);
      else {
        namespaceSplit = key.split(":");
        if(namespaceSplit.length > 1 && NamespaceURIs.hasOwnProperty(namespaceSplit[0]))
          elm.setAttributeNS(NamespaceURIs[namespaceSplit[0]], key, cur);
        else
          elm.setAttribute(key, cur);
      }
    }
  }
  //remove removed attributes
  // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
  // the other option is to remove all attributes with value == undefined
  for (key in oldAttrs) {
    if (!(key in attrs)) {
      elm.removeAttribute(key);
    }
  }
}

module.exports = {create: updateAttrs, update: updateAttrs};

},{}],6:[function(require,module,exports){
function updateClass(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldClass = oldVnode.data.class,
      klass = vnode.data.class;

  if (!oldClass && !klass) return;
  oldClass = oldClass || {};
  klass = klass || {};

  for (name in oldClass) {
    if (!klass[name]) {
      elm.classList.remove(name);
    }
  }
  for (name in klass) {
    cur = klass[name];
    if (cur !== oldClass[name]) {
      elm.classList[cur ? 'add' : 'remove'](name);
    }
  }
}

module.exports = {create: updateClass, update: updateClass};

},{}],7:[function(require,module,exports){
function invokeHandler(handler, vnode, event) {
  if (typeof handler === "function") {
    // call function handler
    handler.call(vnode, event, vnode);
  } else if (typeof handler === "object") {
    // call handler with arguments
    if (typeof handler[0] === "function") {
      // special case for single argument for performance
      if (handler.length === 2) {
        handler[0].call(vnode, handler[1], event, vnode);
      } else {
        var args = handler.slice(1);
        args.push(event);
        args.push(vnode);
        handler[0].apply(vnode, args);
      }
    } else {
      // call multiple handlers
      for (var i = 0; i < handler.length; i++) {
        invokeHandler(handler[i]);
      }
    }
  }
}

function handleEvent(event, vnode) {
  var name = event.type,
      on = vnode.data.on;

  // call event handler(s) if exists
  if (on && on[name]) {
    invokeHandler(on[name], vnode, event);
  }
}

function createListener() {
  return function handler(event) {
    handleEvent(event, handler.vnode);
  }
}

function updateEventListeners(oldVnode, vnode) {
  var oldOn = oldVnode.data.on,
      oldListener = oldVnode.listener,
      oldElm = oldVnode.elm,
      on = vnode && vnode.data.on,
      elm = vnode && vnode.elm,
      name;

  // optimization for reused immutable handlers
  if (oldOn === on) {
    return;
  }

  // remove existing listeners which no longer used
  if (oldOn && oldListener) {
    // if element changed or deleted we remove all existing listeners unconditionally
    if (!on) {
      for (name in oldOn) {
        // remove listener if element was changed or existing listeners removed
        oldElm.removeEventListener(name, oldListener, false);
      }
    } else {
      for (name in oldOn) {
        // remove listener if existing listener removed
        if (!on[name]) {
          oldElm.removeEventListener(name, oldListener, false);
        }
      }
    }
  }

  // add new listeners which has not already attached
  if (on) {
    // reuse existing listener or create new
    var listener = vnode.listener = oldVnode.listener || createListener();
    // update vnode for listener
    listener.vnode = vnode;

    // if element changed or added we add all needed listeners unconditionally
    if (!oldOn) {
      for (name in on) {
        // add listener if element was changed or new listeners added
        elm.addEventListener(name, listener, false);
      }
    } else {
      for (name in on) {
        // add listener if new listener added
        if (!oldOn[name]) {
          elm.addEventListener(name, listener, false);
        }
      }
    }
  }
}

module.exports = {
  create: updateEventListeners,
  update: updateEventListeners,
  destroy: updateEventListeners
};

},{}],8:[function(require,module,exports){
function updateProps(oldVnode, vnode) {
  var key, cur, old, elm = vnode.elm,
      oldProps = oldVnode.data.props, props = vnode.data.props;

  if (!oldProps && !props) return;
  oldProps = oldProps || {};
  props = props || {};

  for (key in oldProps) {
    if (!props[key]) {
      delete elm[key];
    }
  }
  for (key in props) {
    cur = props[key];
    old = oldProps[key];
    if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
      elm[key] = cur;
    }
  }
}

module.exports = {create: updateProps, update: updateProps};

},{}],9:[function(require,module,exports){
var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;
var nextFrame = function(fn) { raf(function() { raf(fn); }); };

function setNextFrame(obj, prop, val) {
  nextFrame(function() { obj[prop] = val; });
}

function updateStyle(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldStyle = oldVnode.data.style,
      style = vnode.data.style;

  if (!oldStyle && !style) return;
  oldStyle = oldStyle || {};
  style = style || {};
  var oldHasDel = 'delayed' in oldStyle;

  for (name in oldStyle) {
    if (!style[name]) {
      elm.style[name] = '';
    }
  }
  for (name in style) {
    cur = style[name];
    if (name === 'delayed') {
      for (name in style.delayed) {
        cur = style.delayed[name];
        if (!oldHasDel || cur !== oldStyle.delayed[name]) {
          setNextFrame(elm.style, name, cur);
        }
      }
    } else if (name !== 'remove' && cur !== oldStyle[name]) {
      elm.style[name] = cur;
    }
  }
}

function applyDestroyStyle(vnode) {
  var style, name, elm = vnode.elm, s = vnode.data.style;
  if (!s || !(style = s.destroy)) return;
  for (name in style) {
    elm.style[name] = style[name];
  }
}

function applyRemoveStyle(vnode, rm) {
  var s = vnode.data.style;
  if (!s || !s.remove) {
    rm();
    return;
  }
  var name, elm = vnode.elm, idx, i = 0, maxDur = 0,
      compStyle, style = s.remove, amount = 0, applied = [];
  for (name in style) {
    applied.push(name);
    elm.style[name] = style[name];
  }
  compStyle = getComputedStyle(elm);
  var props = compStyle['transition-property'].split(', ');
  for (; i < props.length; ++i) {
    if(applied.indexOf(props[i]) !== -1) amount++;
  }
  elm.addEventListener('transitionend', function(ev) {
    if (ev.target === elm) --amount;
    if (amount === 0) rm();
  });
}

module.exports = {create: updateStyle, update: updateStyle, destroy: applyDestroyStyle, remove: applyRemoveStyle};

},{}],10:[function(require,module,exports){
// jshint newcap: false
/* global require, module, document, Node */
'use strict';

var VNode = require('./vnode');
var is = require('./is');
var domApi = require('./htmldomapi');

function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }

var emptyNode = VNode('', {}, [], undefined, undefined);

function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  var i, map = {}, key;
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) map[key] = i;
  }
  return map;
}

var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];

function init(modules, api) {
  var i, j, cbs = {};

  if (isUndef(api)) api = domApi;

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (modules[j][hooks[i]] !== undefined) cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }

  function emptyNodeAt(elm) {
    var id = elm.id ? '#' + elm.id : '';
    var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
    return VNode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
  }

  function createRmCb(childElm, listeners) {
    return function() {
      if (--listeners === 0) {
        var parent = api.parentNode(childElm);
        api.removeChild(parent, childElm);
      }
    };
  }

  function createElm(vnode, insertedVnodeQueue) {
    var i, data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) {
        i(vnode);
        data = vnode.data;
      }
    }
    var elm, children = vnode.children, sel = vnode.sel;
    if (isDef(sel)) {
      // Parse selector
      var hashIdx = sel.indexOf('#');
      var dotIdx = sel.indexOf('.', hashIdx);
      var hash = hashIdx > 0 ? hashIdx : sel.length;
      var dot = dotIdx > 0 ? dotIdx : sel.length;
      var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
      elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                                                          : api.createElement(tag);
      if (hash < dot) elm.id = sel.slice(hash + 1, dot);
      if (dotIdx > 0) elm.className = sel.slice(dot + 1).replace(/\./g, ' ');
      if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
          api.appendChild(elm, createElm(children[i], insertedVnodeQueue));
        }
      } else if (is.primitive(vnode.text)) {
        api.appendChild(elm, api.createTextNode(vnode.text));
      }
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
      i = vnode.data.hook; // Reuse variable
      if (isDef(i)) {
        if (i.create) i.create(emptyNode, vnode);
        if (i.insert) insertedVnodeQueue.push(vnode);
      }
    } else {
      elm = vnode.elm = api.createTextNode(vnode.text);
    }
    return vnode.elm;
  }

  function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      api.insertBefore(parentElm, createElm(vnodes[startIdx], insertedVnodeQueue), before);
    }
  }

  function invokeDestroyHook(vnode) {
    var i, j, data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) i(vnode);
      for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
      if (isDef(i = vnode.children)) {
        for (j = 0; j < vnode.children.length; ++j) {
          invokeDestroyHook(vnode.children[j]);
        }
      }
    }
  }

  function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var i, listeners, rm, ch = vnodes[startIdx];
      if (isDef(ch)) {
        if (isDef(ch.sel)) {
          invokeDestroyHook(ch);
          listeners = cbs.remove.length + 1;
          rm = createRmCb(ch.elm, listeners);
          for (i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm);
          if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
            i(ch, rm);
          } else {
            rm();
          }
        } else { // Text node
          api.removeChild(parentElm, ch.elm);
        }
      }
    }
  }

  function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
    var oldStartIdx = 0, newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, elmToMove, before;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        idxInOld = oldKeyToIdx[newStartVnode.key];
        if (isUndef(idxInOld)) { // New element
          api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        } else {
          elmToMove = oldCh[idxInOld];
          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
          oldCh[idxInOld] = undefined;
          api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        }
      }
    }
    if (oldStartIdx > oldEndIdx) {
      before = isUndef(newCh[newEndIdx+1]) ? null : newCh[newEndIdx+1].elm;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
    var i, hook;
    if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
      i(oldVnode, vnode);
    }
    var elm = vnode.elm = oldVnode.elm, oldCh = oldVnode.children, ch = vnode.children;
    if (oldVnode === vnode) return;
    if (!sameVnode(oldVnode, vnode)) {
      var parentElm = api.parentNode(oldVnode.elm);
      elm = createElm(vnode, insertedVnodeQueue);
      api.insertBefore(parentElm, elm, oldVnode.elm);
      removeVnodes(parentElm, [oldVnode], 0, 0);
      return;
    }
    if (isDef(vnode.data)) {
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
      i = vnode.data.hook;
      if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
    }
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue);
      } else if (isDef(ch)) {
        if (isDef(oldVnode.text)) api.setTextContent(elm, '');
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      } else if (isDef(oldVnode.text)) {
        api.setTextContent(elm, '');
      }
    } else if (oldVnode.text !== vnode.text) {
      api.setTextContent(elm, vnode.text);
    }
    if (isDef(hook) && isDef(i = hook.postpatch)) {
      i(oldVnode, vnode);
    }
  }

  return function(oldVnode, vnode) {
    var i, elm, parent;
    var insertedVnodeQueue = [];
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();

    if (isUndef(oldVnode.sel)) {
      oldVnode = emptyNodeAt(oldVnode);
    }

    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue);
    } else {
      elm = oldVnode.elm;
      parent = api.parentNode(elm);

      createElm(vnode, insertedVnodeQueue);

      if (parent !== null) {
        api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
        removeVnodes(parent, [oldVnode], 0, 0);
      }
    }

    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
    }
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
    return vnode;
  };
}

module.exports = {init: init};

},{"./htmldomapi":3,"./is":4,"./vnode":11}],11:[function(require,module,exports){
module.exports = function(sel, data, children, text, elm) {
  var key = data === undefined ? undefined : data.key;
  return {sel: sel, data: data, children: children,
          text: text, elm: elm, key: key};
};

},{}],12:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _snabbdom = require("snabbdom");

var _snabbdom2 = _interopRequireDefault(_snabbdom);

var _h = require("snabbdom/h");

var _h2 = _interopRequireDefault(_h);

var _big = require("big.js");

var _big2 = _interopRequireDefault(_big);

var _ugnis = require("./ugnis");

var _ugnis2 = _interopRequireDefault(_ugnis);

var _app = require("../ugnis_components/app.json");

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function updateProps(oldVnode, vnode) {
    var key,
        cur,
        old,
        elm = vnode.elm,
        props = vnode.data.liveProps || {};
    for (key in props) {
        cur = props[key];
        old = elm[key];
        if (old !== cur) elm[key] = cur;
    }
}
var livePropsPlugin = { create: updateProps, update: updateProps };

var patch = _snabbdom2.default.init([require('snabbdom/modules/class'), require('snabbdom/modules/props'), require('snabbdom/modules/style'), require('snabbdom/modules/eventlisteners'), require('snabbdom/modules/attributes'), livePropsPlugin]);

function uuid() {
    return ("" + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/1|0/g, function () {
        return (0 | Math.random() * 16).toString(16);
    });
}

_big2.default.E_POS = 1e+6;

editor(_app2.default);

function editor(appDefinition) {

    //app.vdom.elm.parentNode

    var app = (0, _ugnis2.default)(appDefinition);

    var node = document.createElement('div');
    document.body.appendChild(node);

    // State
    var state = {
        leftOpen: true,
        rightOpen: true,
        editorRightWidth: 350,
        editorLeftWidth: 350,
        subEditorWidth: 350,
        appIsFrozen: false,
        selectedViewNode: {},
        selectedEventId: '',
        selectedPipeId: '',
        selectedStateNodeId: '',
        selectedViewSubMenu: 'props',
        editingTitleNodeId: '',
        activeEvent: '',
        viewFoldersClosed: {},
        definition: app.definition
    };
    // undo/redo
    var stateStack = [state];
    function setState(newState, pushToStack) {
        if (newState === state) {
            console.warn('state was mutated, search for a bug');
        }
        // some actions should not be recorded and controlled through undo/redo
        if (pushToStack) {
            var currentIndex = stateStack.findIndex(function (a) {
                return a === state;
            });
            stateStack = stateStack.slice(0, currentIndex + 1).concat(newState);
        } else {
            // overwrite current
            stateStack[stateStack.findIndex(function (a) {
                return a === state;
            })] = newState;
        }
        if (state.appIsFrozen !== newState.appIsFrozen || state.selectedViewNode !== newState.selectedViewNode) {
            app._freeze(newState.appIsFrozen, VIEW_NODE_SELECTED, newState.selectedViewNode);
        }
        if (state.definition !== newState.definition) {
            // TODO add garbage collection?
            app.render(newState.definition);
        }
        state = newState;
        render();
    }
    document.addEventListener('click', function (e) {
        // clicked outside
        if (state.editingTitleNodeId && !e.target.dataset.istitleeditor) {
            setState(_extends({}, state, { editingTitleNodeId: '' }));
        }
    });
    document.addEventListener('keydown', function (e) {
        // 83 - s
        // 90 - z
        // 89 - y
        // 32 - space
        // 13 - enter
        if (e.which == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
            // TODO garbage collect
            e.preventDefault();
            fetch('/save', { method: 'POST', body: JSON.stringify(state.definition), headers: { "Content-Type": "application/json" } });
            return false;
        }
        if (e.which == 32 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
            e.preventDefault();
            FREEZER_CLICKED();
        }
        if (!e.shiftKey && e.which == 90 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
            e.preventDefault();
            var currentIndex = stateStack.findIndex(function (a) {
                return a === state;
            });
            if (currentIndex > 0) {
                var newState = stateStack[currentIndex - 1];
                if (state.definition !== newState.definition) {
                    app.render(newState.definition);
                }
                state = newState;
                render();
            }
        }
        if (e.which == 89 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) || e.shiftKey && e.which == 90 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
            e.preventDefault();
            var _currentIndex = stateStack.findIndex(function (a) {
                return a === state;
            });
            if (_currentIndex < stateStack.length - 1) {
                var _newState = stateStack[_currentIndex + 1];
                if (state.definition !== _newState.definition) {
                    app.render(_newState.definition);
                }
                state = _newState;
                render();
            }
        }
        if (e.which == 13) {
            setState(_extends({}, state, { editingTitleNodeId: '' }));
        }
    });

    // Actions
    function WIDTH_DRAGGED(widthName, e) {
        e.preventDefault();
        function resize(e) {
            e.preventDefault();
            var newWidth = window.innerWidth - (e.touches ? e.touches[0].pageX : e.pageX);
            if (widthName === 'editorLeftWidth') {
                newWidth = e.touches ? e.touches[0].pageX : e.pageX;
            }
            if (widthName === 'subEditorWidth') {
                newWidth = newWidth - state.editorRightWidth - 10;
            }
            // I probably was drunk
            if (widthName !== 'subEditorWidth' && ((widthName === 'editorLeftWidth' ? state.leftOpen : state.rightOpen) ? newWidth < 180 : newWidth > 180)) {
                if (widthName === 'editorLeftWidth') {
                    return setState(_extends({}, state, { leftOpen: !state.leftOpen }));
                }
                return setState(_extends({}, state, { rightOpen: !state.rightOpen }));
            }
            if (newWidth < 250) {
                newWidth = 250;
            }
            setState(_extends({}, state, _defineProperty({}, widthName, newWidth)));
            return false;
        }
        window.addEventListener('mousemove', resize);
        window.addEventListener('touchmove', resize);
        function stopDragging(e) {
            e.preventDefault();
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('touchmove', resize);
            window.removeEventListener('mouseup', stopDragging);
            window.removeEventListener('touchend', stopDragging);
            return false;
        }
        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchend', stopDragging);
        return false;
    }
    function FREEZER_CLICKED() {
        setState(_extends({}, state, { appIsFrozen: !state.appIsFrozen }));
    }
    function VIEW_FOLDER_CLICKED(nodeId) {
        setState(_extends({}, state, { viewFoldersClosed: _extends({}, state.viewFoldersClosed, _defineProperty({}, nodeId, !state.viewFoldersClosed[nodeId])) }));
    }
    function VIEW_NODE_SELECTED(ref) {
        setState(_extends({}, state, { selectedViewNode: ref }));
    }
    function UNSELECT_VIEW_NODE(e) {
        if (e.target === this.elm) {
            setState(_extends({}, state, { selectedViewNode: {} }));
        }
    }
    function STATE_NODE_SELECTED(nodeId) {
        setState(_extends({}, state, { selectedStateNodeId: nodeId }));
    }
    function UNSELECT_STATE_NODE(e) {
        if (e.target === this.elm) {
            setState(_extends({}, state, { selectedStateNodeId: '', selectedEventId: '' }));
        }
    }
    function DELETE_SELECTED_VIEW(nodeRef, parentRef, e) {
        e.stopPropagation();
        if (nodeRef.id === '_rootNode') {
            // immutably remove all nodes except rootNode
            return setState(_extends({}, state, { definition: _extends({}, state.definition, {
                    vNodeBox: { '_rootNode': _extends({}, state.definition.vNodeBox['_rootNode'], { children: [] }) }
                }), selectedViewNode: {} }), true);
        }
        setState(_extends({}, state, { definition: _extends({}, state.definition, _defineProperty({}, parentRef.ref, _extends({}, state.definition[parentRef.ref], _defineProperty({}, parentRef.id, _extends({}, state.definition[parentRef.ref][parentRef.id], { children: state.definition[parentRef.ref][parentRef.id].children.filter(function (ref) {
                    return ref.id !== nodeRef.id;
                }) }))))), selectedViewNode: {} }), true);
    }
    function ADD_NODE(nodeRef, type) {
        var nodeId = nodeRef.id;
        var newNodeId = uuid();
        var newStyleId = uuid();
        var newStyle = {
            padding: '10px'
        };
        if (type === 'box') {
            var _extends6, _extends11;

            var newNode = {
                title: 'box',
                style: { ref: 'style', id: newStyleId },
                children: []
            };
            return setState(_extends({}, state, {
                selectedViewNode: { ref: 'vNodeBox', id: newNodeId },
                definition: nodeRef.ref === 'vNodeBox' ? _extends({}, state.definition, {
                    vNodeBox: _extends({}, state.definition.vNodeBox, (_extends6 = {}, _defineProperty(_extends6, nodeId, _extends({}, state.definition.vNodeBox[nodeId], { children: state.definition.vNodeBox[nodeId].children.concat({ ref: 'vNodeBox', id: newNodeId }) })), _defineProperty(_extends6, newNodeId, newNode), _extends6)),
                    style: _extends({}, state.definition.style, _defineProperty({}, newStyleId, newStyle))
                }) : _extends({}, state.definition, (_extends11 = {}, _defineProperty(_extends11, nodeRef.ref, _extends({}, state.definition[nodeRef.ref], _defineProperty({}, nodeId, _extends({}, state.definition[nodeRef.ref][nodeId], { children: state.definition[nodeRef.ref][nodeId].children.concat({ ref: 'vNodeBox', id: newNodeId }) })))), _defineProperty(_extends11, "vNodeBox", _extends({}, state.definition.vNodeBox, _defineProperty({}, newNodeId, newNode))), _defineProperty(_extends11, "style", _extends({}, state.definition.style, _defineProperty({}, newStyleId, newStyle))), _extends11))
            }), true);
        }
        if (type === 'text') {
            var _extends16;

            var pipeId = uuid();
            var _newNode = {
                title: 'text',
                style: { ref: 'style', id: newStyleId },
                value: { ref: 'pipe', id: pipeId }
            };
            var newPipe = {
                type: 'text',
                value: 'Default Text',
                transformations: []
            };
            return setState(_extends({}, state, {
                selectedViewNode: { ref: 'vNodeText', id: newNodeId },
                definition: _extends({}, state.definition, (_extends16 = {
                    pipe: _extends({}, state.definition.pipe, _defineProperty({}, pipeId, newPipe))
                }, _defineProperty(_extends16, nodeRef.ref, _extends({}, state.definition[nodeRef.ref], _defineProperty({}, nodeId, _extends({}, state.definition[nodeRef.ref][nodeId], { children: state.definition[nodeRef.ref][nodeId].children.concat({ ref: 'vNodeText', id: newNodeId }) })))), _defineProperty(_extends16, "vNodeText", _extends({}, state.definition.vNodeText, _defineProperty({}, newNodeId, _newNode))), _defineProperty(_extends16, "style", _extends({}, state.definition.style, _defineProperty({}, newStyleId, newStyle))), _extends16)) }), true);
        }
        if (type === 'input') {
            var _extends17, _extends25;

            var stateId = uuid();
            var eventId = uuid();
            var mutatorId = uuid();
            var pipeInputId = uuid();
            var pipeMutatorId = uuid();
            var _newNode2 = {
                title: 'input',
                style: { ref: 'style', id: newStyleId },
                value: { ref: 'pipe', id: pipeInputId },
                input: { ref: 'event', id: eventId }
            };
            var newPipeInput = {
                type: 'text',
                value: { ref: 'state', id: stateId },
                transformations: []
            };
            var newPipeMutator = {
                type: 'text',
                value: { ref: 'eventData', id: '_input' },
                transformations: []
            };
            var newState = {
                title: 'input value',
                type: 'text',
                ref: stateId,
                defaultValue: 'Default text',
                mutators: [{ ref: 'mutator', id: mutatorId }]
            };
            var newMutator = {
                event: { ref: 'event', id: eventId },
                state: { ref: 'state', id: stateId },
                mutation: { ref: 'pipe', id: pipeMutatorId }
            };
            var newEvent = {
                title: 'update input',
                mutators: [{ ref: 'mutator', id: mutatorId }],
                data: [{ ref: 'eventData', id: '_input' }]
            };
            return setState(_extends({}, state, {
                selectedViewNode: { ref: 'vNodeInput', id: newNodeId },
                definition: _extends({}, state.definition, (_extends25 = {
                    pipe: _extends({}, state.definition.pipe, (_extends17 = {}, _defineProperty(_extends17, pipeInputId, newPipeInput), _defineProperty(_extends17, pipeMutatorId, newPipeMutator), _extends17))
                }, _defineProperty(_extends25, nodeRef.ref, _extends({}, state.definition[nodeRef.ref], _defineProperty({}, nodeId, _extends({}, state.definition[nodeRef.ref][nodeId], { children: state.definition[nodeRef.ref][nodeId].children.concat({ ref: 'vNodeInput', id: newNodeId }) })))), _defineProperty(_extends25, "vNodeInput", _extends({}, state.definition.vNodeInput, _defineProperty({}, newNodeId, _newNode2))), _defineProperty(_extends25, "style", _extends({}, state.definition.style, _defineProperty({}, newStyleId, newStyle))), _defineProperty(_extends25, "nameSpace", _extends({}, state.definition.nameSpace, _defineProperty({}, '_rootNameSpace', _extends({}, state.definition.nameSpace['_rootNameSpace'], { children: state.definition.nameSpace['_rootNameSpace'].children.concat({ ref: 'state', id: stateId }) })))), _defineProperty(_extends25, "state", _extends({}, state.definition.state, _defineProperty({}, stateId, newState))), _defineProperty(_extends25, "mutator", _extends({}, state.definition.mutator, _defineProperty({}, mutatorId, newMutator))), _defineProperty(_extends25, "event", _extends({}, state.definition.event, _defineProperty({}, eventId, newEvent))), _extends25)) }), true);
        }
    }
    function ADD_STATE(namespaceId, type) {
        var newStateId = uuid();
        var newState = void 0;
        if (type === 'text') {
            newState = {
                title: 'new text',
                ref: newStateId,
                type: 'text',
                defaultValue: 'Default text',
                mutators: []
            };
        }
        if (type === 'number') {
            newState = {
                title: 'new number',
                ref: newStateId,
                type: 'number',
                defaultValue: 0,
                mutators: []
            };
        }
        if (type === 'boolean') {
            newState = {
                title: 'new boolean',
                type: 'boolean',
                ref: newStateId,
                defaultValue: true,
                mutators: []
            };
        }
        if (type === 'table') {
            newState = {
                title: 'new table',
                type: 'table',
                ref: newStateId,
                defaultValue: {},
                mutators: []
            };
        }
        if (type === 'namespace') {
            var _extends26;

            newState = {
                title: 'new namespace',
                children: []
            };
            return setState(_extends({}, state, { definition: _extends({}, state.definition, {
                    nameSpace: _extends({}, state.definition.nameSpace, (_extends26 = {}, _defineProperty(_extends26, namespaceId, _extends({}, state.definition.nameSpace[namespaceId], { children: state.definition.nameSpace[namespaceId].children.concat({ ref: 'nameSpace', id: newStateId }) })), _defineProperty(_extends26, newStateId, newState), _extends26))
                }) }), true);
        }
        setState(_extends({}, state, { definition: _extends({}, state.definition, {
                nameSpace: _extends({}, state.definition.nameSpace, _defineProperty({}, namespaceId, _extends({}, state.definition.nameSpace[namespaceId], { children: state.definition.nameSpace[namespaceId].children.concat({ ref: 'state', id: newStateId }) }))),
                state: _extends({}, state.definition.state, _defineProperty({}, newStateId, newState))
            }) }), true);
    }
    function CHANGE_STYLE(styleId, key, e) {
        e.preventDefault();
        // and now I really regret not using immutable or ramda lenses
        setState(_extends({}, state, { definition: _extends({}, state.definition, { style: _extends({}, state.definition.style, _defineProperty({}, styleId, _extends({}, state.definition.style[styleId], _defineProperty({}, key, e.target.value)))) }) }), true);
    }
    function ADD_DEFAULT_STYLE(styleId, key) {
        setState(_extends({}, state, { definition: _extends({}, state.definition, { style: _extends({}, state.definition.style, _defineProperty({}, styleId, _extends({}, state.definition.style[styleId], _defineProperty({}, key, 'default')))) }) }), true);
    }
    function SELECT_VIEW_SUBMENU(newId) {
        setState(_extends({}, state, { selectedViewSubMenu: newId }));
    }
    function EDIT_VIEW_NODE_TITLE(nodeId) {
        setState(_extends({}, state, { editingTitleNodeId: nodeId }));
    }
    function EDIT_EVENT_TITLE(nodeId) {
        setState(_extends({}, state, { editingTitleNodeId: nodeId }));
    }
    function CHANGE_EVENT_TITLE(nodeId, e) {
        e.preventDefault();
        setState(_extends({}, state, { definition: _extends({}, state.definition, {
                event: _extends({}, state.definition.event, _defineProperty({}, nodeId, _extends({}, state.definition.event[nodeId], {
                    title: e.target.value
                })))
            }) }), true);
    }
    function CHANGE_VIEW_NODE_TITLE(nodeRef, e) {
        e.preventDefault();
        var nodeId = nodeRef.id;
        var nodeType = nodeRef.ref;
        setState(_extends({}, state, { definition: _extends({}, state.definition, _defineProperty({}, nodeType, _extends({}, state.definition[nodeType], _defineProperty({}, nodeId, _extends({}, state.definition[nodeType][nodeId], { title: e.target.value }))))) }), true);
    }
    function CHANGE_STATE_NODE_TITLE(nodeId, e) {
        e.preventDefault();
        setState(_extends({}, state, { definition: _extends({}, state.definition, {
                state: _extends({}, state.definition.state, _defineProperty({}, nodeId, _extends({}, state.definition.state[nodeId], { title: e.target.value })))
            }) }), true);
    }
    function CHANGE_NAMESPACE_TITLE(nodeId, e) {
        e.preventDefault();
        setState(_extends({}, state, { definition: _extends({}, state.definition, {
                nameSpace: _extends({}, state.definition.nameSpace, _defineProperty({}, nodeId, _extends({}, state.definition.nameSpace[nodeId], { title: e.target.value })))
            }) }), true);
    }
    function CHANGE_CURRENT_STATE_TEXT_VALUE(stateId, e) {
        app.setCurrentState(_extends({}, app.getCurrentState(), _defineProperty({}, stateId, e.target.value)));
        render();
    }
    function CHANGE_CURRENT_STATE_NUMBER_VALUE(stateId, e) {
        // todo big throws error instead of returning NaN... fix, rewrite or hack
        try {
            if ((0, _big2.default)(e.target.value).toString() !== app.getCurrentState()[stateId].toString()) {
                app.setCurrentState(_extends({}, app.getCurrentState(), _defineProperty({}, stateId, (0, _big2.default)(e.target.value))));
                render();
            }
        } catch (err) {}
    }
    function INCREMENT_CURRENT_STATE_NUMBER_VALUE(stateId) {
        app.setCurrentState(_extends({}, app.getCurrentState(), _defineProperty({}, stateId, (0, _big2.default)(app.getCurrentState()[stateId]).add(1))));
        render();
    }
    function DECREMENT_CURRENT_STATE_NUMBER_VALUE(stateId) {
        app.setCurrentState(_extends({}, app.getCurrentState(), _defineProperty({}, stateId, (0, _big2.default)(app.getCurrentState()[stateId]).add(-1))));
        render();
    }
    function SELECT_EVENT(eventId) {
        setState(_extends({}, state, { selectedEventId: eventId }));
    }
    function CHANGE_STATIC_VALUE(ref, propertyName, type, e) {
        var value = e.target.value;
        if (type === 'number') {
            try {
                value = (0, _big2.default)(e.target.value);
            } catch (err) {
                return;
            }
        }
        setState(_extends({}, state, { definition: _extends({}, state.definition, _defineProperty({}, ref.ref, _extends({}, state.definition[ref.ref], _defineProperty({}, ref.id, _extends({}, state.definition[ref.ref][ref.id], _defineProperty({}, propertyName, value)))))) }), true);
    }
    function ADD_EVENT(propertyName) {
        var _extends48;

        var ref = state.selectedViewNode;
        var eventId = uuid();
        setState(_extends({}, state, { definition: _extends({}, state.definition, (_extends48 = {}, _defineProperty(_extends48, ref.ref, _extends({}, state.definition[ref.ref], _defineProperty({}, ref.id, _extends({}, state.definition[ref.ref][ref.id], _defineProperty({}, propertyName, { ref: 'event', id: eventId }))))), _defineProperty(_extends48, "event", _extends({}, state.definition.event, _defineProperty({}, eventId, {
                title: 'On ' + propertyName,
                mutators: []
            }))), _extends48)) }), true);
    }
    function ADD_MUTATOR(stateId, eventId) {
        var mutatorId = uuid();
        var pipeId = uuid();
        setState(_extends({}, state, { definition: _extends({}, state.definition, {
                pipe: _extends({}, state.definition.pipe, _defineProperty({}, pipeId, {
                    type: state.definition.state[stateId].type,
                    value: state.definition.state[stateId].defaultValue,
                    transformations: []
                })),
                state: _extends({}, state.definition.state, _defineProperty({}, stateId, _extends({}, state.definition.state[stateId], {
                    mutators: state.definition.state[stateId].mutators.concat({
                        ref: 'mutator',
                        id: mutatorId
                    })
                }))),
                mutator: _extends({}, state.definition.mutator, _defineProperty({}, mutatorId, {
                    event: {
                        ref: "event",
                        id: eventId
                    },
                    state: {
                        ref: "state",
                        id: stateId
                    },
                    mutation: {
                        ref: "pipe",
                        id: pipeId
                    }
                })),
                event: _extends({}, state.definition.event, _defineProperty({}, eventId, _extends({}, state.definition.event[eventId], {
                    mutators: state.definition.event[eventId].mutators.concat({
                        ref: 'mutator',
                        id: mutatorId
                    })
                })))
            }) }), true);
    }
    function MOVE_VIEW_NODE(parentRef, position, amount, e) {
        e.preventDefault();
        e.stopPropagation();
        setState(_extends({}, state, { definition: _extends({}, state.definition, _defineProperty({}, parentRef.ref, _extends({}, state.definition[parentRef.ref], _defineProperty({}, parentRef.id, _extends({}, state.definition[parentRef.ref][parentRef.id], {
                children: state.definition[parentRef.ref][parentRef.id].children.map( // functional swap
                function (child, index) {
                    return index === position + amount ? state.definition[parentRef.ref][parentRef.id].children[position] : index === position ? state.definition[parentRef.ref][parentRef.id].children[position + amount] : state.definition[parentRef.ref][parentRef.id].children[index];
                })
            }))))) }), true);
    }
    function SELECT_PIPE(pipeId) {
        setState(_extends({}, state, { selectedPipeId: pipeId }));
    }
    function CHANGE_PIPE_VALUE_TO_STATE(pipeId) {
        if (!state.selectedStateNodeId || state.selectedStateNodeId === state.definition.pipe[pipeId].value.id) {
            return;
        }
        setState(_extends({}, state, { definition: _extends({}, state.definition, {
                pipe: _extends({}, state.definition.pipe, _defineProperty({}, pipeId, _extends({}, state.definition.pipe[pipeId], {
                    value: { ref: 'state', id: state.selectedStateNodeId },
                    transformations: []
                })))
            }) }), true);
    }
    function ADD_TRANSFORMATION(pipeId, transformation) {
        if (transformation === 'join') {
            var _extends57;

            var newPipeId = uuid();
            var joinId = uuid();
            setState(_extends({}, state, { definition: _extends({}, state.definition, {
                    join: _extends({}, state.definition.join, _defineProperty({}, joinId, {
                        value: { ref: 'pipe', id: newPipeId }
                    })),
                    pipe: _extends({}, state.definition.pipe, (_extends57 = {}, _defineProperty(_extends57, newPipeId, {
                        type: 'text',
                        value: 'Default text',
                        transformations: []
                    }), _defineProperty(_extends57, pipeId, _extends({}, state.definition.pipe[pipeId], {
                        transformations: state.definition.pipe[pipeId].transformations.concat({ ref: 'join', id: joinId })
                    })), _extends57))
                }) }), true);
        }
        if (transformation === 'toUpperCase') {
            var newId = uuid();
            setState(_extends({}, state, { definition: _extends({}, state.definition, {
                    toUpperCase: _extends({}, state.definition.toUpperCase, _defineProperty({}, newId, {})),
                    pipe: _extends({}, state.definition.pipe, _defineProperty({}, pipeId, _extends({}, state.definition.pipe[pipeId], {
                        transformations: state.definition.pipe[pipeId].transformations.concat({ ref: 'toUpperCase', id: newId })
                    })))
                }) }), true);
        }
        if (transformation === 'toLowerCase') {
            var _newId = uuid();
            setState(_extends({}, state, { definition: _extends({}, state.definition, {
                    toLowerCase: _extends({}, state.definition.toLowerCase, _defineProperty({}, _newId, {})),
                    pipe: _extends({}, state.definition.pipe, _defineProperty({}, pipeId, _extends({}, state.definition.pipe[pipeId], {
                        transformations: state.definition.pipe[pipeId].transformations.concat({ ref: 'toLowerCase', id: _newId })
                    })))
                }) }), true);
        }
        if (transformation === 'toText') {
            var _newId2 = uuid();
            setState(_extends({}, state, { definition: _extends({}, state.definition, {
                    toText: _extends({}, state.definition.toText, _defineProperty({}, _newId2, {})),
                    pipe: _extends({}, state.definition.pipe, _defineProperty({}, pipeId, _extends({}, state.definition.pipe[pipeId], {
                        transformations: state.definition.pipe[pipeId].transformations.concat({ ref: 'toText', id: _newId2 })
                    })))
                }) }), true);
        }
        if (transformation === 'add') {
            var _extends65;

            var _newPipeId = uuid();
            var addId = uuid();
            setState(_extends({}, state, { definition: _extends({}, state.definition, {
                    add: _extends({}, state.definition.add, _defineProperty({}, addId, {
                        value: { ref: 'pipe', id: _newPipeId }
                    })),
                    pipe: _extends({}, state.definition.pipe, (_extends65 = {}, _defineProperty(_extends65, _newPipeId, {
                        type: 'number',
                        value: 0,
                        transformations: []
                    }), _defineProperty(_extends65, pipeId, _extends({}, state.definition.pipe[pipeId], {
                        transformations: state.definition.pipe[pipeId].transformations.concat({ ref: 'add', id: addId })
                    })), _extends65))
                }) }), true);
        }
        if (transformation === 'subtract') {
            var _extends67;

            var _newPipeId2 = uuid();
            var subtractId = uuid();
            setState(_extends({}, state, { definition: _extends({}, state.definition, {
                    subtract: _extends({}, state.definition.subtract, _defineProperty({}, subtractId, {
                        value: { ref: 'pipe', id: _newPipeId2 }
                    })),
                    pipe: _extends({}, state.definition.pipe, (_extends67 = {}, _defineProperty(_extends67, _newPipeId2, {
                        type: 'number',
                        value: 0,
                        transformations: []
                    }), _defineProperty(_extends67, pipeId, _extends({}, state.definition.pipe[pipeId], {
                        transformations: state.definition.pipe[pipeId].transformations.concat({ ref: 'subtract', id: subtractId })
                    })), _extends67))
                }) }), true);
        }
    }

    // Listen to app and blink every action
    var timer = null;
    var eventStack = [];
    app.addListener(function (eventName, data, e, previousState, currentState, mutations) {
        eventStack.push({ eventName: eventName, data: data, e: e, previousState: previousState, currentState: currentState, mutations: mutations });
        setState(_extends({}, state, { activeEvent: eventName }));
        // yeah, I probably needed some observables too
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(function () {
            setState(_extends({}, state, { activeEvent: '' }));
        }, 500);
    });

    // Render
    function render() {
        var currentState = app.getCurrentState();
        var dragComponentLeft = (0, _h2.default)('div', {
            on: {
                mousedown: [WIDTH_DRAGGED, 'editorLeftWidth'],
                touchstart: [WIDTH_DRAGGED, 'editorLeftWidth']
            },
            attrs: {},
            style: {
                position: 'absolute',
                right: '0',
                transform: 'translateX(100%)',
                top: '0',
                width: '10px',
                height: '100%',
                textAlign: 'center',
                fontSize: '1em',
                opacity: '0',
                cursor: 'col-resize'
            }
        });
        var dragComponentRight = (0, _h2.default)('div', {
            on: {
                mousedown: [WIDTH_DRAGGED, 'editorRightWidth'],
                touchstart: [WIDTH_DRAGGED, 'editorRightWidth']
            },
            attrs: {},
            style: {
                position: 'absolute',
                left: '0',
                transform: 'translateX(-100%)',
                top: '0',
                width: '10px',
                height: '100%',
                textAlign: 'center',
                fontSize: '1em',
                opacity: '0',
                cursor: 'col-resize'
            }
        });
        var dragSubComponent = (0, _h2.default)('div', {
            on: {
                mousedown: [WIDTH_DRAGGED, 'subEditorWidth'],
                touchstart: [WIDTH_DRAGGED, 'subEditorWidth']
            },
            attrs: {},
            style: {
                position: 'absolute',
                left: '2px',
                transform: 'translateX(-100%)',
                top: '0',
                width: '10px',
                height: '100%',
                textAlign: 'center',
                fontSize: '1em',
                opacity: 0,
                cursor: 'col-resize'
            }
        });

        function emberEditor(ref, type) {
            var pipe = state.definition[ref.ref][ref.id];

            function listTransformations(transformations, transType) {
                return transformations.map(function (transRef, index) {
                    var transformer = state.definition[transRef.ref][transRef.id];
                    // if (transRef.ref === 'equal') {
                    //     return h('div', {}, [
                    //         h('div', {style: {color: '#bdbdbd', cursor: 'default', display:'flex'}}, [h('span', {style: {flex: '1'}}, transRef.ref), h('span', {style: {flex: '0'}}, transType)]),
                    //         emberEditor(transformer.value, type)
                    //     ])
                    // }
                    if (transRef.ref === 'add') {
                        return (0, _h2.default)('div', {}, [(0, _h2.default)('div', { key: index, style: { color: '#bdbdbd', cursor: 'default', display: 'flex' } }, [(0, _h2.default)('span', { style: { flex: '1' } }, transRef.ref), (0, _h2.default)('span', { style: { flex: '0', color: transformations.length - 1 !== index ? '#bdbdbd' : transType === type ? 'green' : 'red' } }, 'number')]), (0, _h2.default)('div', { style: { paddingLeft: '15px' } }, [emberEditor(transformer.value, transType)])]);
                    }
                    if (transRef.ref === 'subtract') {
                        return (0, _h2.default)('div', {}, [(0, _h2.default)('div', { key: index, style: { color: '#bdbdbd', cursor: 'default', display: 'flex' } }, [(0, _h2.default)('span', { style: { flex: '1' } }, transRef.ref), (0, _h2.default)('span', { style: { flex: '0', color: transformations.length - 1 !== index ? '#bdbdbd' : transType === type ? 'green' : 'red' } }, 'number')]), (0, _h2.default)('div', { style: { paddingLeft: '15px' } }, [emberEditor(transformer.value, transType)])]);
                    }
                    // if (transRef.ref === 'branch') {
                    //     if(resolve(transformer.predicate)){
                    //         value = transformValue(value, transformer.then)
                    //     } else {
                    //         value = transformValue(value, transformer.else)
                    //     }
                    // }
                    if (transRef.ref === 'join') {
                        return (0, _h2.default)('div', {}, [(0, _h2.default)('div', { style: { color: '#bdbdbd', cursor: 'default', display: 'flex' } }, [(0, _h2.default)('span', { style: { flex: '1' } }, transRef.ref), (0, _h2.default)('span', { style: { flex: '0', color: transformations.length - 1 !== index ? '#bdbdbd' : transType === type ? 'green' : 'red' } }, 'text')]), (0, _h2.default)('div', { style: { paddingLeft: '15px' } }, [emberEditor(transformer.value, transType)])]);
                    }
                    if (transRef.ref === 'toUpperCase') {
                        return (0, _h2.default)('div', {}, [(0, _h2.default)('div', { style: { cursor: 'default', display: 'flex' } }, [(0, _h2.default)('span', { style: { flex: '1', color: '#bdbdbd' } }, transRef.ref), (0, _h2.default)('span', { style: { flex: '0', color: transformations.length - 1 !== index ? '#bdbdbd' : transType === type ? 'green' : 'red' } }, 'text')])]);
                    }
                    if (transRef.ref === 'toLowerCase') {
                        return (0, _h2.default)('div', {}, [(0, _h2.default)('div', { style: { cursor: 'default', display: 'flex' } }, [(0, _h2.default)('span', { style: { flex: '1', color: '#bdbdbd' } }, transRef.ref), (0, _h2.default)('span', { style: { flex: '0', color: transformations.length - 1 !== index ? '#bdbdbd' : transType === type ? 'green' : 'red' } }, 'text')])]);
                    }
                    if (transRef.ref === 'toText') {
                        return (0, _h2.default)('div', {}, [(0, _h2.default)('div', { style: { cursor: 'default', display: 'flex' } }, [(0, _h2.default)('span', { style: { flex: '1', color: '#bdbdbd' } }, transRef.ref), (0, _h2.default)('span', { style: { flex: '0', color: transformations.length - 1 !== index ? '#bdbdbd' : transType === type ? 'green' : 'red' } }, 'text')])]);
                    }
                });
            }

            function genTransformators(type) {
                if (type === 'text') {
                    return [(0, _h2.default)('div', { style: { padding: '5px 10px', display: 'inline-block', borderRadius: '10px', margin: '5px', cursor: 'pointer', border: state.selectedStateNodeId ? '2px solid white' : '2px solid #bdbdbd', color: state.selectedStateNodeId ? 'white' : '#bdbdbd' }, on: { click: [CHANGE_PIPE_VALUE_TO_STATE, ref.id] } }, 'change to state'), (0, _h2.default)('div', { style: { padding: '5px 10px', display: 'inline-block', borderRadius: '10px', margin: '5px', cursor: 'pointer', border: '2px solid white' }, on: { click: [ADD_TRANSFORMATION, ref.id, 'join'] } }, 'join'), (0, _h2.default)('div', { style: { padding: '5px 10px', display: 'inline-block', borderRadius: '10px', margin: '5px', cursor: 'pointer', border: '2px solid white' }, on: { click: [ADD_TRANSFORMATION, ref.id, 'toUpperCase'] } }, 'to Upper case'), (0, _h2.default)('div', { style: { padding: '5px 10px', display: 'inline-block', borderRadius: '10px', margin: '5px', cursor: 'pointer', border: '2px solid white' }, on: { click: [ADD_TRANSFORMATION, ref.id, 'toLowerCase'] } }, 'to Lower case')];
                }
                if (type === 'number') {
                    return [(0, _h2.default)('div', { style: { padding: '5px 10px', display: 'inline-block', borderRadius: '10px', margin: '5px', cursor: 'pointer', border: state.selectedStateNodeId ? '2px solid white' : '2px solid #bdbdbd', color: state.selectedStateNodeId ? 'white' : '#bdbdbd' }, on: { click: [CHANGE_PIPE_VALUE_TO_STATE, ref.id] } }, 'change to state'), (0, _h2.default)('div', { style: { padding: '5px 10px', display: 'inline-block', borderRadius: '10px', margin: '5px', cursor: 'pointer', border: '2px solid white' }, on: { click: [ADD_TRANSFORMATION, ref.id, 'toText'] } }, 'to text'), (0, _h2.default)('div', { style: { padding: '5px 10px', display: 'inline-block', borderRadius: '10px', margin: '5px', cursor: 'pointer', border: '2px solid white' }, on: { click: [ADD_TRANSFORMATION, ref.id, 'add'] } }, 'add'), (0, _h2.default)('div', { style: { padding: '5px 10px', display: 'inline-block', borderRadius: '10px', margin: '5px', cursor: 'pointer', border: '2px solid white' }, on: { click: [ADD_TRANSFORMATION, ref.id, 'subtract'] } }, 'subtract')];
                }
            }
            if (typeof pipe.value === 'string') {
                return (0, _h2.default)('div', [(0, _h2.default)('div', { style: { display: 'flex', alignItems: 'center' }, on: { click: [SELECT_PIPE, ref.id] } }, [(0, _h2.default)('input', {
                    style: {
                        background: 'none',
                        outline: 'none',
                        padding: '0',
                        margin: '0',
                        border: 'none',
                        borderRadius: '0',
                        display: 'inline-block',
                        width: '100%',
                        color: 'white',
                        textDecoration: 'underline'
                    },
                    on: {
                        input: [CHANGE_STATIC_VALUE, ref, 'value', 'text']
                    },
                    liveProps: {
                        value: pipe.value
                    }
                }), (0, _h2.default)('div', { style: { flex: '0', cursor: 'default', color: pipe.transformations.length > 0 ? '#bdbdbd' : type === 'text' ? 'green' : 'red' } }, 'text')]), (0, _h2.default)('div', { style: { paddingLeft: '15px' } }, listTransformations(pipe.transformations, pipe.type)), (0, _h2.default)('div', state.selectedPipeId === ref.id ? genTransformators('text') : [])]);
            }

            if (!isNaN(parseFloat(Number(pipe.value))) && isFinite(Number(pipe.value))) {
                return (0, _h2.default)('div', [(0, _h2.default)('div', { style: { display: 'flex', alignItems: 'center' }, on: { click: [SELECT_PIPE, ref.id] } }, [(0, _h2.default)('input', {
                    attrs: { type: 'number' },
                    style: {
                        background: 'none',
                        outline: 'none',
                        padding: '0',
                        margin: '0',
                        border: 'none',
                        borderRadius: '0',
                        display: 'inline-block',
                        width: '100%',
                        color: 'white',
                        textDecoration: 'underline'
                    },
                    on: {
                        input: [CHANGE_STATIC_VALUE, ref, 'value', 'number']
                    },
                    liveProps: {
                        value: Number(pipe.value)
                    }
                }), (0, _h2.default)('div', { style: { flex: '0', cursor: 'default', color: pipe.transformations.length > 0 ? '#bdbdbd' : type === 'number' ? 'green' : 'red' } }, 'number')]), (0, _h2.default)('div', { style: { paddingLeft: '15px' } }, listTransformations(pipe.transformations, pipe.type)), (0, _h2.default)('div', state.selectedPipeId === ref.id ? genTransformators('number') : [])]);
            }

            if (pipe.value.ref === 'state') {
                var displState = state.definition[pipe.value.ref][pipe.value.id];
                return (0, _h2.default)('div', [(0, _h2.default)('div', { style: { display: 'flex', alignItems: 'center' }, on: { click: [SELECT_PIPE, ref.id] } }, [(0, _h2.default)('div', { style: { flex: '1' } }, [(0, _h2.default)('div', {
                    style: { cursor: 'pointer', color: state.selectedStateNodeId === pipe.value.id ? '#eab65c' : 'white', padding: '2px 5px', margin: '3px 3px 0 0', border: '2px solid ' + (state.selectedStateNodeId === pipe.value.id ? '#eab65c' : 'white'), borderRadius: '10px', display: 'inline-block' },
                    on: { click: [STATE_NODE_SELECTED, pipe.value.id] }
                }, [displState.title])]), (0, _h2.default)('div', { style: { flex: '0', cursor: 'default', color: pipe.transformations.length > 0 ? '#bdbdbd' : displState.type === type ? 'green' : 'red' } }, displState.type)]), (0, _h2.default)('div', { style: { paddingLeft: '15px' } }, listTransformations(pipe.transformations, pipe.type)), (0, _h2.default)('div', state.selectedPipeId === ref.id ? pipe.transformations.length === 0 ? genTransformators(displState.type) : pipe.transformations[pipe.transformations.length - 1].ref === 'add' || pipe.transformations[pipe.transformations.length - 1].ref === 'subtract' ? genTransformators('number') : genTransformators('text') : []) // TODO fix, a hack for demo, type should be last transformation not just text
                ]);
            }
            if (pipe.value.ref === 'eventData') {
                var eventData = state.definition[pipe.value.ref][pipe.value.id];
                return (0, _h2.default)('div', [(0, _h2.default)('div', { style: { display: 'flex', alignItems: 'center' }, on: { click: [SELECT_PIPE, ref.id] } }, [(0, _h2.default)('div', { style: { flex: '1' } }, [(0, _h2.default)('div', {
                    style: { cursor: 'pointer', color: state.selectedStateNodeId === pipe.value.id ? '#eab65c' : 'white', padding: '2px 5px', margin: '3px 3px 0 0', border: '2px solid ' + (state.selectedStateNodeId === pipe.value.id ? '#eab65c' : 'white'), display: 'inline-block' },
                    on: { click: [STATE_NODE_SELECTED, pipe.value.id] }
                }, [eventData.title])]), (0, _h2.default)('div', { style: { flex: '0', cursor: 'default', color: pipe.transformations.length > 0 ? '#bdbdbd' : eventData.type === type ? 'green' : 'red' } }, eventData.type)]), (0, _h2.default)('div', { style: { paddingLeft: '15px' } }, listTransformations(pipe.transformations, pipe.type))]);
            }
        }

        function listNameSpace(stateId) {
            var currentNameSpace = state.definition.nameSpace[stateId];
            function editingNode() {
                return (0, _h2.default)('input', {
                    style: {
                        background: 'none',
                        color: state.selectedStateNodeId === stateId ? '#eab65c' : 'white',
                        outline: 'none',
                        boxShadow: 'inset 0 -1px 0 0 white',
                        padding: '0',
                        margin: '0',
                        border: 'none',
                        borderRadius: '0',
                        display: 'inline',
                        font: 'inherit'
                    },
                    on: {
                        input: [CHANGE_NAMESPACE_TITLE, stateId]
                    },
                    liveProps: {
                        value: currentNameSpace.title
                    },
                    attrs: {
                        autofocus: true,
                        'data-istitleeditor': true
                    }
                });
            }
            var closed = state.viewFoldersClosed[stateId] || state.selectedStateNodeId !== stateId && currentNameSpace.children.length === 0;
            return (0, _h2.default)('div', {
                style: {
                    position: 'relative'
                }
            }, [(0, _h2.default)('div', [(0, _h2.default)('svg', {
                attrs: { width: 12, height: 16 },
                style: { cursor: 'pointer', padding: '0 5px', transform: closed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'all 0.2s', marginLeft: '-10px' },
                on: {
                    click: [VIEW_FOLDER_CLICKED, stateId]
                }
            }, [(0, _h2.default)('polygon', { attrs: { points: '12,8 0,1 3,8 0,15' }, style: { fill: state.selectedStateNodeId === stateId ? '#eab65c' : 'white', transition: 'fill 0.2s' } })]), state.editingTitleNodeId === stateId ? editingNode() : (0, _h2.default)('span', { style: { cursor: 'pointer' }, on: { click: [STATE_NODE_SELECTED, stateId], dblclick: [EDIT_VIEW_NODE_TITLE, stateId] } }, [(0, _h2.default)('span', { style: { color: state.selectedStateNodeId === stateId ? '#eab65c' : 'white', transition: 'color 0.2s' } }, currentNameSpace.title)])]), (0, _h2.default)('div', { style: { display: closed ? 'none' : 'block', paddingLeft: '10px', paddingBottom: '5px', borderLeft: state.selectedStateNodeId === stateId ? '2px solid #eab65c' : '2px solid #bdbdbd', transition: 'border-color 0.2s' } }, [].concat(_toConsumableArray(currentNameSpace.children.map(function (ref) {
                return ref.ref === 'state' ? listState(ref.id) : listNameSpace(ref.id);
            })), [(0, _h2.default)('span', { style: { display: state.selectedStateNodeId === stateId ? 'inline-block' : 'none', cursor: 'pointer', borderRadius: '5px', border: '3px solid #eab65c', padding: '5px', margin: '5px' }, on: { click: [ADD_STATE, stateId, 'text'] } }, '+ text'), (0, _h2.default)('span', { style: { display: state.selectedStateNodeId === stateId ? 'inline-block' : 'none', cursor: 'pointer', borderRadius: '5px', border: '3px solid #eab65c', padding: '5px', margin: '5px' }, on: { click: [ADD_STATE, stateId, 'number'] } }, '+ number'),
            //h('span', {style: {display: state.selectedStateNodeId === stateId ? 'inline-block': 'none', cursor: 'pointer', borderRadius: '5px', border: '3px solid #eab65c', padding: '5px', margin: '5px'}, on: {click: [ADD_STATE, stateId, 'boolean']}}, '+ variant'),
            //h('span', {style: {display: state.selectedStateNodeId === stateId ? 'inline-block': 'none', cursor: 'pointer', borderRadius: '5px', border: '3px solid #eab65c', padding: '5px', margin: '5px'}, on: {click: [ADD_STATE, stateId, 'table']}}, '+ table'),
            (0, _h2.default)('span', { style: { display: state.selectedStateNodeId === stateId ? 'inline-block' : 'none', cursor: 'pointer', borderRadius: '5px', border: '3px solid #eab65c', padding: '5px', margin: '5px' }, on: { click: [ADD_STATE, stateId, 'namespace'] } }, '+ folder')]))]);
        }
        function listState(stateId) {
            var currentState = state.definition.state[stateId];
            function editingNode() {
                return (0, _h2.default)('input', {
                    style: {
                        background: 'none',
                        color: state.selectedStateNodeId === stateId ? '#eab65c' : 'white',
                        outline: 'none',
                        boxShadow: 'none',
                        padding: '2px 5px',
                        margin: '3px 3px 0 0',
                        border: '2px solid ' + (state.selectedStateNodeId === stateId ? '#eab65c' : '#bdbdbd'),
                        borderRadius: '10px',
                        display: 'inline',
                        font: 'inherit'
                    },
                    on: {
                        input: [CHANGE_STATE_NODE_TITLE, stateId]
                    },
                    liveProps: {
                        value: currentState.title
                    },
                    attrs: {
                        autofocus: true,
                        'data-istitleeditor': true
                    }
                });
            }
            return (0, _h2.default)('div', {
                style: {
                    cursor: 'pointer',
                    position: 'relative',
                    fontSize: '0.8em'
                }
            }, [(0, _h2.default)('span', { on: { click: [STATE_NODE_SELECTED, stateId], dblclick: [EDIT_VIEW_NODE_TITLE, stateId] } }, [state.editingTitleNodeId === stateId ? editingNode() : (0, _h2.default)('span', { style: { color: state.selectedStateNodeId === stateId ? '#eab65c' : 'white', padding: '2px 5px', margin: '7px 3px 2px 0', border: '2px solid ' + (state.selectedStateNodeId === stateId ? '#eab65c' : '#bdbdbd'), borderRadius: '10px', display: 'inline-block', transition: 'all 0.2s' } }, currentState.title)]), (0, _h2.default)('span', ': '), function () {
                var noStyleInput = {
                    color: app.getCurrentState()[stateId] != state.definition.state[stateId].defaultValue ? 'rgb(91, 204, 91)' : 'white',
                    background: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    display: 'inline',
                    border: 'none',
                    maxWidth: '50%'
                };
                if (currentState.type === 'text') return (0, _h2.default)('input', { attrs: { type: 'text' }, liveProps: { value: app.getCurrentState()[stateId] }, style: noStyleInput, on: { input: [CHANGE_CURRENT_STATE_TEXT_VALUE, stateId] } });
                if (currentState.type === 'number') return (0, _h2.default)('span', { style: { position: 'relative' } }, [(0, _h2.default)('input', { attrs: { type: 'number' }, liveProps: { value: app.getCurrentState()[stateId] }, style: _extends({}, noStyleInput, { width: 9 * app.getCurrentState()[stateId].toString().length + 'px' }), on: { input: [CHANGE_CURRENT_STATE_NUMBER_VALUE, stateId] } }), (0, _h2.default)('svg', {
                    attrs: { width: 6, height: 8 },
                    style: { cursor: 'pointer', position: 'absolute', top: '0', right: '-12px', padding: '1px 2px 3px 2px', transform: 'rotate(-90deg)' },
                    on: {
                        click: [INCREMENT_CURRENT_STATE_NUMBER_VALUE, stateId]
                    }
                }, [(0, _h2.default)('polygon', { attrs: { points: '6,4 0,0 2,4 0,8', fill: 'white' } })]), (0, _h2.default)('svg', {
                    attrs: { width: 6, height: 8 },
                    style: { cursor: 'pointer', position: 'absolute', bottom: '0', right: '-12px', padding: '3px 2px 1px 2px', transform: 'rotate(90deg)' },
                    on: {
                        click: [DECREMENT_CURRENT_STATE_NUMBER_VALUE, stateId]
                    }
                }, [(0, _h2.default)('polygon', { attrs: { points: '6,4 0,0 2,4 0,8', fill: 'white' } })])]);
                if (currentState.type === 'table') {
                    var _ret = function () {
                        var table = app.getCurrentState()[stateId];
                        return {
                            v: (0, _h2.default)('div', {
                                style: {
                                    marginTop: '3px',
                                    background: '#828183',
                                    width: '100%'
                                }
                            }, [(0, _h2.default)('div', { style: { display: 'flex' } }, Object.keys(currentState.definition).map(function (key) {
                                return (0, _h2.default)('div', { style: { flex: '1', padding: '2px 5px', borderBottom: '2px solid white' } }, key);
                            }))].concat(_toConsumableArray(Object.keys(table).map(function (id) {
                                return (0, _h2.default)('div', { style: { display: 'flex' } }, Object.keys(table[id]).map(function (key) {
                                    return (0, _h2.default)('div', { style: { flex: '1', padding: '2px 5px' } }, table[id][key]);
                                }));
                            }))))
                        };
                    }();

                    if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
                }
            }(), state.selectedStateNodeId === stateId ? (0, _h2.default)('span', currentState.mutators.map(function (ref) {
                return (0, _h2.default)('div', {
                    style: { color: state.activeEvent === state.definition.mutator[ref.id].event.id ? '#5bcc5b' : 'white', transition: 'all 0.2s', boxShadow: state.selectedEventId === state.definition.mutator[ref.id].event.id ? '#5bcc5b 5px 0 0px 0px inset' : 'none', padding: '0 0 0 7px' },
                    on: {
                        click: [SELECT_EVENT, state.definition.mutator[ref.id].event.id],
                        dblclick: [EDIT_EVENT_TITLE, state.definition.mutator[ref.id].event.id]
                    }
                }, [(0, _h2.default)('span', ['• ', state.editingTitleNodeId === state.definition.mutator[ref.id].event.id ? (0, _h2.default)('input', {
                    style: {
                        background: 'none',
                        color: 'white',
                        outline: 'none',
                        boxShadow: 'inset 0 -1px 0 0 white',
                        padding: '0',
                        margin: '0',
                        border: 'none',
                        borderRadius: '0',
                        display: 'inline',
                        font: 'inherit'
                    },
                    on: {
                        input: [CHANGE_EVENT_TITLE, state.definition.mutator[ref.id].event.id]
                    },
                    liveProps: {
                        value: state.definition.event[state.definition.mutator[ref.id].event.id].title
                    },
                    attrs: {
                        autofocus: true,
                        'data-istitleeditor': true
                    }
                }) : state.definition.event[state.definition.mutator[ref.id].event.id].title]), state.selectedEventId === state.definition.mutator[ref.id].event.id ? (0, _h2.default)('div', { style: { marginLeft: '10px' } }, [emberEditor(state.definition.mutator[ref.id].mutation, currentState.type)]) : (0, _h2.default)('div')]);
            })) : (0, _h2.default)('span')]);
        }

        var stateComponent = (0, _h2.default)('div', { attrs: { class: 'better-scrollbar' }, style: { overflow: 'auto', flex: '1', padding: '6px 15px' }, on: { click: [UNSELECT_STATE_NODE] } }, [listNameSpace('_rootNameSpace')]);

        function listBoxNode(nodeRef, parentRef, position) {
            var nodeId = nodeRef.id;
            var parentId = parentRef.id;
            var node = state.definition[nodeRef.ref][nodeId];
            function editingNode() {
                return (0, _h2.default)('input', {
                    style: {
                        border: 'none',
                        background: 'none',
                        color: '#53B2ED',
                        outline: 'none',
                        padding: '0',
                        boxShadow: 'inset 0 -1px 0 0 #53B2ED',
                        font: 'inherit'
                    },
                    on: {
                        input: [CHANGE_VIEW_NODE_TITLE, nodeRef]
                    },
                    liveProps: {
                        value: node.title
                    },
                    attrs: {
                        autofocus: true,
                        'data-istitleeditor': true
                    }
                });
            }
            var closed = state.viewFoldersClosed[nodeId];
            return (0, _h2.default)('div', {
                style: {
                    position: 'relative'
                }
            }, [(0, _h2.default)('div', { style: { display: 'flex', alignItems: 'center' } }, [(0, _h2.default)('svg', {
                attrs: { width: 12, height: 16 },
                style: { cursor: 'pointer', padding: '0 5px', transform: closed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'all 0.2s', marginLeft: '-3px' },
                on: {
                    click: [VIEW_FOLDER_CLICKED, nodeId]
                }
            }, [(0, _h2.default)('polygon', { attrs: { points: '12,8 0,1 3,8 0,15' }, style: { fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white', transition: 'fill 0.2s' } })]), (0, _h2.default)('svg', {
                attrs: { width: 14, height: 14 },
                style: { cursor: 'pointer', padding: '0 5px 0 0' },
                on: { click: [VIEW_NODE_SELECTED, nodeRef] }
            }, nodeRef.ref === 'vNodeBox' ? [(0, _h2.default)('rect', { attrs: { x: 1, y: 1, width: 12, height: 12, fill: 'none', transition: 'all 0.2s', stroke: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white', 'stroke-width': '2' } })] : nodeRef.ref === 'vNodeList' ? [(0, _h2.default)('circle', { attrs: { r: 2, cx: 2, cy: 2, transition: 'all 0.2s', fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } }), (0, _h2.default)('rect', { attrs: { x: 6, y: 1, width: 10, transition: 'all 0.2s', height: 2, fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } }), (0, _h2.default)('circle', { attrs: { r: 2, cx: 2, cy: 7, transition: 'all 0.2s', fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } }), (0, _h2.default)('rect', { attrs: { x: 6, y: 6, width: 10, transition: 'all 0.2s', height: 2, fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } }), (0, _h2.default)('circle', { attrs: { r: 2, cx: 2, cy: 12, transition: 'all 0.2s', fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } }), (0, _h2.default)('rect', { attrs: { x: 6, y: 11, width: 10, transition: 'all 0.2s', height: 2, fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } })] : [(0, _h2.default)('text', { attrs: { x: 2, y: 14, fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } }, 'if')]), state.editingTitleNodeId === nodeId ? editingNode() : (0, _h2.default)('span', { style: { flex: '1', cursor: 'pointer', color: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white', transition: 'color 0.2s' }, on: { click: [VIEW_NODE_SELECTED, nodeRef], dblclick: [EDIT_VIEW_NODE_TITLE, nodeId] } }, node.title)]), (0, _h2.default)('div', { style: { display: closed ? 'none' : 'block', marginLeft: '7px', paddingLeft: '10px', borderLeft: state.selectedViewNode.id === nodeId ? '2px solid #53B2ED' : '2px solid #bdbdbd', transition: 'border-color 0.2s' } }, [].concat(_toConsumableArray(node.children.map(function (ref, index) {
                if (ref.ref === 'vNodeText') return listTextNode(ref, nodeRef, index);
                if (ref.ref === 'vNodeBox' || ref.ref === 'vNodeList' || ref.ref === 'vNodeIf') return listBoxNode(ref, nodeRef, index);
                if (ref.ref === 'vNodeInput') return listInputNode(ref, nodeRef, index);
            })), [(0, _h2.default)('span', { style: { display: state.selectedViewNode.id === nodeId ? 'inline-block' : 'none', cursor: 'pointer', borderRadius: '5px', border: '3px solid #53B2ED', padding: '5px', margin: '5px' }, on: { click: [ADD_NODE, nodeRef, 'box'] } }, '+ box'), (0, _h2.default)('span', { style: { display: state.selectedViewNode.id === nodeId ? 'inline-block' : 'none', cursor: 'pointer', borderRadius: '5px', border: '3px solid #53B2ED', padding: '5px', margin: '5px' }, on: { click: [ADD_NODE, nodeRef, 'text'] } }, '+ text'), (0, _h2.default)('span', { style: { display: state.selectedViewNode.id === nodeId ? 'inline-block' : 'none', cursor: 'pointer', borderRadius: '5px', border: '3px solid #53B2ED', padding: '5px', margin: '5px' }, on: { click: [ADD_NODE, nodeRef, 'input'] } }, '+ input')])), position > 0 ? (0, _h2.default)('svg', {
                attrs: { width: 6, height: 8 },
                style: { display: state.selectedViewNode.id === nodeId ? 'block' : 'none', cursor: 'pointer', position: 'absolute', top: '0', right: '25px', padding: '1px 2px 3px 2px', transform: 'rotate(-90deg)' },
                on: {
                    click: [MOVE_VIEW_NODE, parentRef, position, -1]
                }
            }, [(0, _h2.default)('polygon', { attrs: { points: '6,4 0,0 2,4 0,8', fill: 'white' } })]) : (0, _h2.default)('span'), parentId && position < state.definition[parentRef.ref][parentId].children.length - 1 ? (0, _h2.default)('svg', {
                attrs: { width: 6, height: 8 },
                style: { display: state.selectedViewNode.id === nodeId ? 'block' : 'none', cursor: 'pointer', position: 'absolute', bottom: '0', right: '25px', padding: '3px 2px 1px 2px', transform: 'rotate(90deg)' },
                on: {
                    click: [MOVE_VIEW_NODE, parentRef, position, 1]
                }
            }, [(0, _h2.default)('polygon', { attrs: { points: '6,4 0,0 2,4 0,8', fill: 'white' } })]) : (0, _h2.default)('span'), (0, _h2.default)('div', { style: { cursor: 'pointer', display: state.selectedViewNode.id === nodeId ? 'block' : 'none', position: 'absolute', right: '5px', top: '0' }, on: { click: [DELETE_SELECTED_VIEW, nodeRef, parentRef] } }, 'x')]);
        }
        function listTextNode(nodeRef, parentRef, position) {
            var nodeId = nodeRef.id;
            var parentId = parentRef.id;
            var node = state.definition.vNodeText[nodeId];
            function editingNode() {
                return (0, _h2.default)('input', {
                    style: {
                        border: 'none',
                        background: 'none',
                        color: '#53B2ED',
                        outline: 'none',
                        padding: '0',
                        boxShadow: 'inset 0 -1px 0 0 #53B2ED',
                        font: 'inherit'
                    },
                    on: {
                        input: [CHANGE_VIEW_NODE_TITLE, nodeRef]
                    },
                    liveProps: {
                        value: node.title
                    },
                    attrs: {
                        autofocus: true,
                        'data-istitleeditor': true
                    }
                });
            }
            return (0, _h2.default)('div', {
                style: {
                    cursor: 'pointer',
                    position: 'relative'
                },
                on: { click: [VIEW_NODE_SELECTED, nodeRef], dblclick: [EDIT_VIEW_NODE_TITLE, nodeId] }
            }, [(0, _h2.default)('svg', {
                attrs: { viewBox: '0 0 300 300', width: 14, height: 14 },
                style: { cursor: 'pointer', padding: '0 7px 0 0' }
            }, [(0, _h2.default)('path', { attrs: { d: 'M 0 0 L 0 85.8125 L 27.03125 85.8125 C 36.617786 44.346316 67.876579 42.179793 106.90625 42.59375 L 106.90625 228.375 C 107.31101 279.09641 98.908386 277.33602 62.125 277.5 L 62.125 299.5625 L 149 299.5625 L 150.03125 299.5625 L 236.90625 299.5625 L 236.90625 277.5 C 200.12286 277.336 191.72024 279.09639 192.125 228.375 L 192.125 42.59375 C 231.15467 42.17975 262.41346 44.346304 272 85.8125 L 299.03125 85.8125 L 299.03125 0 L 150.03125 0 L 149 0 L 0 0 z', fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } })]), state.editingTitleNodeId === nodeId ? editingNode() : (0, _h2.default)('span', { style: { color: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white', transition: 'color 0.2s' } }, node.title), position > 0 ? (0, _h2.default)('svg', {
                attrs: { width: 6, height: 8 },
                style: { display: state.selectedViewNode.id === nodeId ? 'block' : 'none', cursor: 'pointer', position: 'absolute', top: '0', right: '25px', padding: '1px 2px 3px 2px', transform: 'rotate(-90deg)' },
                on: {
                    click: [MOVE_VIEW_NODE, parentRef, position, -1]
                }
            }, [(0, _h2.default)('polygon', { attrs: { points: '6,4 0,0 2,4 0,8', fill: 'white' } })]) : (0, _h2.default)('span'), position < state.definition[parentRef.ref][parentId].children.length - 1 ? (0, _h2.default)('svg', {
                attrs: { width: 6, height: 8 },
                style: { display: state.selectedViewNode.id === nodeId ? 'block' : 'none', cursor: 'pointer', position: 'absolute', bottom: '0', right: '25px', padding: '3px 2px 1px 2px', transform: 'rotate(90deg)' },
                on: {
                    click: [MOVE_VIEW_NODE, parentRef, position, 1]
                }
            }, [(0, _h2.default)('polygon', { attrs: { points: '6,4 0,0 2,4 0,8', fill: 'white' } })]) : (0, _h2.default)('span'), (0, _h2.default)('div', { style: { display: state.selectedViewNode.id === nodeId ? 'block' : 'none', position: 'absolute', right: '5px', top: '0' }, on: { click: [DELETE_SELECTED_VIEW, nodeRef, parentRef] } }, 'x')]);
        }
        function listInputNode(nodeRef, parentRef, position) {
            var nodeId = nodeRef.id;
            var parentId = parentRef.id;
            var node = state.definition.vNodeInput[nodeId];
            function editingNode() {
                return (0, _h2.default)('input', {
                    style: {
                        border: 'none',
                        background: 'none',
                        color: '#53B2ED',
                        outline: 'none',
                        padding: '0',
                        boxShadow: 'inset 0 -1px 0 0 #53B2ED',
                        font: 'inherit'
                    },
                    on: {
                        input: [CHANGE_VIEW_NODE_TITLE, nodeRef]
                    },
                    liveProps: {
                        value: node.title
                    },
                    attrs: {
                        autofocus: true,
                        'data-istitleeditor': true
                    }
                });
            }
            return (0, _h2.default)('div', {
                style: {
                    cursor: 'pointer',
                    position: 'relative'
                },
                on: { click: [VIEW_NODE_SELECTED, nodeRef], dblclick: [EDIT_VIEW_NODE_TITLE, nodeId] }
            }, [(0, _h2.default)('svg', {
                attrs: { viewBox: '0 0 16 16', width: 14, height: 14 },
                style: { cursor: 'pointer', padding: '0 7px 0 0' }
            }, [(0, _h2.default)('path', { attrs: { d: 'M 15,2 11,2 C 10.447,2 10,1.552 10,1 10,0.448 10.447,0 11,0 l 4,0 c 0.553,0 1,0.448 1,1 0,0.552 -0.447,1 -1,1 z m -2,14 c -0.553,0 -1,-0.447 -1,-1 L 12,1 c 0,-0.552 0.447,-1 1,-1 0.553,0 1,0.448 1,1 l 0,14 c 0,0.553 -0.447,1 -1,1 z m 2,0 -4,0 c -0.553,0 -1,-0.447 -1,-1 0,-0.553 0.447,-1 1,-1 l 4,0 c 0.553,0 1,0.447 1,1 0,0.553 -0.447,1 -1,1 z', fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } }), (0, _h2.default)('path', { attrs: { d: 'M 9.8114827,4.2360393 C 9.6547357,4.5865906 9.3039933,4.8295854 8.8957233,4.8288684 L 1.2968926,4.8115404 1.3169436,2.806447 8.9006377,2.828642 c 0.552448,0.00165 0.9993074,0.4501223 0.9976564,1.0025698 -2.1e-5,0.1445856 -0.0313,0.2806734 -0.08681,0.404827 z', fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } }), (0, _h2.default)('path', { attrs: { d: 'm 9.8114827,11.738562 c -0.156747,0.350551 -0.5074894,0.593546 -0.9157594,0.592829 l -7.5988307,-0.01733 0.020051,-2.005093 7.5836941,0.02219 c 0.552448,0.0016 0.9993074,0.450122 0.9976564,1.00257 -2.1e-5,0.144585 -0.0313,0.280673 -0.08681,0.404827 z', fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } }), (0, _h2.default)('path', { attrs: { d: 'm 1.2940583,12.239836 0.01704,-9.4450947 1.9714852,0.024923 -0.021818,9.4262797 z', fill: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white' } })]), state.editingTitleNodeId === nodeId ? editingNode() : (0, _h2.default)('span', { style: { color: state.selectedViewNode.id === nodeId ? '#53B2ED' : 'white', transition: 'color 0.2s' } }, node.title), position > 0 ? (0, _h2.default)('svg', {
                attrs: { width: 6, height: 8 },
                style: { display: state.selectedViewNode.id === nodeId ? 'block' : 'none', cursor: 'pointer', position: 'absolute', top: '0', right: '25px', padding: '1px 2px 3px 2px', transform: 'rotate(-90deg)' },
                on: {
                    click: [MOVE_VIEW_NODE, parentRef, position, -1]
                }
            }, [(0, _h2.default)('polygon', { attrs: { points: '6,4 0,0 2,4 0,8', fill: 'white' } })]) : (0, _h2.default)('span'), position < state.definition[parentRef.ref][parentId].children.length - 1 ? (0, _h2.default)('svg', {
                attrs: { width: 6, height: 8 },
                style: { display: state.selectedViewNode.id === nodeId ? 'block' : 'none', cursor: 'pointer', position: 'absolute', bottom: '0', right: '25px', padding: '3px 2px 1px 2px', transform: 'rotate(90deg)' },
                on: {
                    click: [MOVE_VIEW_NODE, parentRef, position, 1]
                }
            }, [(0, _h2.default)('polygon', { attrs: { points: '6,4 0,0 2,4 0,8', fill: 'white' } })]) : (0, _h2.default)('span'), (0, _h2.default)('div', { style: { display: state.selectedViewNode.id === nodeId ? 'block' : 'none', position: 'absolute', right: '5px', top: '0' }, on: { click: [DELETE_SELECTED_VIEW, nodeRef, parentRef] } }, 'x')]);
        }

        var propsComponent = (0, _h2.default)('div', {
            style: {
                background: state.selectedViewSubMenu === 'props' ? '#4d4d4d' : '#3d3d3d',
                padding: '12px 15px 8px',
                position: 'absolute',
                top: '0',
                left: '6px',
                zIndex: state.selectedViewSubMenu === 'props' ? '500' : '0',
                cursor: 'pointer',
                borderRadius: '15px 15px 0 0',
                borderColor: '#222',
                borderStyle: 'solid',
                borderWidth: '3px 3px 0 3px'
            },
            on: {
                click: [SELECT_VIEW_SUBMENU, 'props']
            }
        }, 'props');
        var styleComponent = (0, _h2.default)('div', {
            style: {
                background: state.selectedViewSubMenu === 'style' ? '#4d4d4d' : '#3d3d3d',
                padding: '12px 15px 8px',
                position: 'absolute',
                top: '0',
                left: '91px',
                zIndex: state.selectedViewSubMenu === 'style' ? '500' : '0',
                cursor: 'pointer',
                borderRadius: '15px 15px 0 0',
                borderColor: '#222',
                borderStyle: 'solid',
                borderWidth: '3px 3px 0 3px'
            },
            on: {
                click: [SELECT_VIEW_SUBMENU, 'style']
            }
        }, 'style');
        var eventsComponent = (0, _h2.default)('div', {
            style: {
                background: state.selectedViewSubMenu === 'events' ? '#4d4d4d' : '#3d3d3d',
                padding: '12px 15px 8px',
                position: 'absolute',
                top: '0',
                left: '165px',
                zIndex: state.selectedViewSubMenu === 'events' ? '500' : '0',
                cursor: 'pointer',
                borderRadius: '15px 15px 0 0',
                borderColor: '#222',
                borderStyle: 'solid',
                borderWidth: '3px 3px 0 3px'
            },
            on: {
                click: [SELECT_VIEW_SUBMENU, 'events']
            }
        }, 'events');
        var unselectComponent = (0, _h2.default)('div', {
            style: {
                background: '#4d4d4d',
                padding: '15px 23px 5px',
                position: 'absolute',
                top: '0',
                right: '16px',
                zIndex: '100',
                cursor: 'pointer',
                borderRadius: '15px 15px 0 0',
                borderColor: '#222',
                borderStyle: 'solid',
                borderWidth: '3px 3px 0 3px'
            },
            on: {
                click: [UNSELECT_VIEW_NODE]
            }
        }, 'x');

        function generateEditNodeComponent() {
            var styles = ['background', 'border', 'outline', 'cursor', 'color', 'display', 'top', 'bottom', 'left', 'right', 'position', 'overflow', 'height', 'width', 'font', 'font', 'margin', 'padding', 'userSelect'];
            var selectedNode = state.definition[state.selectedViewNode.ref][state.selectedViewNode.id];
            var selectedStyle = state.definition.style[selectedNode.style.id];
            var styleEditorComponent = (0, _h2.default)('div', { style: {} }, Object.keys(selectedStyle).map(function (key) {
                return (0, _h2.default)('div', [(0, _h2.default)('input', {
                    style: {
                        border: 'none',
                        background: 'none',
                        color: 'white',
                        outline: 'none',
                        padding: '0',
                        boxShadow: 'inset 0 -1px 0 0 white',
                        display: 'inline-block',
                        width: '160px',
                        margin: '10px'
                    },
                    props: { value: selectedStyle[key] },
                    on: { input: [CHANGE_STYLE, selectedNode.style.id, key] } }), (0, _h2.default)('span', key)]);
            }));
            var addStyleComponent = (0, _h2.default)('div', { style: {} }, styles.filter(function (key) {
                return !Object.keys(selectedStyle).includes(key);
            }).map(function (key) {
                return (0, _h2.default)('div', { on: { click: [ADD_DEFAULT_STYLE, selectedNode.style.id, key] }, style: { display: 'inline-block', cursor: 'pointer', borderRadius: '5px', border: '3px solid white', padding: '5px', margin: '5px' } }, '+ ' + key);
            }));
            function generatePropsMenu() {
                if (state.selectedViewNode.ref === 'vNodeBox') {
                    return (0, _h2.default)('div', { style: { textAlign: 'center', marginTop: '100px', color: '#bdbdbd' } }, 'Component has no props');
                }
                if (state.selectedViewNode.ref === 'vNodeText') {
                    return (0, _h2.default)('div', { style: { paddingTop: '20px' } }, [(0, _h2.default)('div', { style: { display: 'flex', alignItems: 'center', background: '#676767', padding: '5px 10px', marginBottom: '10px' } }, [(0, _h2.default)('span', { style: { flex: '1' } }, 'text value'), (0, _h2.default)('div', { style: { flex: '0', cursor: 'default', color: '#bdbdbd' } }, 'text')]), (0, _h2.default)('div', { style: { padding: '5px 10px' } }, [emberEditor(selectedNode.value, 'text')])]);
                }
                if (state.selectedViewNode.ref === 'vNodeInput') {
                    return (0, _h2.default)('div', { style: { paddingTop: '20px' } }, [(0, _h2.default)('div', { style: { display: 'flex', alignItems: 'center', background: '#676767', padding: '5px 10px', marginBottom: '10px' } }, [(0, _h2.default)('span', { style: { flex: '1' } }, 'input value'), (0, _h2.default)('div', { style: { flex: '0', cursor: 'default', color: '#bdbdbd' } }, 'text')]), (0, _h2.default)('div', { style: { padding: '5px 10px' } }, [emberEditor(selectedNode.value, 'text')])]);
                }
                if (state.selectedViewNode.ref === 'vNodeList') {
                    return (0, _h2.default)('div', { style: { textAlign: 'center', marginTop: '100px', color: '#bdbdbd' } }, 'TODO ADD PROPS');
                }
                if (state.selectedViewNode.ref === 'vNodeIf') {
                    return (0, _h2.default)('div', { style: { textAlign: 'center', marginTop: '100px', color: '#bdbdbd' } }, 'TODO ADD PROPS');
                }
            }
            var propsSubmenuComponent = (0, _h2.default)('div', [generatePropsMenu()]);
            var styleSubmenuComponent = (0, _h2.default)('div', [styleEditorComponent, addStyleComponent]);
            var availableEvents = [{
                description: 'on click',
                propertyName: 'click'
            }, {
                description: 'double clicked',
                propertyName: 'dblclick'
            }, {
                description: 'mouse over',
                propertyName: 'mouseover'
            }, {
                description: 'mouse out',
                propertyName: 'mouseout'
            }];
            if (state.selectedViewNode.ref === 'vNodeInput') {
                availableEvents = availableEvents.concat([{
                    description: 'input',
                    propertyName: 'input'
                }, {
                    description: 'focus',
                    propertyName: 'focus'
                }, {
                    description: 'blur',
                    propertyName: 'blur'
                }]);
            }
            var currentEvents = availableEvents.filter(function (event) {
                return selectedNode[event.propertyName];
            });
            var eventsLeft = availableEvents.filter(function (event) {
                return !selectedNode[event.propertyName];
            });
            var eventsSubmenuComponent = (0, _h2.default)('div', { style: { paddingTop: '20px' } }, eventsLeft.map(function (event) {
                return (0, _h2.default)('div', { style: { display: 'inline-block', border: '3px solid #5bcc5b', borderRadius: '5px', cursor: 'pointer', padding: '5px', margin: '10px' }, on: { click: [ADD_EVENT, event.propertyName] } }, '+ ' + event.description);
            }).concat(currentEvents.length ? currentEvents.map(function (event) {
                return (0, _h2.default)('div', [(0, _h2.default)('div', { style: { background: '#676767', padding: '5px 10px' } }, event.description), (0, _h2.default)('div', {
                    style: { color: state.activeEvent === selectedNode[event.propertyName].id ? '#5bcc5b' : 'white', transition: 'color 0.2s', fontSize: '0.8em', cursor: 'pointer', padding: '5px 10px', boxShadow: state.selectedEventId === selectedNode[event.propertyName].id ? '#5bcc5b 5px 0 0px 0px inset' : 'none' },
                    on: {
                        click: [SELECT_EVENT, selectedNode[event.propertyName].id],
                        dblclick: [EDIT_EVENT_TITLE, selectedNode[event.propertyName].id]
                    }
                }, [(0, _h2.default)('span', {}, ['• ', state.editingTitleNodeId === selectedNode[event.propertyName].id ? (0, _h2.default)('input', {
                    style: {
                        background: 'none',
                        color: 'white',
                        outline: 'none',
                        boxShadow: 'inset 0 -1px 0 0 white',
                        padding: '0',
                        margin: '0',
                        border: 'none',
                        borderRadius: '0',
                        display: 'inline',
                        font: 'inherit'
                    },
                    on: {
                        input: [CHANGE_EVENT_TITLE, selectedNode[event.propertyName].id]
                    },
                    liveProps: {
                        value: state.definition.event[selectedNode[event.propertyName].id].title
                    },
                    attrs: {
                        autofocus: true,
                        'data-istitleeditor': true
                    }
                }) : state.definition.event[selectedNode[event.propertyName].id].title])])]);
            }) : []));
            return (0, _h2.default)('div', {
                style: {
                    position: 'absolute',
                    left: '-8px',
                    transform: 'translate(-100%, 0)',
                    marginRight: '8px',
                    bottom: '6px',
                    height: '50%',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }, [(0, _h2.default)('div', { style: { flex: '1', maxHeight: '43px', minHeight: '43px', position: 'relative', marginTop: '6px' } }, [eventsComponent, styleComponent, propsComponent, unselectComponent]), (0, _h2.default)('div', { attrs: { class: 'better-scrollbar' }, style: { flex: '1', overflow: 'auto', background: '#4d4d4d', borderRadius: '10px', width: state.subEditorWidth + 'px', border: '3px solid #222' } }, [dragSubComponent, state.selectedViewSubMenu === 'props' ? propsSubmenuComponent : state.selectedViewSubMenu === 'style' ? styleSubmenuComponent : state.selectedViewSubMenu === 'events' ? eventsSubmenuComponent : (0, _h2.default)('span', 'Error, no such menu')])]);
        }

        var viewComponent = (0, _h2.default)('div', { attrs: { class: 'better-scrollbar' }, style: { overflow: 'auto', position: 'relative', flex: '1', borderTop: '3px solid #222', padding: '6px 8px' }, on: { click: [UNSELECT_VIEW_NODE] } }, [listBoxNode({ ref: 'vNodeBox', id: '_rootNode' }, {})]);

        var rightComponent = (0, _h2.default)('div', {
            style: {
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: '0',
                right: '0',
                color: 'white',
                height: '100%',
                font: "300 1.2em 'Open Sans'",
                lineHeight: '1.2em',
                width: state.editorRightWidth + 'px',
                background: '#4d4d4d',
                boxSizing: "border-box",
                borderLeft: '3px solid #222',
                transition: '0.5s transform',
                transform: state.rightOpen ? 'translateZ(0) translateX(0%)' : 'translateZ(0) translateX(100%)',
                userSelect: 'none'
            }
        }, [dragComponentRight, stateComponent, viewComponent, state.selectedViewNode.ref ? generateEditNodeComponent() : (0, _h2.default)('span')]);

        var topComponent = (0, _h2.default)('div', {
            style: {
                flex: '1 auto',
                height: '75px',
                maxHeight: '75px',
                minHeight: '75px',
                background: '#222',
                display: 'flex'
            }
        }, [(0, _h2.default)('a', { style: { flex: '0 auto', width: '190px', textDecoration: 'inherit', userSelect: 'none' }, attrs: { href: '/_dev' } }, [(0, _h2.default)('img', { style: { margin: '7px -2px -3px 5px', display: 'inline-block' }, attrs: { src: '/images/logo256x256.png', height: '57' } }), (0, _h2.default)('span', { style: { fontSize: '44px', fontFamily: "'Comfortaa', sans-serif", verticalAlign: 'bottom', color: '#fff' } }, 'ugnis')])]);
        var leftComponent = (0, _h2.default)('div', {
            style: {
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: '0',
                left: '0',
                height: '100%',
                color: 'white',
                font: "300 1.2em 'Open Sans'",
                lineHeight: '1.2em',
                width: state.editorLeftWidth + 'px',
                background: '#4d4d4d',
                boxSizing: "border-box",
                borderRight: '3px solid #222',
                transition: '0.5s transform',
                transform: state.leftOpen ? 'translateZ(0) translateX(0%)' : 'translateZ(0) translateX(-100%)',
                userSelect: 'none'
            }
        }, [dragComponentLeft, (0, _h2.default)('div', {
            on: {
                click: FREEZER_CLICKED
            },
            style: {
                flex: '0 auto',
                padding: '10px',
                textAlign: 'center',
                background: '#333',
                cursor: 'pointer'
            }
        }, [(0, _h2.default)('span', { style: { padding: '15px 15px 10px 15px', color: state.appIsFrozen ? 'rgb(91, 204, 91)' : 'rgb(204, 91, 91)' } }, state.appIsFrozen ? '►' : '❚❚')]), (0, _h2.default)('div', {
            attrs: { class: 'better-scrollbar' },
            style: {
                flex: '1 auto',
                padding: '10px',
                overflow: 'auto'
            }
        }, eventStack.map(function (a) {
            return a;
        }).reverse().map(function (event) {
            return (0, _h2.default)('div', { style: { padding: '5px', color: '#ffffff' } }, [state.definition.event[event.eventName].title, (0, _h2.default)('div', Object.keys(event.mutations).map(function (stateId) {
                return state.definition.state[stateId].title + ': ' + event.mutations[stateId].toString();
            }))]);
        }))]);
        var renderViewComponent = (0, _h2.default)('div', {
            style: {
                flex: '1 auto',
                background: "\n                    radial-gradient(black 5%, transparent 16%) 0 0,\n                    radial-gradient(black 5%, transparent 16%) 8px 8px,\n                    radial-gradient(rgba(255,255,255,.1) 5%, transparent 20%) 0 1px,\n                    radial-gradient(rgba(255,255,255,.1) 5%, transparent 20%) 8px 9px",
                backgroundColor: '#333',
                backgroundSize: '16px 16px',
                transform: 'translateZ(0)',
                display: 'relative',
                overflow: 'auto'
            }
        }, [(0, _h2.default)('div', { style: function () {
                var desiredWidth = 1920;
                var desiredHeight = 1080;
                var topMenuHeight = 75;
                var widthLeft = window.innerWidth - (state.editorLeftWidth + state.editorRightWidth);
                var heightLeft = window.innerHeight - topMenuHeight;
                var scaleX = widthLeft < desiredWidth ? widthLeft / desiredWidth : 1;
                var scaleY = heightLeft < desiredHeight ? heightLeft / desiredHeight : 1;
                if (scaleX > scaleY) {
                    scaleX = scaleY;
                } else {
                    scaleY = scaleX;
                }
                return {
                    width: desiredWidth + 'px',
                    height: desiredHeight + 'px',
                    background: '#ffffff',
                    boxShadow: 'rgba(0, 0, 0, 0.247059) 0px 14px 45px, rgba(0, 0, 0, 0.219608) 0px 10px 18px',
                    transform: 'translateZ(0) scale(' + scaleX + ',' + scaleY + ')',
                    position: 'absolute',
                    top: (heightLeft - desiredHeight) / 2 + 'px',
                    left: (widthLeft - desiredWidth) / 2 + state.editorLeftWidth + 'px'
                };
            }() }, [(0, _h2.default)('div', { style: { background: '#93d1f7', width: '100%', height: '40px', position: 'absolute', top: '-40px', display: 'flex', justifyContent: 'center', alignItems: 'center', left: '0', borderRadius: '5px 5px 0 0', boxShadow: 'inset 0 -3px 0 0 #b7b7b7' } }, 'todo: url, width and height, close button'), (0, _h2.default)('div', { style: { overflow: 'auto', width: '100%', height: '100%' } }, [app.vdom])])]);
        var mainRowComponent = (0, _h2.default)('div', {
            style: {
                display: 'flex',
                flex: '1',
                position: 'relative',
                transform: 'translateZ(0)'
            }
        }, [renderViewComponent, leftComponent, rightComponent]);
        var vnode = (0, _h2.default)('div', {
            style: {
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: '0',
                right: '0',
                width: '100vw',
                height: '100vh'
            }
        }, [topComponent, mainRowComponent]);

        node = patch(node, vnode);
    }

    render();
}

},{"../ugnis_components/app.json":14,"./ugnis":13,"big.js":1,"snabbdom":10,"snabbdom/h":2,"snabbdom/modules/attributes":5,"snabbdom/modules/class":6,"snabbdom/modules/eventlisteners":7,"snabbdom/modules/props":8,"snabbdom/modules/style":9}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _snabbdom = require('snabbdom');

var _snabbdom2 = _interopRequireDefault(_snabbdom);

var _h = require('snabbdom/h');

var _h2 = _interopRequireDefault(_h);

var _big = require('big.js');

var _big2 = _interopRequireDefault(_big);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function updateProps(oldVnode, vnode) {
    var key,
        cur,
        old,
        elm = vnode.elm,
        props = vnode.data.liveProps || {};
    for (key in props) {
        cur = props[key];
        old = elm[key];
        if (old !== cur) elm[key] = cur;
    }
}
var livePropsPlugin = { create: updateProps, update: updateProps };

var patch = _snabbdom2.default.init([require('snabbdom/modules/class'), require('snabbdom/modules/props'), require('snabbdom/modules/style'), require('snabbdom/modules/eventlisteners'), require('snabbdom/modules/attributes'), livePropsPlugin]);


function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
}

exports.default = function (definition) {

    var currentState = Object.keys(definition.state).map(function (key) {
        return definition.state[key];
    }).reduce(function (acc, def) {
        acc[def.ref] = def.defaultValue;
        return acc;
    }, {});

    // Allows stoping application in development. This is not an application state
    var frozen = false;
    var frozenCallback = null;
    var selectHoverActive = false;
    var selectedNodeInDevelopment = {};

    function selectNodeHover(ref, e) {
        e.stopPropagation();
        selectedNodeInDevelopment = ref;
        frozenCallback(ref);
        render();
    }
    function selectNodeClick(ref, e) {
        e.stopPropagation();
        selectHoverActive = false;
        selectedNodeInDevelopment = ref;
        frozenCallback(ref);
        render();
    }

    // global state for resolver
    var currentEvent = null;
    var currentMapValue = {};
    var currentMapIndex = {};
    var eventData = {};
    function resolve(ref) {
        if (ref === undefined) {
            return;
        }
        // static value (string/number)
        if (ref.ref === undefined) {
            return ref;
        }
        var def = definition[ref.ref][ref.id];
        if (ref.ref === 'pipe') {
            return pipe(ref);
        }
        if (ref.ref === 'conditional') {
            return resolve(def.predicate) ? resolve(def.then) : resolve(def.else);
        }
        if (ref.ref === 'state') {
            return currentState[ref.id];
        }
        if (ref.ref === 'vNodeBox') {
            return boxNode(ref);
        }
        if (ref.ref === 'vNodeText') {
            return textNode(ref);
        }
        if (ref.ref === 'vNodeInput') {
            return inputNode(ref);
        }
        if (ref.ref === 'vNodeList') {
            return listNode(ref);
        }
        if (ref.ref === 'vNodeIf') {
            return ifNode(ref);
        }
        if (ref.ref === 'style') {
            return Object.keys(def).reduce(function (acc, val) {
                acc[val] = resolve(def[val]);
                return acc;
            }, {});
        }
        if (ref.ref === 'eventData') {
            return eventData[ref.id];
        }
        if (ref.ref === 'listValue') {
            return currentMapValue[def.list.id][def.property];
        }
        throw Error(ref);
    }

    function transformValue(value, transformations) {
        for (var i = 0; i < transformations.length; i++) {
            var ref = transformations[i];
            var transformer = definition[ref.ref][ref.id];
            if (ref.ref === 'equal') {
                var compareValue = resolve(transformer.value);
                if (value instanceof _big2.default || compareValue instanceof _big2.default) {
                    value = (0, _big2.default)(value).eq(compareValue);
                } else {
                    value = value === compareValue;
                }
            }
            if (ref.ref === 'add') {
                value = (0, _big2.default)(value).plus(resolve(transformer.value));
            }
            if (ref.ref === 'subtract') {
                value = (0, _big2.default)(value).minus(resolve(transformer.value));
            }
            if (ref.ref === 'multiply') {
                value = (0, _big2.default)(value).times(resolve(transformer.value));
            }
            if (ref.ref === 'divide') {
                value = (0, _big2.default)(value).div(resolve(transformer.value));
            }
            if (ref.ref === 'remainder') {
                value = (0, _big2.default)(value).mod(resolve(transformer.value));
            }
            if (ref.ref === 'branch') {
                if (resolve(transformer.predicate)) {
                    value = transformValue(value, transformer.then);
                } else {
                    value = transformValue(value, transformer.else);
                }
            }
            if (ref.ref === 'join') {
                value = value.concat(resolve(transformer.value));
            }
            if (ref.ref === 'toUpperCase') {
                value = value.toUpperCase();
            }
            if (ref.ref === 'toLowerCase') {
                value = value.toLowerCase();
            }
            if (ref.ref === 'toText') {
                value = value.toString();
            }
        }
        return value;
    }

    function pipe(ref) {
        var def = definition[ref.ref][ref.id];
        return transformValue(resolve(def.value), def.transformations);
    }

    function boxNode(ref) {
        var node = definition[ref.ref][ref.id];
        var data = {
            style: frozen && selectedNodeInDevelopment.id === ref.id ? _extends({}, resolve(node.style), { transition: 'outline 0.1s', outline: '3px solid #3590df' }) : resolve(node.style),
            on: frozen ? {
                mouseover: selectHoverActive ? [selectNodeHover, ref] : undefined,
                click: [selectNodeClick, ref]
            } : {
                click: node.click ? [emitEvent, node.click] : undefined,
                dblclick: node.dblclick ? [emitEvent, node.dblclick] : undefined,
                mouseover: node.mouseover ? [emitEvent, node.mouseover] : undefined,
                mouseout: node.mouseout ? [emitEvent, node.mouseout] : undefined
            }
        };
        return (0, _h2.default)('div', data, flatten(node.children.map(resolve)));
    }

    function ifNode(ref) {
        var node = definition[ref.ref][ref.id];
        return resolve(node.value) ? node.children.map(resolve) : [];
    }

    function textNode(ref) {
        var node = definition[ref.ref][ref.id];
        var data = {
            style: frozen && selectedNodeInDevelopment.id === ref.id ? _extends({}, resolve(node.style), { transition: 'outline 0.1s', outline: '3px solid #3590df' }) : resolve(node.style),
            on: frozen ? {
                mouseover: selectHoverActive ? [selectNodeHover, ref] : undefined,
                click: [selectNodeClick, ref]
            } : {
                click: node.click ? [emitEvent, node.click] : undefined,
                dblclick: node.dblclick ? [emitEvent, node.dblclick] : undefined,
                mouseover: node.mouseover ? [emitEvent, node.mouseover] : undefined,
                mouseout: node.mouseout ? [emitEvent, node.mouseout] : undefined
            }
        };
        return (0, _h2.default)('span', data, resolve(node.value));
    }

    function inputNode(ref) {
        var node = definition[ref.ref][ref.id];
        var data = {
            style: frozen && selectedNodeInDevelopment.id === ref.id ? _extends({}, resolve(node.style), { transition: 'outline 0.1s', outline: '3px solid #3590df' }) : resolve(node.style),
            on: frozen ? {
                mouseover: selectHoverActive ? [selectNodeHover, ref] : undefined,
                click: [selectNodeClick, ref]
            } : {
                click: node.click ? [emitEvent, node.click] : undefined,
                input: node.input ? [emitEvent, node.input] : undefined,
                dblclick: node.dblclick ? [emitEvent, node.dblclick] : undefined,
                mouseover: node.mouseover ? [emitEvent, node.mouseover] : undefined,
                mouseout: node.mouseout ? [emitEvent, node.mouseout] : undefined,
                focus: node.focus ? [emitEvent, node.focus] : undefined,
                blur: node.blur ? [emitEvent, node.blur] : undefined
            },
            props: {
                value: resolve(node.value),
                placeholder: node.placeholder
            }
        };
        return (0, _h2.default)('input', data);
    }

    function listNode(ref) {
        var node = definition[ref.ref][ref.id];
        var list = resolve(node.value);

        var children = Object.keys(list).map(function (key) {
            return list[key];
        }).map(function (value, index) {
            currentMapValue[ref.id] = value;
            currentMapIndex[ref.id] = index;

            return node.children.map(resolve);
        });
        delete currentMapValue[ref.id];
        delete currentMapIndex[ref.id];

        var data = {
            style: frozen && selectedNodeInDevelopment.id === ref.id ? _extends({}, resolve(node.style), { transition: 'outline 0.1s', outline: '3px solid #3590df' }) : resolve(node.style),
            on: frozen ? {
                mouseover: selectHoverActive ? [selectNodeHover, ref] : undefined,
                click: [selectNodeClick, ref]
            } : {
                click: node.click ? [emitEvent, node.click.id, undefined] : undefined,
                dblclick: node.dblclick ? [emitEvent, node.dblclick.id, undefined] : undefined,
                mouseover: node.mouseover ? [emitEvent, node.mouseover.id, undefined] : undefined,
                mouseout: node.mouseout ? [emitEvent, node.mouseout.id, undefined] : undefined
            }
        };
        return (0, _h2.default)('div', data, flatten(children));
    }

    var listeners = [];

    function addListener(callback) {
        var length = listeners.push(callback);

        // for unsubscribing
        return function () {
            return listeners.splice(length - 1, 1);
        };
    }

    function emitEvent(eventRef, e) {
        var eventId = eventRef.id;
        var event = definition.event[eventId];
        currentEvent = e;
        event.data.forEach(function (ref) {
            if (ref.id === '_input') {
                eventData[ref.id] = e.target.value;
            }
        });
        var previousState = currentState;
        var mutations = {};
        definition.event[eventId].mutators.forEach(function (ref) {
            var mutator = definition.mutator[ref.id];
            var state = mutator.state;
            mutations[state.id] = resolve(mutator.mutation);
        });
        currentState = Object.assign({}, currentState, mutations);
        listeners.forEach(function (callback) {
            return callback(eventId, eventData, e, previousState, currentState, mutations);
        });
        currentEvent = {};
        eventData = {};
        if (Object.keys(mutations).length) {
            render();
        }
    }

    var vdom = resolve({ ref: 'vNodeBox', id: '_rootNode' });
    function render(newDefinition) {
        if (newDefinition) {
            if (definition.state !== newDefinition.state) {
                definition = newDefinition;
                var newState = Object.keys(definition.state).map(function (key) {
                    return definition.state[key];
                }).reduce(function (acc, def) {
                    acc[def.ref] = def.defaultValue;
                    return acc;
                }, {});
                currentState = _extends({}, newState, currentState);
            } else {
                definition = newDefinition;
            }
        }
        var newvdom = resolve({ ref: 'vNodeBox', id: '_rootNode' });
        patch(vdom, newvdom);
        vdom = newvdom;
    }

    function _freeze(isFrozen, callback, nodeId) {
        frozenCallback = callback;
        selectedNodeInDevelopment = nodeId;
        if (frozen === false && isFrozen === true) {
            selectHoverActive = true;
        }
        if (frozen || frozen !== isFrozen) {
            frozen = isFrozen;
            render();
        }
    }

    function getCurrentState() {
        return currentState;
    }

    function setCurrentState(newState) {
        currentState = newState;
        render();
    }

    return {
        definition: definition,
        vdom: vdom,
        getCurrentState: getCurrentState,
        setCurrentState: setCurrentState,
        render: render,
        emitEvent: emitEvent,
        addListener: addListener,
        _freeze: _freeze,
        _resolve: resolve
    };
};

},{"big.js":1,"snabbdom":10,"snabbdom/h":2,"snabbdom/modules/attributes":5,"snabbdom/modules/class":6,"snabbdom/modules/eventlisteners":7,"snabbdom/modules/props":8,"snabbdom/modules/style":9}],14:[function(require,module,exports){
module.exports={
    "eventData": {
        "_input": {
            "title": "input value",
            "type": "text"
        }
    },
    "toLowerCase": {},
    "toUpperCase": {},
    "conditional": {},
    "equal": {
        "a7251af0-50a7-4823-85a0-66ce09d8a3cc": {
            "value": {
                "ref": "pipe",
                "id": "ee2423e6-5b48-41ae-8ccf-6a2c7b46d2f8"
            }
        }
    },
    "not": {},
    "list": {},
    "toText": {
        "7bs9d6d2-00db-8ab5-c332-882575f25426": {}
    },
    "listValue": {
        "pz7hd6d2-00db-8ab5-c332-882575f25426": {
            "type": "number",
            "list": {
                "ref": "vNodeList",
                "id": "fl89d6d2-00db-8ab5-c332-882575f25425"
            },
            "property": "x"
        },
        "hj9wd6d2-00db-8ab5-c332-882575f25426": {
            "type": "number",
            "list": {
                "ref": "vNodeList",
                "id": "fl89d6d2-00db-8ab5-c332-882575f25425"
            },
            "property": "y"
        },
        "hhr8b6d2-00db-8ab5-c332-882575f25426": {
            "type": "text",
            "list": {
                "ref": "vNodeList",
                "id": "fl89d6d2-00db-8ab5-c332-882575f25425"
            },
            "property": "color"
        }
    },
    "pipe": {
        "fw8jd6d2-00db-8ab5-c332-882575f25426": {
            "type": "text",
            "value": "Current value: ",
            "transformations": [
                {
                    "ref": "join",
                    "id": "p9s3d6d2-00db-8ab5-c332-882575f25426"
                }
            ]
        },
        "um5ed6d2-00db-8ab5-c332-882575f25426": {
            "type": "text",
            "value": {
                "ref": "state",
                "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
            },
            "transformations": [
                {
                    "ref": "toText",
                    "id": "7bs9d6d2-00db-8ab5-c332-882575f25426"
                }
            ]
        },
        "ui8jd6d2-00db-8ab5-c332-882575f25426": {
            "type": "text",
            "value": "+",
            "transformations": []
        },
        "c8wed6d2-00db-8ab5-c332-882575f25426": {
            "type": "text",
            "value": "-",
            "transformations": []
        },
        "pdq6d6d2-00db-8ab5-c332-882575f25426": {
            "type": "number",
            "value": {
                "ref": "state",
                "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
            },
            "transformations": [
                {
                    "ref": "add",
                    "id": "w86fd6d2-00db-8ab5-c332-882575f25426"
                }
            ]
        },
        "452qd6d2-00db-8ab5-c332-882575f25426": {
            "type": "number",
            "value": {
                "ref": "state",
                "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
            },
            "transformations": [
                {
                    "ref": "subtract",
                    "id": "u43wd6d2-00db-8ab5-c332-882575f25426"
                }
            ]
        },
        "ew83d6d2-00db-8ab5-c332-882575f25426": {
            "type": "number",
            "value": 1,
            "transformations": []
        },
        "w3e9d6d2-00db-8ab5-c332-882575f25426": {
            "type": "number",
            "value": 1,
            "transformations": []
        },
        "3qkid6d2-00db-8ab5-c332-882575f25426": {
            "type": "text",
            "value": 0,
            "transformations": [
                {
                    "ref": "add",
                    "id": "wbr7d6d2-00db-8ab5-c332-882575f25426"
                },
                {
                    "ref": "toText",
                    "id": "noop"
                },
                {
                    "ref": "join",
                    "id": "s258d6d2-00db-8ab5-c332-882575f25426"
                }
            ]
        },
        "t7vqd6d2-00db-8ab5-c332-882575f25426": {
            "type": "text",
            "value": 0,
            "transformations": [
                {
                    "ref": "add",
                    "id": "vq8dd6d2-00db-8ab5-c332-882575f25426"
                },
                {
                    "ref": "toText",
                    "id": "noop"
                },
                {
                    "ref": "join",
                    "id": "wf9ad6d2-00db-8ab5-c332-882575f25426"
                }
            ]
        },
        "8cq6b6d2-00db-8ab5-c332-882575f25426": {
            "type": "text",
            "value": {
                "ref": "listValue",
                "id": "hhr8b6d2-00db-8ab5-c332-882575f25426"
            },
            "transformations": []
        },
        "f9qxd6d2-00db-8ab5-c332-882575f25426": {
            "type": "table",
            "value": {
                "ref": "state",
                "id": "c8q9d6d2-00db-8ab5-c332-882575f25426"
            },
            "transformations": []
        },
        "qww9d6d2-00db-8ab5-c332-882575f25426": {
            "type": "text",
            "value": "px",
            "transformations": []
        },
        "qdw7c6d2-00db-8ab5-c332-882575f25426": {
            "type": "text",
            "value": "px",
            "transformations": []
        },
        "84369aba-4a4d-4932-8a9a-8f9ca948b6a2": {
            "type": "text",
            "value": "The number now is even",
            "transformations": []
        },
        "c2fb9a9b-25bb-4e8b-80c0-cf51b8506070": {
            "type": "boolean",
            "value": {
                "ref": "state",
                "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
            },
            "transformations": [
                {
                    "ref": "remainder",
                    "id": "34780d22-f521-4c30-89a5-3e7f5b5af7c2"
                },
                {
                    "ref": "equal",
                    "id": "a7251af0-50a7-4823-85a0-66ce09d8a3cc"
                }
            ]
        },
        "1229d478-bc25-4401-8a89-74fc6cfe8996": {
            "type": "number",
            "value": 2,
            "transformations": []
        },
        "ee2423e6-5b48-41ae-8ccf-6a2c7b46d2f8": {
            "type": "number",
            "value": 0,
            "transformations": []
        }
    },
    "join": {
        "p9s3d6d2-00db-8ab5-c332-882575f25426": {
            "value": {
                "ref": "pipe",
                "id": "um5ed6d2-00db-8ab5-c332-882575f25426"
            }
        },
        "wf9ad6d2-00db-8ab5-c332-882575f25426": {
            "value": {
                "ref": "pipe",
                "id": "qww9d6d2-00db-8ab5-c332-882575f25426"
            }
        },
        "s258d6d2-00db-8ab5-c332-882575f25426": {
            "value": {
                "ref": "pipe",
                "id": "qdw7c6d2-00db-8ab5-c332-882575f25426"
            }
        }
    },
    "add": {
        "w86fd6d2-00db-8ab5-c332-882575f25426": {
            "value": {
                "ref": "pipe",
                "id": "ew83d6d2-00db-8ab5-c332-882575f25426"
            }
        },
        "wbr7d6d2-00db-8ab5-c332-882575f25426": {
            "value": {
                "ref": "listValue",
                "id": "pz7hd6d2-00db-8ab5-c332-882575f25426"
            }
        },
        "vq8dd6d2-00db-8ab5-c332-882575f25426": {
            "value": {
                "ref": "listValue",
                "id": "hj9wd6d2-00db-8ab5-c332-882575f25426"
            }
        }
    },
    "subtract": {
        "u43wd6d2-00db-8ab5-c332-882575f25426": {
            "value": {
                "ref": "pipe",
                "id": "w3e9d6d2-00db-8ab5-c332-882575f25426"
            }
        }
    },
    "remainder": {
        "34780d22-f521-4c30-89a5-3e7f5b5af7c2": {
            "value": {
                "ref": "pipe",
                "id": "1229d478-bc25-4401-8a89-74fc6cfe8996"
            }
        }
    },
    "vNodeBox": {
        "_rootNode": {
            "title": "box",
            "style": {
                "ref": "style",
                "id": "_rootStyle"
            },
            "children": [
                {
                    "ref": "vNodeText",
                    "id": "2471d6d2-00db-8ab5-c332-882575f25425"
                },
                {
                    "ref": "vNodeText",
                    "id": "1481d6d2-00db-8ab5-c332-882575f25425"
                },
                {
                    "ref": "vNodeText",
                    "id": "3481d6d2-00db-8ab5-c332-882575f25425"
                },
                {
                    "ref": "vNodeIf",
                    "id": "5787c15a-426b-41eb-831d-e3e074159582"
                },
                {
                    "ref": "vNodeList",
                    "id": "fl89d6d2-00db-8ab5-c332-882575f25425"
                }
            ]
        },
        "gw9dd6d2-00db-8ab5-c332-882575f25426": {
            "title": "box",
            "style": {
                "ref": "style",
                "id": "fq9dd6d2-00db-8ab5-c332-882575f25426"
            },
            "children": []
        }
    },
    "vNodeText": {
        "2471d6d2-00db-8ab5-c332-882575f25425": {
            "title": "text",
            "style": {
                "ref": "style",
                "id": "8481d6d2-00db-8ab5-c332-882575f25426"
            },
            "value": {
                "ref": "pipe",
                "id": "fw8jd6d2-00db-8ab5-c332-882575f25426"
            }
        },
        "1481d6d2-00db-8ab5-c332-882575f25425": {
            "title": "text",
            "value": {
                "ref": "pipe",
                "id": "ui8jd6d2-00db-8ab5-c332-882575f25426"
            },
            "style": {
                "ref": "style",
                "id": "9481d6d2-00db-8ab5-c332-882575f25426"
            },
            "click": {
                "ref": "event",
                "id": "d48rd6d2-00db-8ab5-c332-882575f25426"
            }
        },
        "3481d6d2-00db-8ab5-c332-882575f25425": {
            "title": "text",
            "value": {
                "ref": "pipe",
                "id": "c8wed6d2-00db-8ab5-c332-882575f25426"
            },
            "style": {
                "ref": "style",
                "id": "7481d6d2-00db-8ab5-c332-882575f25426"
            },
            "click": {
                "ref": "event",
                "id": "3a54d6d2-00db-8ab5-c332-882575f25426"
            }
        },
        "e8add1c7-8a01-4164-8604-722d8ab529f1": {
            "title": "text",
            "style": {
                "ref": "style",
                "id": "4dca73b3-90eb-41e7-8651-2bdcc93f3871"
            },
            "value": {
                "ref": "pipe",
                "id": "84369aba-4a4d-4932-8a9a-8f9ca948b6a2"
            }
        }
    },
    "vNodeInput": {},
    "vNodeList": {
        "fl89d6d2-00db-8ab5-c332-882575f25425": {
            "title": "list",
            "value": {
                "ref": "pipe",
                "id": "f9qxd6d2-00db-8ab5-c332-882575f25426"
            },
            "style": {
                "ref": "style",
                "id": "q86sd89d-3703-483e-ab64-5a5b780aec27"
            },
            "children": [
                {
                    "ref": "vNodeBox",
                    "id": "gw9dd6d2-00db-8ab5-c332-882575f25426"
                }
            ]
        }
    },
    "vNodeIf": {
        "5787c15a-426b-41eb-831d-e3e074159582": {
            "title": "if",
            "value": {
                "ref": "pipe",
                "id": "c2fb9a9b-25bb-4e8b-80c0-cf51b8506070"
            },
            "style": {
                "ref": "style",
                "id": "a1a8c5b9-a7d1-416b-8e76-eac96fb273c9"
            },
            "children": [
                {
                    "ref": "vNodeText",
                    "id": "e8add1c7-8a01-4164-8604-722d8ab529f1"
                }
            ]
        }
    },
    "style": {
        "_rootStyle": {
            "fontFamily": "'Comfortaa', cursive",
            "background": "#f5f5f5",
            "minHeight": "100%"
        },
        "8481d6d2-00db-8ab5-c332-882575f25426": {
            "padding": "10px",
            "margin": "10px 5px"
        },
        "9481d6d2-00db-8ab5-c332-882575f25426": {
            "padding": "10px 15px",
            "background": "#aaaaaa",
            "display": "inline-block",
            "marginLeft": "5px",
            "borderRadius": "3px",
            "cursor": "pointer",
            "userSelect": "none",
            "margin": "10px 5px"
        },
        "7481d6d2-00db-8ab5-c332-882575f25426": {
            "padding": "10px 15px",
            "background": "#999999",
            "display": "inline-block",
            "marginLeft": "5px",
            "borderRadius": "3px",
            "cursor": "pointer",
            "margin": "10px 5px",
            "userSelect": "none"
        },
        "8092ac5e-dfd0-4492-a65d-8ac3eec325e0": {
            "padding": "10px 10px 10px 0"
        },
        "a9461e28-7d92-49a0-9001-23d74e4b382d": {
            "padding": "10px 10px 10px 0"
        },
        "766b11ec-da27-494c-b272-c26fec3f6475": {
            "padding": "10px",
            "float": "right",
            "paddingRight": "50px",
            "textAlign": "right",
            "maxWidth": "500px",
            "line-height": "1.5"
        },
        "cbcd8edb-4aa2-43fe-ad39-cee79b490295": {
            "padding": "10px",
            "display": "block"
        },
        "6763f102-23f7-4390-b463-4e1b14e866c9": {
            "padding": "10px",
            "display": "block"
        },
        "91c9adf0-d62e-4580-93e7-f39594ae5e7d": {
            "padding": "10px",
            "display": "block"
        },
        "e9fbeb39-7193-4522-91b3-761bd35639d3": {
            "padding": "10px",
            "display": "block"
        },
        "3cf5d89d-3703-483e-ab64-5a5b780aec27": {
            "padding": "10px",
            "display": "block"
        },
        "q86sd89d-3703-483e-ab64-5a5b780aec27": {
            "padding": "20px"
        },
        "fq9dd6d2-00db-8ab5-c332-882575f25426": {
            "padding": "10px",
            "width": {
                "ref": "pipe",
                "id": "3qkid6d2-00db-8ab5-c332-882575f25426"
            },
            "height": {
                "ref": "pipe",
                "id": "t7vqd6d2-00db-8ab5-c332-882575f25426"
            },
            "background": {
                "ref": "pipe",
                "id": "8cq6b6d2-00db-8ab5-c332-882575f25426"
            }
        },
        "4dca73b3-90eb-41e7-8651-2bdcc93f3871": {
            "padding": "10px"
        },
        "a1a8c5b9-a7d1-416b-8e76-eac96fb273c9": {
            "padding": "10px"
        }
    },
    "nameSpace": {
        "_rootNameSpace": {
            "title": "state",
            "children": [
                {
                    "ref": "state",
                    "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
                },
                {
                    "ref": "state",
                    "id": "c8q9d6d2-00db-8ab5-c332-882575f25426"
                }
            ]
        }
    },
    "state": {
        "46vdd6d2-00db-8ab5-c332-882575f25426": {
            "title": "count",
            "ref": "46vdd6d2-00db-8ab5-c332-882575f25426",
            "type": "number",
            "defaultValue": 0,
            "mutators": [
                {
                    "ref": "mutator",
                    "id": "as55d6d2-00db-8ab5-c332-882575f25426"
                },
                {
                    "ref": "mutator",
                    "id": "9dq8d6d2-00db-8ab5-c332-882575f25426"
                }
            ]
        },
        "c8q9d6d2-00db-8ab5-c332-882575f25426": {
            "title": "tiles",
            "ref": "c8q9d6d2-00db-8ab5-c332-882575f25426",
            "type": "table",
            "definition": {
                "x": "number",
                "y": "number",
                "color": "text"
            },
            "defaultValue": {
                "ops6d6d2-00db-8ab5-c332-882575f25426": {
                    "x": 120,
                    "y": 100,
                    "color": "#eab65c"
                },
                "wpv5d6d2-00db-8ab5-c332-882575f25426": {
                    "x": 200,
                    "y": 120,
                    "color": "#53B2ED"
                },
                "qn27d6d2-00db-8ab5-c332-882575f25426": {
                    "x": 130,
                    "y": 200,
                    "color": "#5bcc5b"
                },
                "ca9rd6d2-00db-8ab5-c332-882575f25426": {
                    "x": 150,
                    "y": 150,
                    "color": "#4d4d4d"
                }
            },
            "mutators": []
        }
    },
    "mutator": {
        "as55d6d2-00db-8ab5-c332-882575f25426": {
            "event": {
                "ref": "event",
                "id": "d48rd6d2-00db-8ab5-c332-882575f25426"
            },
            "state": {
                "ref": "state",
                "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
            },
            "mutation": {
                "ref": "pipe",
                "id": "pdq6d6d2-00db-8ab5-c332-882575f25426"
            }
        },
        "9dq8d6d2-00db-8ab5-c332-882575f25426": {
            "event": {
                "ref": "event",
                "id": "3a54d6d2-00db-8ab5-c332-882575f25426"
            },
            "state": {
                "ref": "state",
                "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
            },
            "mutation": {
                "ref": "pipe",
                "id": "452qd6d2-00db-8ab5-c332-882575f25426"
            }
        }
    },
    "event": {
        "d48rd6d2-00db-8ab5-c332-882575f25426": {
            "title": "increment",
            "mutators": [
                {
                    "ref": "mutator",
                    "id": "as55d6d2-00db-8ab5-c332-882575f25426"
                }
            ],
            "data": []
        },
        "3a54d6d2-00db-8ab5-c332-882575f25426": {
            "title": "decrement",
            "mutators": [
                {
                    "ref": "mutator",
                    "id": "9dq8d6d2-00db-8ab5-c332-882575f25426"
                }
            ],
            "data": []
        }
    }
}
},{}]},{},[12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmlnLmpzL2JpZy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9oLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL2h0bWxkb21hcGkuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vaXMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvY2xhc3MuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9ldmVudGxpc3RlbmVycy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL3Byb3BzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvc3R5bGUuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vc25hYmJkb20uanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vdm5vZGUuanMiLCJzcmNcXGluZGV4LmpzIiwic3JjXFx1Z25pcy5qcyIsInVnbmlzX2NvbXBvbmVudHMvYXBwLmpzb24iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdG5DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBiaWcuanMgdjMuMS4zIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWtlTWNsL2JpZy5qcy9MSUNFTkNFICovXHJcbjsoZnVuY3Rpb24gKGdsb2JhbCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuLypcclxuICBiaWcuanMgdjMuMS4zXHJcbiAgQSBzbWFsbCwgZmFzdCwgZWFzeS10by11c2UgbGlicmFyeSBmb3IgYXJiaXRyYXJ5LXByZWNpc2lvbiBkZWNpbWFsIGFyaXRobWV0aWMuXHJcbiAgaHR0cHM6Ly9naXRodWIuY29tL01pa2VNY2wvYmlnLmpzL1xyXG4gIENvcHlyaWdodCAoYykgMjAxNCBNaWNoYWVsIE1jbGF1Z2hsaW4gPE04Y2g4OGxAZ21haWwuY29tPlxyXG4gIE1JVCBFeHBhdCBMaWNlbmNlXHJcbiovXHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogRURJVEFCTEUgREVGQVVMVFMgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICAgIC8vIFRoZSBkZWZhdWx0IHZhbHVlcyBiZWxvdyBtdXN0IGJlIGludGVnZXJzIHdpdGhpbiB0aGUgc3RhdGVkIHJhbmdlcy5cclxuXHJcbiAgICAvKlxyXG4gICAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIG9mIHRoZSByZXN1bHRzIG9mIG9wZXJhdGlvbnNcclxuICAgICAqIGludm9sdmluZyBkaXZpc2lvbjogZGl2IGFuZCBzcXJ0LCBhbmQgcG93IHdpdGggbmVnYXRpdmUgZXhwb25lbnRzLlxyXG4gICAgICovXHJcbiAgICB2YXIgRFAgPSAyMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWF9EUFxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFRoZSByb3VuZGluZyBtb2RlIHVzZWQgd2hlbiByb3VuZGluZyB0byB0aGUgYWJvdmUgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAwIFRvd2FyZHMgemVybyAoaS5lLiB0cnVuY2F0ZSwgbm8gcm91bmRpbmcpLiAgICAgICAoUk9VTkRfRE9XTilcclxuICAgICAgICAgKiAxIFRvIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgcm91bmQgdXAuICAoUk9VTkRfSEFMRl9VUClcclxuICAgICAgICAgKiAyIFRvIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdG8gZXZlbi4gICAoUk9VTkRfSEFMRl9FVkVOKVxyXG4gICAgICAgICAqIDMgQXdheSBmcm9tIHplcm8uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChST1VORF9VUClcclxuICAgICAgICAgKi9cclxuICAgICAgICBSTSA9IDEsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAsIDEsIDIgb3IgM1xyXG5cclxuICAgICAgICAvLyBUaGUgbWF4aW11bSB2YWx1ZSBvZiBEUCBhbmQgQmlnLkRQLlxyXG4gICAgICAgIE1BWF9EUCA9IDFFNiwgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byAxMDAwMDAwXHJcblxyXG4gICAgICAgIC8vIFRoZSBtYXhpbXVtIG1hZ25pdHVkZSBvZiB0aGUgZXhwb25lbnQgYXJndW1lbnQgdG8gdGhlIHBvdyBtZXRob2QuXHJcbiAgICAgICAgTUFYX1BPV0VSID0gMUU2LCAgICAgICAgICAgICAgICAgICAvLyAxIHRvIDEwMDAwMDBcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBUaGUgZXhwb25lbnQgdmFsdWUgYXQgYW5kIGJlbmVhdGggd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbFxyXG4gICAgICAgICAqIG5vdGF0aW9uLlxyXG4gICAgICAgICAqIEphdmFTY3JpcHQncyBOdW1iZXIgdHlwZTogLTdcclxuICAgICAgICAgKiAtMTAwMDAwMCBpcyB0aGUgbWluaW11bSByZWNvbW1lbmRlZCBleHBvbmVudCB2YWx1ZSBvZiBhIEJpZy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBFX05FRyA9IC03LCAgICAgICAgICAgICAgICAgICAvLyAwIHRvIC0xMDAwMDAwXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogVGhlIGV4cG9uZW50IHZhbHVlIGF0IGFuZCBhYm92ZSB3aGljaCB0b1N0cmluZyByZXR1cm5zIGV4cG9uZW50aWFsXHJcbiAgICAgICAgICogbm90YXRpb24uXHJcbiAgICAgICAgICogSmF2YVNjcmlwdCdzIE51bWJlciB0eXBlOiAyMVxyXG4gICAgICAgICAqIDEwMDAwMDAgaXMgdGhlIG1heGltdW0gcmVjb21tZW5kZWQgZXhwb25lbnQgdmFsdWUgb2YgYSBCaWcuXHJcbiAgICAgICAgICogKFRoaXMgbGltaXQgaXMgbm90IGVuZm9yY2VkIG9yIGNoZWNrZWQuKVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEVfUE9TID0gMjEsICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gMTAwMDAwMFxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgICAgICAgLy8gVGhlIHNoYXJlZCBwcm90b3R5cGUgb2JqZWN0LlxyXG4gICAgICAgIFAgPSB7fSxcclxuICAgICAgICBpc1ZhbGlkID0gL14tPyhcXGQrKFxcLlxcZCopP3xcXC5cXGQrKShlWystXT9cXGQrKT8kL2ksXHJcbiAgICAgICAgQmlnO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBCaWcgY29uc3RydWN0b3IuXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBiaWdGYWN0b3J5KCkge1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFRoZSBCaWcgY29uc3RydWN0b3IgYW5kIGV4cG9ydGVkIGZ1bmN0aW9uLlxyXG4gICAgICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgbmV3IGluc3RhbmNlIG9mIGEgQmlnIG51bWJlciBvYmplY3QuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBuIHtudW1iZXJ8c3RyaW5nfEJpZ30gQSBudW1lcmljIHZhbHVlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIEJpZyhuKSB7XHJcbiAgICAgICAgICAgIHZhciB4ID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIC8vIEVuYWJsZSBjb25zdHJ1Y3RvciB1c2FnZSB3aXRob3V0IG5ldy5cclxuICAgICAgICAgICAgaWYgKCEoeCBpbnN0YW5jZW9mIEJpZykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuID09PSB2b2lkIDAgPyBiaWdGYWN0b3J5KCkgOiBuZXcgQmlnKG4pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBEdXBsaWNhdGUuXHJcbiAgICAgICAgICAgIGlmIChuIGluc3RhbmNlb2YgQmlnKSB7XHJcbiAgICAgICAgICAgICAgICB4LnMgPSBuLnM7XHJcbiAgICAgICAgICAgICAgICB4LmUgPSBuLmU7XHJcbiAgICAgICAgICAgICAgICB4LmMgPSBuLmMuc2xpY2UoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBhcnNlKHgsIG4pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgKiBSZXRhaW4gYSByZWZlcmVuY2UgdG8gdGhpcyBCaWcgY29uc3RydWN0b3IsIGFuZCBzaGFkb3dcclxuICAgICAgICAgICAgICogQmlnLnByb3RvdHlwZS5jb25zdHJ1Y3RvciB3aGljaCBwb2ludHMgdG8gT2JqZWN0LlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgeC5jb25zdHJ1Y3RvciA9IEJpZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEJpZy5wcm90b3R5cGUgPSBQO1xyXG4gICAgICAgIEJpZy5EUCA9IERQO1xyXG4gICAgICAgIEJpZy5STSA9IFJNO1xyXG4gICAgICAgIEJpZy5FX05FRyA9IEVfTkVHO1xyXG4gICAgICAgIEJpZy5FX1BPUyA9IEVfUE9TO1xyXG5cclxuICAgICAgICByZXR1cm4gQmlnO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBQcml2YXRlIGZ1bmN0aW9uc1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgQmlnIHggaW4gbm9ybWFsIG9yIGV4cG9uZW50aWFsXHJcbiAgICAgKiBub3RhdGlvbiB0byBkcCBmaXhlZCBkZWNpbWFsIHBsYWNlcyBvciBzaWduaWZpY2FudCBkaWdpdHMuXHJcbiAgICAgKlxyXG4gICAgICogeCB7QmlnfSBUaGUgQmlnIHRvIGZvcm1hdC5cclxuICAgICAqIGRwIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICAgICAqIHRvRSB7bnVtYmVyfSAxICh0b0V4cG9uZW50aWFsKSwgMiAodG9QcmVjaXNpb24pIG9yIHVuZGVmaW5lZCAodG9GaXhlZCkuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGZvcm1hdCh4LCBkcCwgdG9FKSB7XHJcbiAgICAgICAgdmFyIEJpZyA9IHguY29uc3RydWN0b3IsXHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgaW5kZXggKG5vcm1hbCBub3RhdGlvbikgb2YgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgICAgIGkgPSBkcCAtICh4ID0gbmV3IEJpZyh4KSkuZSxcclxuICAgICAgICAgICAgYyA9IHguYztcclxuXHJcbiAgICAgICAgLy8gUm91bmQ/XHJcbiAgICAgICAgaWYgKGMubGVuZ3RoID4gKytkcCkge1xyXG4gICAgICAgICAgICBybmQoeCwgaSwgQmlnLlJNKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY1swXSkge1xyXG4gICAgICAgICAgICArK2k7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0b0UpIHtcclxuICAgICAgICAgICAgaSA9IGRwO1xyXG5cclxuICAgICAgICAvLyB0b0ZpeGVkXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYyA9IHguYztcclxuXHJcbiAgICAgICAgICAgIC8vIFJlY2FsY3VsYXRlIGkgYXMgeC5lIG1heSBoYXZlIGNoYW5nZWQgaWYgdmFsdWUgcm91bmRlZCB1cC5cclxuICAgICAgICAgICAgaSA9IHguZSArIGkgKyAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQXBwZW5kIHplcm9zP1xyXG4gICAgICAgIGZvciAoOyBjLmxlbmd0aCA8IGk7IGMucHVzaCgwKSkge1xyXG4gICAgICAgIH1cclxuICAgICAgICBpID0geC5lO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIHRvUHJlY2lzaW9uIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24gaWYgdGhlIG51bWJlciBvZlxyXG4gICAgICAgICAqIHNpZ25pZmljYW50IGRpZ2l0cyBzcGVjaWZpZWQgaXMgbGVzcyB0aGFuIHRoZSBudW1iZXIgb2YgZGlnaXRzXHJcbiAgICAgICAgICogbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlciBwYXJ0IG9mIHRoZSB2YWx1ZSBpbiBub3JtYWxcclxuICAgICAgICAgKiBub3RhdGlvbi5cclxuICAgICAgICAgKi9cclxuICAgICAgICByZXR1cm4gdG9FID09PSAxIHx8IHRvRSAmJiAoZHAgPD0gaSB8fCBpIDw9IEJpZy5FX05FRykgP1xyXG5cclxuICAgICAgICAgIC8vIEV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAgICAgKHgucyA8IDAgJiYgY1swXSA/ICctJyA6ICcnKSArXHJcbiAgICAgICAgICAgIChjLmxlbmd0aCA+IDEgPyBjWzBdICsgJy4nICsgYy5qb2luKCcnKS5zbGljZSgxKSA6IGNbMF0pICtcclxuICAgICAgICAgICAgICAoaSA8IDAgPyAnZScgOiAnZSsnKSArIGlcclxuXHJcbiAgICAgICAgICAvLyBOb3JtYWwgbm90YXRpb24uXHJcbiAgICAgICAgICA6IHgudG9TdHJpbmcoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFBhcnNlIHRoZSBudW1iZXIgb3Igc3RyaW5nIHZhbHVlIHBhc3NlZCB0byBhIEJpZyBjb25zdHJ1Y3Rvci5cclxuICAgICAqXHJcbiAgICAgKiB4IHtCaWd9IEEgQmlnIG51bWJlciBpbnN0YW5jZS5cclxuICAgICAqIG4ge251bWJlcnxzdHJpbmd9IEEgbnVtZXJpYyB2YWx1ZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcGFyc2UoeCwgbikge1xyXG4gICAgICAgIHZhciBlLCBpLCBuTDtcclxuXHJcbiAgICAgICAgLy8gTWludXMgemVybz9cclxuICAgICAgICBpZiAobiA9PT0gMCAmJiAxIC8gbiA8IDApIHtcclxuICAgICAgICAgICAgbiA9ICctMCc7XHJcblxyXG4gICAgICAgIC8vIEVuc3VyZSBuIGlzIHN0cmluZyBhbmQgY2hlY2sgdmFsaWRpdHkuXHJcbiAgICAgICAgfSBlbHNlIGlmICghaXNWYWxpZC50ZXN0KG4gKz0gJycpKSB7XHJcbiAgICAgICAgICAgIHRocm93RXJyKE5hTik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZXRlcm1pbmUgc2lnbi5cclxuICAgICAgICB4LnMgPSBuLmNoYXJBdCgwKSA9PSAnLScgPyAobiA9IG4uc2xpY2UoMSksIC0xKSA6IDE7XHJcblxyXG4gICAgICAgIC8vIERlY2ltYWwgcG9pbnQ/XHJcbiAgICAgICAgaWYgKChlID0gbi5pbmRleE9mKCcuJykpID4gLTEpIHtcclxuICAgICAgICAgICAgbiA9IG4ucmVwbGFjZSgnLicsICcnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9uZW50aWFsIGZvcm0/XHJcbiAgICAgICAgaWYgKChpID0gbi5zZWFyY2goL2UvaSkpID4gMCkge1xyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGV4cG9uZW50LlxyXG4gICAgICAgICAgICBpZiAoZSA8IDApIHtcclxuICAgICAgICAgICAgICAgIGUgPSBpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUgKz0gK24uc2xpY2UoaSArIDEpO1xyXG4gICAgICAgICAgICBuID0gbi5zdWJzdHJpbmcoMCwgaSk7XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoZSA8IDApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIEludGVnZXIuXHJcbiAgICAgICAgICAgIGUgPSBuLmxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIERldGVybWluZSBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoaSA9IDA7IG4uY2hhckF0KGkpID09ICcwJzsgaSsrKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaSA9PSAobkwgPSBuLmxlbmd0aCkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgICAgIHguYyA9IFsgeC5lID0gMCBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICAgIGZvciAoOyBuLmNoYXJBdCgtLW5MKSA9PSAnMCc7KSB7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHguZSA9IGUgLSBpIC0gMTtcclxuICAgICAgICAgICAgeC5jID0gW107XHJcblxyXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHN0cmluZyB0byBhcnJheSBvZiBkaWdpdHMgd2l0aG91dCBsZWFkaW5nL3RyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgICAgICBmb3IgKGUgPSAwOyBpIDw9IG5MOyB4LmNbZSsrXSA9ICtuLmNoYXJBdChpKyspKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB4O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUm91bmQgQmlnIHggdG8gYSBtYXhpbXVtIG9mIGRwIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0uXHJcbiAgICAgKiBDYWxsZWQgYnkgZGl2LCBzcXJ0IGFuZCByb3VuZC5cclxuICAgICAqXHJcbiAgICAgKiB4IHtCaWd9IFRoZSBCaWcgdG8gcm91bmQuXHJcbiAgICAgKiBkcCB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICAgKiBybSB7bnVtYmVyfSAwLCAxLCAyIG9yIDMgKERPV04sIEhBTEZfVVAsIEhBTEZfRVZFTiwgVVApXHJcbiAgICAgKiBbbW9yZV0ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHJlc3VsdCBvZiBkaXZpc2lvbiB3YXMgdHJ1bmNhdGVkLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBybmQoeCwgZHAsIHJtLCBtb3JlKSB7XHJcbiAgICAgICAgdmFyIHUsXHJcbiAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICBpID0geC5lICsgZHAgKyAxO1xyXG5cclxuICAgICAgICBpZiAocm0gPT09IDEpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIHhjW2ldIGlzIHRoZSBkaWdpdCBhZnRlciB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cC5cclxuICAgICAgICAgICAgbW9yZSA9IHhjW2ldID49IDU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChybSA9PT0gMikge1xyXG4gICAgICAgICAgICBtb3JlID0geGNbaV0gPiA1IHx8IHhjW2ldID09IDUgJiZcclxuICAgICAgICAgICAgICAobW9yZSB8fCBpIDwgMCB8fCB4Y1tpICsgMV0gIT09IHUgfHwgeGNbaSAtIDFdICYgMSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChybSA9PT0gMykge1xyXG4gICAgICAgICAgICBtb3JlID0gbW9yZSB8fCB4Y1tpXSAhPT0gdSB8fCBpIDwgMDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBtb3JlID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAocm0gIT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRocm93RXJyKCchQmlnLlJNIScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaSA8IDEgfHwgIXhjWzBdKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAobW9yZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIDEsIDAuMSwgMC4wMSwgMC4wMDEsIDAuMDAwMSBldGMuXHJcbiAgICAgICAgICAgICAgICB4LmUgPSAtZHA7XHJcbiAgICAgICAgICAgICAgICB4LmMgPSBbMV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gWmVyby5cclxuICAgICAgICAgICAgICAgIHguYyA9IFt4LmUgPSAwXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYW55IGRpZ2l0cyBhZnRlciB0aGUgcmVxdWlyZWQgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IGktLTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJvdW5kIHVwP1xyXG4gICAgICAgICAgICBpZiAobW9yZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJvdW5kaW5nIHVwIG1heSBtZWFuIHRoZSBwcmV2aW91cyBkaWdpdCBoYXMgdG8gYmUgcm91bmRlZCB1cC5cclxuICAgICAgICAgICAgICAgIGZvciAoOyArK3hjW2ldID4gOTspIHtcclxuICAgICAgICAgICAgICAgICAgICB4Y1tpXSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsreC5lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB4Yy51bnNoaWZ0KDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgICAgICBmb3IgKGkgPSB4Yy5sZW5ndGg7ICF4Y1stLWldOyB4Yy5wb3AoKSkge1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFRocm93IGEgQmlnRXJyb3IuXHJcbiAgICAgKlxyXG4gICAgICogbWVzc2FnZSB7c3RyaW5nfSBUaGUgZXJyb3IgbWVzc2FnZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gdGhyb3dFcnIobWVzc2FnZSkge1xyXG4gICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgZXJyLm5hbWUgPSAnQmlnRXJyb3InO1xyXG5cclxuICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIFByb3RvdHlwZS9pbnN0YW5jZSBtZXRob2RzXHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZiB0aGlzIEJpZy5cclxuICAgICAqL1xyXG4gICAgUC5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHggPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzKTtcclxuICAgICAgICB4LnMgPSAxO1xyXG5cclxuICAgICAgICByZXR1cm4geDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm5cclxuICAgICAqIDEgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGdyZWF0ZXIgdGhhbiB0aGUgdmFsdWUgb2YgQmlnIHksXHJcbiAgICAgKiAtMSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaXMgbGVzcyB0aGFuIHRoZSB2YWx1ZSBvZiBCaWcgeSwgb3JcclxuICAgICAqIDAgaWYgdGhleSBoYXZlIHRoZSBzYW1lIHZhbHVlLlxyXG4gICAgKi9cclxuICAgIFAuY21wID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICB2YXIgeE5lZyxcclxuICAgICAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICB5YyA9ICh5ID0gbmV3IHguY29uc3RydWN0b3IoeSkpLmMsXHJcbiAgICAgICAgICAgIGkgPSB4LnMsXHJcbiAgICAgICAgICAgIGogPSB5LnMsXHJcbiAgICAgICAgICAgIGsgPSB4LmUsXHJcbiAgICAgICAgICAgIGwgPSB5LmU7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAheGNbMF0gPyAheWNbMF0gPyAwIDogLWogOiBpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgICAgIGlmIChpICE9IGopIHtcclxuICAgICAgICAgICAgcmV0dXJuIGk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHhOZWcgPSBpIDwgMDtcclxuXHJcbiAgICAgICAgLy8gQ29tcGFyZSBleHBvbmVudHMuXHJcbiAgICAgICAgaWYgKGsgIT0gbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gayA+IGwgXiB4TmVnID8gMSA6IC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaSA9IC0xO1xyXG4gICAgICAgIGogPSAoayA9IHhjLmxlbmd0aCkgPCAobCA9IHljLmxlbmd0aCkgPyBrIDogbDtcclxuXHJcbiAgICAgICAgLy8gQ29tcGFyZSBkaWdpdCBieSBkaWdpdC5cclxuICAgICAgICBmb3IgKDsgKytpIDwgajspIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh4Y1tpXSAhPSB5Y1tpXSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhjW2ldID4geWNbaV0gXiB4TmVnID8gMSA6IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb21wYXJlIGxlbmd0aHMuXHJcbiAgICAgICAgcmV0dXJuIGsgPT0gbCA/IDAgOiBrID4gbCBeIHhOZWcgPyAxIDogLTE7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgZGl2aWRlZCBieSB0aGVcclxuICAgICAqIHZhbHVlIG9mIEJpZyB5LCByb3VuZGVkLCBpZiBuZWNlc3NhcnksIHRvIGEgbWF4aW11bSBvZiBCaWcuRFAgZGVjaW1hbFxyXG4gICAgICogcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgQmlnLlJNLlxyXG4gICAgICovXHJcbiAgICBQLmRpdiA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICAvLyBkaXZpZGVuZFxyXG4gICAgICAgICAgICBkdmQgPSB4LmMsXHJcbiAgICAgICAgICAgIC8vZGl2aXNvclxyXG4gICAgICAgICAgICBkdnMgPSAoeSA9IG5ldyBCaWcoeSkpLmMsXHJcbiAgICAgICAgICAgIHMgPSB4LnMgPT0geS5zID8gMSA6IC0xLFxyXG4gICAgICAgICAgICBkcCA9IEJpZy5EUDtcclxuXHJcbiAgICAgICAgaWYgKGRwICE9PSB+fmRwIHx8IGRwIDwgMCB8fCBkcCA+IE1BWF9EUCkge1xyXG4gICAgICAgICAgICB0aHJvd0VycignIUJpZy5EUCEnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciAwP1xyXG4gICAgICAgIGlmICghZHZkWzBdIHx8ICFkdnNbMF0pIHtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIGJvdGggYXJlIDAsIHRocm93IE5hTlxyXG4gICAgICAgICAgICBpZiAoZHZkWzBdID09IGR2c1swXSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3dFcnIoTmFOKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gSWYgZHZzIGlzIDAsIHRocm93ICstSW5maW5pdHkuXHJcbiAgICAgICAgICAgIGlmICghZHZzWzBdKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvd0VycihzIC8gMCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGR2ZCBpcyAwLCByZXR1cm4gKy0wLlxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJpZyhzICogMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZHZzTCwgZHZzVCwgbmV4dCwgY21wLCByZW1JLCB1LFxyXG4gICAgICAgICAgICBkdnNaID0gZHZzLnNsaWNlKCksXHJcbiAgICAgICAgICAgIGR2ZEkgPSBkdnNMID0gZHZzLmxlbmd0aCxcclxuICAgICAgICAgICAgZHZkTCA9IGR2ZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIC8vIHJlbWFpbmRlclxyXG4gICAgICAgICAgICByZW0gPSBkdmQuc2xpY2UoMCwgZHZzTCksXHJcbiAgICAgICAgICAgIHJlbUwgPSByZW0ubGVuZ3RoLFxyXG4gICAgICAgICAgICAvLyBxdW90aWVudFxyXG4gICAgICAgICAgICBxID0geSxcclxuICAgICAgICAgICAgcWMgPSBxLmMgPSBbXSxcclxuICAgICAgICAgICAgcWkgPSAwLFxyXG4gICAgICAgICAgICBkaWdpdHMgPSBkcCArIChxLmUgPSB4LmUgLSB5LmUpICsgMTtcclxuXHJcbiAgICAgICAgcS5zID0gcztcclxuICAgICAgICBzID0gZGlnaXRzIDwgMCA/IDAgOiBkaWdpdHM7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSB2ZXJzaW9uIG9mIGRpdmlzb3Igd2l0aCBsZWFkaW5nIHplcm8uXHJcbiAgICAgICAgZHZzWi51bnNoaWZ0KDApO1xyXG5cclxuICAgICAgICAvLyBBZGQgemVyb3MgdG8gbWFrZSByZW1haW5kZXIgYXMgbG9uZyBhcyBkaXZpc29yLlxyXG4gICAgICAgIGZvciAoOyByZW1MKysgPCBkdnNMOyByZW0ucHVzaCgwKSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZG8ge1xyXG5cclxuICAgICAgICAgICAgLy8gJ25leHQnIGlzIGhvdyBtYW55IHRpbWVzIHRoZSBkaXZpc29yIGdvZXMgaW50byBjdXJyZW50IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgZm9yIChuZXh0ID0gMDsgbmV4dCA8IDEwOyBuZXh0KyspIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDb21wYXJlIGRpdmlzb3IgYW5kIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgIGlmIChkdnNMICE9IChyZW1MID0gcmVtLmxlbmd0aCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbXAgPSBkdnNMID4gcmVtTCA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAocmVtSSA9IC0xLCBjbXAgPSAwOyArK3JlbUkgPCBkdnNMOykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGR2c1tyZW1JXSAhPSByZW1bcmVtSV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtcCA9IGR2c1tyZW1JXSA+IHJlbVtyZW1JXSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIGRpdmlzb3IgPCByZW1haW5kZXIsIHN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICBpZiAoY21wIDwgMCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1haW5kZXIgY2FuJ3QgYmUgbW9yZSB0aGFuIDEgZGlnaXQgbG9uZ2VyIHRoYW4gZGl2aXNvci5cclxuICAgICAgICAgICAgICAgICAgICAvLyBFcXVhbGlzZSBsZW5ndGhzIHVzaW5nIGRpdmlzb3Igd2l0aCBleHRyYSBsZWFkaW5nIHplcm8/XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChkdnNUID0gcmVtTCA9PSBkdnNMID8gZHZzIDogZHZzWjsgcmVtTDspIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZW1bLS1yZW1MXSA8IGR2c1RbcmVtTF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbUkgPSByZW1MO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoOyByZW1JICYmICFyZW1bLS1yZW1JXTsgcmVtW3JlbUldID0gOSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLS1yZW1bcmVtSV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1bcmVtTF0gKz0gMTA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtW3JlbUxdIC09IGR2c1RbcmVtTF07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoOyAhcmVtWzBdOyByZW0uc2hpZnQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgJ25leHQnIGRpZ2l0IHRvIHRoZSByZXN1bHQgYXJyYXkuXHJcbiAgICAgICAgICAgIHFjW3FpKytdID0gY21wID8gbmV4dCA6ICsrbmV4dDtcclxuXHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICBpZiAocmVtWzBdICYmIGNtcCkge1xyXG4gICAgICAgICAgICAgICAgcmVtW3JlbUxdID0gZHZkW2R2ZEldIHx8IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZW0gPSBbIGR2ZFtkdmRJXSBdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gd2hpbGUgKChkdmRJKysgPCBkdmRMIHx8IHJlbVswXSAhPT0gdSkgJiYgcy0tKTtcclxuXHJcbiAgICAgICAgLy8gTGVhZGluZyB6ZXJvPyBEbyBub3QgcmVtb3ZlIGlmIHJlc3VsdCBpcyBzaW1wbHkgemVybyAocWkgPT0gMSkuXHJcbiAgICAgICAgaWYgKCFxY1swXSAmJiBxaSAhPSAxKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBUaGVyZSBjYW4ndCBiZSBtb3JlIHRoYW4gb25lIHplcm8uXHJcbiAgICAgICAgICAgIHFjLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIHEuZS0tO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUm91bmQ/XHJcbiAgICAgICAgaWYgKHFpID4gZGlnaXRzKSB7XHJcbiAgICAgICAgICAgIHJuZChxLCBkcCwgQmlnLlJNLCByZW1bMF0gIT09IHUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHE7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZiBCaWcgeSxcclxuICAgICAqIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmVxID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICByZXR1cm4gIXRoaXMuY21wKHkpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZyB5LFxyXG4gICAgICogb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuZ3QgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNtcCh5KSA+IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGVcclxuICAgICAqIHZhbHVlIG9mIEJpZyB5LCBvdGhlcndpc2UgcmV0dXJucyBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5ndGUgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNtcCh5KSA+IC0xO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBsZXNzIHRoYW4gdGhlIHZhbHVlIG9mIEJpZyB5LFxyXG4gICAgICogb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAubHQgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNtcCh5KSA8IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgdmFsdWVcclxuICAgICAqIG9mIEJpZyB5LCBvdGhlcndpc2UgcmV0dXJucyBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5sdGUgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgICByZXR1cm4gdGhpcy5jbXAoeSkgPCAxO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIG1pbnVzIHRoZSB2YWx1ZVxyXG4gICAgICogb2YgQmlnIHkuXHJcbiAgICAgKi9cclxuICAgIFAuc3ViID0gUC5taW51cyA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICAgICAgdmFyIGksIGosIHQsIHhMVHksXHJcbiAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICBhID0geC5zLFxyXG4gICAgICAgICAgICBiID0gKHkgPSBuZXcgQmlnKHkpKS5zO1xyXG5cclxuICAgICAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICAgICAgaWYgKGEgIT0gYikge1xyXG4gICAgICAgICAgICB5LnMgPSAtYjtcclxuICAgICAgICAgICAgcmV0dXJuIHgucGx1cyh5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB4YyA9IHguYy5zbGljZSgpLFxyXG4gICAgICAgICAgICB4ZSA9IHguZSxcclxuICAgICAgICAgICAgeWMgPSB5LmMsXHJcbiAgICAgICAgICAgIHllID0geS5lO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgemVybz9cclxuICAgICAgICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkge1xyXG5cclxuICAgICAgICAgICAgLy8geSBpcyBub24temVybz8geCBpcyBub24temVybz8gT3IgYm90aCBhcmUgemVyby5cclxuICAgICAgICAgICAgcmV0dXJuIHljWzBdID8gKHkucyA9IC1iLCB5KSA6IG5ldyBCaWcoeGNbMF0gPyB4IDogMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZXRlcm1pbmUgd2hpY2ggaXMgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICAgICAgaWYgKGEgPSB4ZSAtIHllKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoeExUeSA9IGEgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgZm9yIChiID0gYTsgYi0tOyB0LnB1c2goMCkpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gRXhwb25lbnRzIGVxdWFsLiBDaGVjayBkaWdpdCBieSBkaWdpdC5cclxuICAgICAgICAgICAgaiA9ICgoeExUeSA9IHhjLmxlbmd0aCA8IHljLmxlbmd0aCkgPyB4YyA6IHljKS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGEgPSBiID0gMDsgYiA8IGo7IGIrKykge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh4Y1tiXSAhPSB5Y1tiXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHhMVHkgPSB4Y1tiXSA8IHljW2JdO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB4IDwgeT8gUG9pbnQgeGMgdG8gdGhlIGFycmF5IG9mIHRoZSBiaWdnZXIgbnVtYmVyLlxyXG4gICAgICAgIGlmICh4TFR5KSB7XHJcbiAgICAgICAgICAgIHQgPSB4YztcclxuICAgICAgICAgICAgeGMgPSB5YztcclxuICAgICAgICAgICAgeWMgPSB0O1xyXG4gICAgICAgICAgICB5LnMgPSAteS5zO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBBcHBlbmQgemVyb3MgdG8geGMgaWYgc2hvcnRlci4gTm8gbmVlZCB0byBhZGQgemVyb3MgdG8geWMgaWYgc2hvcnRlclxyXG4gICAgICAgICAqIGFzIHN1YnRyYWN0aW9uIG9ubHkgbmVlZHMgdG8gc3RhcnQgYXQgeWMubGVuZ3RoLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlmICgoIGIgPSAoaiA9IHljLmxlbmd0aCkgLSAoaSA9IHhjLmxlbmd0aCkgKSA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoOyBiLS07IHhjW2krK10gPSAwKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFN1YnRyYWN0IHljIGZyb20geGMuXHJcbiAgICAgICAgZm9yIChiID0gaTsgaiA+IGE7KXtcclxuXHJcbiAgICAgICAgICAgIGlmICh4Y1stLWpdIDwgeWNbal0pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSBqOyBpICYmICF4Y1stLWldOyB4Y1tpXSA9IDkpIHtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC0teGNbaV07XHJcbiAgICAgICAgICAgICAgICB4Y1tqXSArPSAxMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB4Y1tqXSAtPSB5Y1tqXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKDsgeGNbLS1iXSA9PT0gMDsgeGMucG9wKCkpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9zIGFuZCBhZGp1c3QgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgICAgICAgZm9yICg7IHhjWzBdID09PSAwOykge1xyXG4gICAgICAgICAgICB4Yy5zaGlmdCgpO1xyXG4gICAgICAgICAgICAtLXllO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF4Y1swXSkge1xyXG5cclxuICAgICAgICAgICAgLy8gbiAtIG4gPSArMFxyXG4gICAgICAgICAgICB5LnMgPSAxO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVzdWx0IG11c3QgYmUgemVyby5cclxuICAgICAgICAgICAgeGMgPSBbeWUgPSAwXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHkuYyA9IHhjO1xyXG4gICAgICAgIHkuZSA9IHllO1xyXG5cclxuICAgICAgICByZXR1cm4geTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBtb2R1bG8gdGhlXHJcbiAgICAgKiB2YWx1ZSBvZiBCaWcgeS5cclxuICAgICAqL1xyXG4gICAgUC5tb2QgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHZhciB5R1R4LFxyXG4gICAgICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgICAgICAgYSA9IHgucyxcclxuICAgICAgICAgICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkucztcclxuXHJcbiAgICAgICAgaWYgKCF5LmNbMF0pIHtcclxuICAgICAgICAgICAgdGhyb3dFcnIoTmFOKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHgucyA9IHkucyA9IDE7XHJcbiAgICAgICAgeUdUeCA9IHkuY21wKHgpID09IDE7XHJcbiAgICAgICAgeC5zID0gYTtcclxuICAgICAgICB5LnMgPSBiO1xyXG5cclxuICAgICAgICBpZiAoeUdUeCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJpZyh4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGEgPSBCaWcuRFA7XHJcbiAgICAgICAgYiA9IEJpZy5STTtcclxuICAgICAgICBCaWcuRFAgPSBCaWcuUk0gPSAwO1xyXG4gICAgICAgIHggPSB4LmRpdih5KTtcclxuICAgICAgICBCaWcuRFAgPSBhO1xyXG4gICAgICAgIEJpZy5STSA9IGI7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLm1pbnVzKCB4LnRpbWVzKHkpICk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgcGx1cyB0aGUgdmFsdWVcclxuICAgICAqIG9mIEJpZyB5LlxyXG4gICAgICovXHJcbiAgICBQLmFkZCA9IFAucGx1cyA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICAgICAgdmFyIHQsXHJcbiAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICBhID0geC5zLFxyXG4gICAgICAgICAgICBiID0gKHkgPSBuZXcgQmlnKHkpKS5zO1xyXG5cclxuICAgICAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICAgICAgaWYgKGEgIT0gYikge1xyXG4gICAgICAgICAgICB5LnMgPSAtYjtcclxuICAgICAgICAgICAgcmV0dXJuIHgubWludXMoeSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgeGUgPSB4LmUsXHJcbiAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICB5ZSA9IHkuZSxcclxuICAgICAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSB7XHJcblxyXG4gICAgICAgICAgICAvLyB5IGlzIG5vbi16ZXJvPyB4IGlzIG5vbi16ZXJvPyBPciBib3RoIGFyZSB6ZXJvLlxyXG4gICAgICAgICAgICByZXR1cm4geWNbMF0gPyB5IDogbmV3IEJpZyh4Y1swXSA/IHggOiBhICogMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHhjID0geGMuc2xpY2UoKTtcclxuXHJcbiAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICAgICAgLy8gTm90ZTogRmFzdGVyIHRvIHVzZSByZXZlcnNlIHRoZW4gZG8gdW5zaGlmdHMuXHJcbiAgICAgICAgaWYgKGEgPSB4ZSAtIHllKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoYSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHllID0geGU7XHJcbiAgICAgICAgICAgICAgICB0ID0geWM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICBmb3IgKDsgYS0tOyB0LnB1c2goMCkpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFBvaW50IHhjIHRvIHRoZSBsb25nZXIgYXJyYXkuXHJcbiAgICAgICAgaWYgKHhjLmxlbmd0aCAtIHljLmxlbmd0aCA8IDApIHtcclxuICAgICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgICAgICB5YyA9IHhjO1xyXG4gICAgICAgICAgICB4YyA9IHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGEgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogT25seSBzdGFydCBhZGRpbmcgYXQgeWMubGVuZ3RoIC0gMSBhcyB0aGUgZnVydGhlciBkaWdpdHMgb2YgeGMgY2FuIGJlXHJcbiAgICAgICAgICogbGVmdCBhcyB0aGV5IGFyZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBmb3IgKGIgPSAwOyBhOykge1xyXG4gICAgICAgICAgICBiID0gKHhjWy0tYV0gPSB4Y1thXSArIHljW2FdICsgYikgLyAxMCB8IDA7XHJcbiAgICAgICAgICAgIHhjW2FdICU9IDEwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgemVybywgYXMgK3ggKyAreSAhPSAwICYmIC14ICsgLXkgIT0gMFxyXG5cclxuICAgICAgICBpZiAoYikge1xyXG4gICAgICAgICAgICB4Yy51bnNoaWZ0KGIpO1xyXG4gICAgICAgICAgICArK3llO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKGEgPSB4Yy5sZW5ndGg7IHhjWy0tYV0gPT09IDA7IHhjLnBvcCgpKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB5LmMgPSB4YztcclxuICAgICAgICB5LmUgPSB5ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyByYWlzZWQgdG8gdGhlIHBvd2VyIG4uXHJcbiAgICAgKiBJZiBuIGlzIG5lZ2F0aXZlLCByb3VuZCwgaWYgbmVjZXNzYXJ5LCB0byBhIG1heGltdW0gb2YgQmlnLkRQIGRlY2ltYWxcclxuICAgICAqIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIEJpZy5STS5cclxuICAgICAqXHJcbiAgICAgKiBuIHtudW1iZXJ9IEludGVnZXIsIC1NQVhfUE9XRVIgdG8gTUFYX1BPV0VSIGluY2x1c2l2ZS5cclxuICAgICAqL1xyXG4gICAgUC5wb3cgPSBmdW5jdGlvbiAobikge1xyXG4gICAgICAgIHZhciB4ID0gdGhpcyxcclxuICAgICAgICAgICAgb25lID0gbmV3IHguY29uc3RydWN0b3IoMSksXHJcbiAgICAgICAgICAgIHkgPSBvbmUsXHJcbiAgICAgICAgICAgIGlzTmVnID0gbiA8IDA7XHJcblxyXG4gICAgICAgIGlmIChuICE9PSB+fm4gfHwgbiA8IC1NQVhfUE9XRVIgfHwgbiA+IE1BWF9QT1dFUikge1xyXG4gICAgICAgICAgICB0aHJvd0VycignIXBvdyEnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG4gPSBpc05lZyA/IC1uIDogbjtcclxuXHJcbiAgICAgICAgZm9yICg7Oykge1xyXG5cclxuICAgICAgICAgICAgaWYgKG4gJiAxKSB7XHJcbiAgICAgICAgICAgICAgICB5ID0geS50aW1lcyh4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBuID4+PSAxO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFuKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB4ID0geC50aW1lcyh4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpc05lZyA/IG9uZS5kaXYoeSkgOiB5O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHJvdW5kZWQgdG8gYVxyXG4gICAgICogbWF4aW11bSBvZiBkcCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLlxyXG4gICAgICogSWYgZHAgaXMgbm90IHNwZWNpZmllZCwgcm91bmQgdG8gMCBkZWNpbWFsIHBsYWNlcy5cclxuICAgICAqIElmIHJtIGlzIG5vdCBzcGVjaWZpZWQsIHVzZSBCaWcuUk0uXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICAgKiBbcm1dIDAsIDEsIDIgb3IgMyAoUk9VTkRfRE9XTiwgUk9VTkRfSEFMRl9VUCwgUk9VTkRfSEFMRl9FVkVOLCBST1VORF9VUClcclxuICAgICAqL1xyXG4gICAgUC5yb3VuZCA9IGZ1bmN0aW9uIChkcCwgcm0pIHtcclxuICAgICAgICB2YXIgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIEJpZyA9IHguY29uc3RydWN0b3I7XHJcblxyXG4gICAgICAgIGlmIChkcCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGRwID0gMDtcclxuICAgICAgICB9IGVsc2UgaWYgKGRwICE9PSB+fmRwIHx8IGRwIDwgMCB8fCBkcCA+IE1BWF9EUCkge1xyXG4gICAgICAgICAgICB0aHJvd0VycignIXJvdW5kIScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBybmQoeCA9IG5ldyBCaWcoeCksIGRwLCBybSA9PSBudWxsID8gQmlnLlJNIDogcm0pO1xyXG5cclxuICAgICAgICByZXR1cm4geDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSBzcXVhcmUgcm9vdCBvZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcsXHJcbiAgICAgKiByb3VuZGVkLCBpZiBuZWNlc3NhcnksIHRvIGEgbWF4aW11bSBvZiBCaWcuRFAgZGVjaW1hbCBwbGFjZXMgdXNpbmdcclxuICAgICAqIHJvdW5kaW5nIG1vZGUgQmlnLlJNLlxyXG4gICAgICovXHJcbiAgICBQLnNxcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVzdGltYXRlLCByLCBhcHByb3gsXHJcbiAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgICAgaSA9IHgucyxcclxuICAgICAgICAgICAgZSA9IHguZSxcclxuICAgICAgICAgICAgaGFsZiA9IG5ldyBCaWcoJzAuNScpO1xyXG5cclxuICAgICAgICAvLyBaZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWcoeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBuZWdhdGl2ZSwgdGhyb3cgTmFOLlxyXG4gICAgICAgIGlmIChpIDwgMCkge1xyXG4gICAgICAgICAgICB0aHJvd0VycihOYU4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXN0aW1hdGUuXHJcbiAgICAgICAgaSA9IE1hdGguc3FydCh4LnRvU3RyaW5nKCkpO1xyXG5cclxuICAgICAgICAvLyBNYXRoLnNxcnQgdW5kZXJmbG93L292ZXJmbG93P1xyXG4gICAgICAgIC8vIFBhc3MgeCB0byBNYXRoLnNxcnQgYXMgaW50ZWdlciwgdGhlbiBhZGp1c3QgdGhlIHJlc3VsdCBleHBvbmVudC5cclxuICAgICAgICBpZiAoaSA9PT0gMCB8fCBpID09PSAxIC8gMCkge1xyXG4gICAgICAgICAgICBlc3RpbWF0ZSA9IHhjLmpvaW4oJycpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEoZXN0aW1hdGUubGVuZ3RoICsgZSAmIDEpKSB7XHJcbiAgICAgICAgICAgICAgICBlc3RpbWF0ZSArPSAnMCc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHIgPSBuZXcgQmlnKCBNYXRoLnNxcnQoZXN0aW1hdGUpLnRvU3RyaW5nKCkgKTtcclxuICAgICAgICAgICAgci5lID0gKChlICsgMSkgLyAyIHwgMCkgLSAoZSA8IDAgfHwgZSAmIDEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHIgPSBuZXcgQmlnKGkudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpID0gci5lICsgKEJpZy5EUCArPSA0KTtcclxuXHJcbiAgICAgICAgLy8gTmV3dG9uLVJhcGhzb24gaXRlcmF0aW9uLlxyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgYXBwcm94ID0gcjtcclxuICAgICAgICAgICAgciA9IGhhbGYudGltZXMoIGFwcHJveC5wbHVzKCB4LmRpdihhcHByb3gpICkgKTtcclxuICAgICAgICB9IHdoaWxlICggYXBwcm94LmMuc2xpY2UoMCwgaSkuam9pbignJykgIT09XHJcbiAgICAgICAgICAgICAgICAgICAgICAgci5jLnNsaWNlKDAsIGkpLmpvaW4oJycpICk7XHJcblxyXG4gICAgICAgIHJuZChyLCBCaWcuRFAgLT0gNCwgQmlnLlJNKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgdGltZXMgdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWcgeS5cclxuICAgICAqL1xyXG4gICAgUC5tdWwgPSBQLnRpbWVzID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICB2YXIgYyxcclxuICAgICAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICB5YyA9ICh5ID0gbmV3IEJpZyh5KSkuYyxcclxuICAgICAgICAgICAgYSA9IHhjLmxlbmd0aCxcclxuICAgICAgICAgICAgYiA9IHljLmxlbmd0aCxcclxuICAgICAgICAgICAgaSA9IHguZSxcclxuICAgICAgICAgICAgaiA9IHkuZTtcclxuXHJcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHNpZ24gb2YgcmVzdWx0LlxyXG4gICAgICAgIHkucyA9IHgucyA9PSB5LnMgPyAxIDogLTE7XHJcblxyXG4gICAgICAgIC8vIFJldHVybiBzaWduZWQgMCBpZiBlaXRoZXIgMC5cclxuICAgICAgICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJpZyh5LnMgKiAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEluaXRpYWxpc2UgZXhwb25lbnQgb2YgcmVzdWx0IGFzIHguZSArIHkuZS5cclxuICAgICAgICB5LmUgPSBpICsgajtcclxuXHJcbiAgICAgICAgLy8gSWYgYXJyYXkgeGMgaGFzIGZld2VyIGRpZ2l0cyB0aGFuIHljLCBzd2FwIHhjIGFuZCB5YywgYW5kIGxlbmd0aHMuXHJcbiAgICAgICAgaWYgKGEgPCBiKSB7XHJcbiAgICAgICAgICAgIGMgPSB4YztcclxuICAgICAgICAgICAgeGMgPSB5YztcclxuICAgICAgICAgICAgeWMgPSBjO1xyXG4gICAgICAgICAgICBqID0gYTtcclxuICAgICAgICAgICAgYSA9IGI7XHJcbiAgICAgICAgICAgIGIgPSBqO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSW5pdGlhbGlzZSBjb2VmZmljaWVudCBhcnJheSBvZiByZXN1bHQgd2l0aCB6ZXJvcy5cclxuICAgICAgICBmb3IgKGMgPSBuZXcgQXJyYXkoaiA9IGEgKyBiKTsgai0tOyBjW2pdID0gMCkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTXVsdGlwbHkuXHJcblxyXG4gICAgICAgIC8vIGkgaXMgaW5pdGlhbGx5IHhjLmxlbmd0aC5cclxuICAgICAgICBmb3IgKGkgPSBiOyBpLS07KSB7XHJcbiAgICAgICAgICAgIGIgPSAwO1xyXG5cclxuICAgICAgICAgICAgLy8gYSBpcyB5Yy5sZW5ndGguXHJcbiAgICAgICAgICAgIGZvciAoaiA9IGEgKyBpOyBqID4gaTspIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDdXJyZW50IHN1bSBvZiBwcm9kdWN0cyBhdCB0aGlzIGRpZ2l0IHBvc2l0aW9uLCBwbHVzIGNhcnJ5LlxyXG4gICAgICAgICAgICAgICAgYiA9IGNbal0gKyB5Y1tpXSAqIHhjW2ogLSBpIC0gMV0gKyBiO1xyXG4gICAgICAgICAgICAgICAgY1tqLS1dID0gYiAlIDEwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNhcnJ5XHJcbiAgICAgICAgICAgICAgICBiID0gYiAvIDEwIHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjW2pdID0gKGNbal0gKyBiKSAlIDEwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSW5jcmVtZW50IHJlc3VsdCBleHBvbmVudCBpZiB0aGVyZSBpcyBhIGZpbmFsIGNhcnJ5LlxyXG4gICAgICAgIGlmIChiKSB7XHJcbiAgICAgICAgICAgICsreS5lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIGFueSBsZWFkaW5nIHplcm8uXHJcbiAgICAgICAgaWYgKCFjWzBdKSB7XHJcbiAgICAgICAgICAgIGMuc2hpZnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKGkgPSBjLmxlbmd0aDsgIWNbLS1pXTsgYy5wb3AoKSkge1xyXG4gICAgICAgIH1cclxuICAgICAgICB5LmMgPSBjO1xyXG5cclxuICAgICAgICByZXR1cm4geTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZy5cclxuICAgICAqIFJldHVybiBleHBvbmVudGlhbCBub3RhdGlvbiBpZiB0aGlzIEJpZyBoYXMgYSBwb3NpdGl2ZSBleHBvbmVudCBlcXVhbCB0b1xyXG4gICAgICogb3IgZ3JlYXRlciB0aGFuIEJpZy5FX1BPUywgb3IgYSBuZWdhdGl2ZSBleHBvbmVudCBlcXVhbCB0byBvciBsZXNzIHRoYW5cclxuICAgICAqIEJpZy5FX05FRy5cclxuICAgICAqL1xyXG4gICAgUC50b1N0cmluZyA9IFAudmFsdWVPZiA9IFAudG9KU09OID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB4ID0gdGhpcyxcclxuICAgICAgICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgICAgICAgZSA9IHguZSxcclxuICAgICAgICAgICAgc3RyID0geC5jLmpvaW4oJycpLFxyXG4gICAgICAgICAgICBzdHJMID0gc3RyLmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnRpYWwgbm90YXRpb24/XHJcbiAgICAgICAgaWYgKGUgPD0gQmlnLkVfTkVHIHx8IGUgPj0gQmlnLkVfUE9TKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IHN0ci5jaGFyQXQoMCkgKyAoc3RyTCA+IDEgPyAnLicgKyBzdHIuc2xpY2UoMSkgOiAnJykgK1xyXG4gICAgICAgICAgICAgIChlIDwgMCA/ICdlJyA6ICdlKycpICsgZTtcclxuXHJcbiAgICAgICAgLy8gTmVnYXRpdmUgZXhwb25lbnQ/XHJcbiAgICAgICAgfSBlbHNlIGlmIChlIDwgMCkge1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcy5cclxuICAgICAgICAgICAgZm9yICg7ICsrZTsgc3RyID0gJzAnICsgc3RyKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RyID0gJzAuJyArIHN0cjtcclxuXHJcbiAgICAgICAgLy8gUG9zaXRpdmUgZXhwb25lbnQ/XHJcbiAgICAgICAgfSBlbHNlIGlmIChlID4gMCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCsrZSA+IHN0ckwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBcHBlbmQgemVyb3MuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGUgLT0gc3RyTDsgZS0tIDsgc3RyICs9ICcwJykge1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGUgPCBzdHJMKSB7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc2xpY2UoMCwgZSkgKyAnLicgKyBzdHIuc2xpY2UoZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnQgemVyby5cclxuICAgICAgICB9IGVsc2UgaWYgKHN0ckwgPiAxKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IHN0ci5jaGFyQXQoMCkgKyAnLicgKyBzdHIuc2xpY2UoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBdm9pZCAnLTAnXHJcbiAgICAgICAgcmV0dXJuIHgucyA8IDAgJiYgeC5jWzBdID8gJy0nICsgc3RyIDogc3RyO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAqIElmIHRvRXhwb25lbnRpYWwsIHRvRml4ZWQsIHRvUHJlY2lzaW9uIGFuZCBmb3JtYXQgYXJlIG5vdCByZXF1aXJlZCB0aGV5XHJcbiAgICAgKiBjYW4gc2FmZWx5IGJlIGNvbW1lbnRlZC1vdXQgb3IgZGVsZXRlZC4gTm8gcmVkdW5kYW50IGNvZGUgd2lsbCBiZSBsZWZ0LlxyXG4gICAgICogZm9ybWF0IGlzIHVzZWQgb25seSBieSB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkIGFuZCB0b1ByZWNpc2lvbi5cclxuICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAqL1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaW4gZXhwb25lbnRpYWxcclxuICAgICAqIG5vdGF0aW9uIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzIGFuZCByb3VuZGVkLCBpZiBuZWNlc3NhcnksIHVzaW5nXHJcbiAgICAgKiBCaWcuUk0uXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICAgKi9cclxuICAgIFAudG9FeHBvbmVudGlhbCA9IGZ1bmN0aW9uIChkcCkge1xyXG5cclxuICAgICAgICBpZiAoZHAgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBkcCA9IHRoaXMuYy5sZW5ndGggLSAxO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZHAgIT09IH5+ZHAgfHwgZHAgPCAwIHx8IGRwID4gTUFYX0RQKSB7XHJcbiAgICAgICAgICAgIHRocm93RXJyKCchdG9FeHAhJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZm9ybWF0KHRoaXMsIGRwLCAxKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpbiBub3JtYWwgbm90YXRpb25cclxuICAgICAqIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzIGFuZCByb3VuZGVkLCBpZiBuZWNlc3NhcnksIHVzaW5nIEJpZy5STS5cclxuICAgICAqXHJcbiAgICAgKiBbZHBdIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICAgICAqL1xyXG4gICAgUC50b0ZpeGVkID0gZnVuY3Rpb24gKGRwKSB7XHJcbiAgICAgICAgdmFyIHN0cixcclxuICAgICAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgICAgICAgIG5lZyA9IEJpZy5FX05FRyxcclxuICAgICAgICAgICAgcG9zID0gQmlnLkVfUE9TO1xyXG5cclxuICAgICAgICAvLyBQcmV2ZW50IHRoZSBwb3NzaWJpbGl0eSBvZiBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgICBCaWcuRV9ORUcgPSAtKEJpZy5FX1BPUyA9IDEgLyAwKTtcclxuXHJcbiAgICAgICAgaWYgKGRwID09IG51bGwpIHtcclxuICAgICAgICAgICAgc3RyID0geC50b1N0cmluZygpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZHAgPT09IH5+ZHAgJiYgZHAgPj0gMCAmJiBkcCA8PSBNQVhfRFApIHtcclxuICAgICAgICAgICAgc3RyID0gZm9ybWF0KHgsIHguZSArIGRwKTtcclxuXHJcbiAgICAgICAgICAgIC8vICgtMCkudG9GaXhlZCgpIGlzICcwJywgYnV0ICgtMC4xKS50b0ZpeGVkKCkgaXMgJy0wJy5cclxuICAgICAgICAgICAgLy8gKC0wKS50b0ZpeGVkKDEpIGlzICcwLjAnLCBidXQgKC0wLjAxKS50b0ZpeGVkKDEpIGlzICctMC4wJy5cclxuICAgICAgICAgICAgaWYgKHgucyA8IDAgJiYgeC5jWzBdICYmIHN0ci5pbmRleE9mKCctJykgPCAwKSB7XHJcbiAgICAgICAgLy9FLmcuIC0wLjUgaWYgcm91bmRlZCB0byAtMCB3aWxsIGNhdXNlIHRvU3RyaW5nIHRvIG9taXQgdGhlIG1pbnVzIHNpZ24uXHJcbiAgICAgICAgICAgICAgICBzdHIgPSAnLScgKyBzdHI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgQmlnLkVfTkVHID0gbmVnO1xyXG4gICAgICAgIEJpZy5FX1BPUyA9IHBvcztcclxuXHJcbiAgICAgICAgaWYgKCFzdHIpIHtcclxuICAgICAgICAgICAgdGhyb3dFcnIoJyF0b0ZpeCEnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgcm91bmRlZCB0byBzZFxyXG4gICAgICogc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nIEJpZy5STS4gVXNlIGV4cG9uZW50aWFsIG5vdGF0aW9uIGlmIHNkIGlzIGxlc3NcclxuICAgICAqIHRoYW4gdGhlIG51bWJlciBvZiBkaWdpdHMgbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlciBwYXJ0IG9mIHRoZVxyXG4gICAgICogdmFsdWUgaW4gbm9ybWFsIG5vdGF0aW9uLlxyXG4gICAgICpcclxuICAgICAqIHNkIHtudW1iZXJ9IEludGVnZXIsIDEgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICAgICAqL1xyXG4gICAgUC50b1ByZWNpc2lvbiA9IGZ1bmN0aW9uIChzZCkge1xyXG5cclxuICAgICAgICBpZiAoc2QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc2QgIT09IH5+c2QgfHwgc2QgPCAxIHx8IHNkID4gTUFYX0RQKSB7XHJcbiAgICAgICAgICAgIHRocm93RXJyKCchdG9QcmUhJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZm9ybWF0KHRoaXMsIHNkIC0gMSwgMik7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLyBFeHBvcnRcclxuXHJcblxyXG4gICAgQmlnID0gYmlnRmFjdG9yeSgpO1xyXG5cclxuICAgIC8vQU1ELlxyXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBCaWc7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gTm9kZSBhbmQgb3RoZXIgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLlxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gQmlnO1xyXG5cclxuICAgIC8vQnJvd3Nlci5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZ2xvYmFsLkJpZyA9IEJpZztcclxuICAgIH1cclxufSkodGhpcyk7XHJcbiIsInZhciBWTm9kZSA9IHJlcXVpcmUoJy4vdm5vZGUnKTtcbnZhciBpcyA9IHJlcXVpcmUoJy4vaXMnKTtcblxuZnVuY3Rpb24gYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCkge1xuICBkYXRhLm5zID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcblxuICBpZiAoc2VsICE9PSAnZm9yZWlnbk9iamVjdCcgJiYgY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgIGFkZE5TKGNoaWxkcmVuW2ldLmRhdGEsIGNoaWxkcmVuW2ldLmNoaWxkcmVuLCBjaGlsZHJlbltpXS5zZWwpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGgoc2VsLCBiLCBjKSB7XG4gIHZhciBkYXRhID0ge30sIGNoaWxkcmVuLCB0ZXh0LCBpO1xuICBpZiAoYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZGF0YSA9IGI7XG4gICAgaWYgKGlzLmFycmF5KGMpKSB7IGNoaWxkcmVuID0gYzsgfVxuICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZShjKSkgeyB0ZXh0ID0gYzsgfVxuICB9IGVsc2UgaWYgKGIgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChpcy5hcnJheShiKSkgeyBjaGlsZHJlbiA9IGI7IH1cbiAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUoYikpIHsgdGV4dCA9IGI7IH1cbiAgICBlbHNlIHsgZGF0YSA9IGI7IH1cbiAgfVxuICBpZiAoaXMuYXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAoaXMucHJpbWl0aXZlKGNoaWxkcmVuW2ldKSkgY2hpbGRyZW5baV0gPSBWTm9kZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjaGlsZHJlbltpXSk7XG4gICAgfVxuICB9XG4gIGlmIChzZWxbMF0gPT09ICdzJyAmJiBzZWxbMV0gPT09ICd2JyAmJiBzZWxbMl0gPT09ICdnJykge1xuICAgIGFkZE5TKGRhdGEsIGNoaWxkcmVuLCBzZWwpO1xuICB9XG4gIHJldHVybiBWTm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCB1bmRlZmluZWQpO1xufTtcbiIsImZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodGFnTmFtZSl7XG4gIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lKXtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2VVUkksIHF1YWxpZmllZE5hbWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh0ZXh0KXtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xufVxuXG5cbmZ1bmN0aW9uIGluc2VydEJlZm9yZShwYXJlbnROb2RlLCBuZXdOb2RlLCByZWZlcmVuY2VOb2RlKXtcbiAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobmV3Tm9kZSwgcmVmZXJlbmNlTm9kZSk7XG59XG5cblxuZnVuY3Rpb24gcmVtb3ZlQ2hpbGQobm9kZSwgY2hpbGQpe1xuICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kQ2hpbGQobm9kZSwgY2hpbGQpe1xuICBub2RlLmFwcGVuZENoaWxkKGNoaWxkKTtcbn1cblxuZnVuY3Rpb24gcGFyZW50Tm9kZShub2RlKXtcbiAgcmV0dXJuIG5vZGUucGFyZW50RWxlbWVudDtcbn1cblxuZnVuY3Rpb24gbmV4dFNpYmxpbmcobm9kZSl7XG4gIHJldHVybiBub2RlLm5leHRTaWJsaW5nO1xufVxuXG5mdW5jdGlvbiB0YWdOYW1lKG5vZGUpe1xuICByZXR1cm4gbm9kZS50YWdOYW1lO1xufVxuXG5mdW5jdGlvbiBzZXRUZXh0Q29udGVudChub2RlLCB0ZXh0KXtcbiAgbm9kZS50ZXh0Q29udGVudCA9IHRleHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGVFbGVtZW50OiBjcmVhdGVFbGVtZW50LFxuICBjcmVhdGVFbGVtZW50TlM6IGNyZWF0ZUVsZW1lbnROUyxcbiAgY3JlYXRlVGV4dE5vZGU6IGNyZWF0ZVRleHROb2RlLFxuICBhcHBlbmRDaGlsZDogYXBwZW5kQ2hpbGQsXG4gIHJlbW92ZUNoaWxkOiByZW1vdmVDaGlsZCxcbiAgaW5zZXJ0QmVmb3JlOiBpbnNlcnRCZWZvcmUsXG4gIHBhcmVudE5vZGU6IHBhcmVudE5vZGUsXG4gIG5leHRTaWJsaW5nOiBuZXh0U2libGluZyxcbiAgdGFnTmFtZTogdGFnTmFtZSxcbiAgc2V0VGV4dENvbnRlbnQ6IHNldFRleHRDb250ZW50XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFycmF5OiBBcnJheS5pc0FycmF5LFxuICBwcmltaXRpdmU6IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHR5cGVvZiBzID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgcyA9PT0gJ251bWJlcic7IH0sXG59O1xuIiwidmFyIE5hbWVzcGFjZVVSSXMgPSB7XG4gIFwieGxpbmtcIjogXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCJcbn07XG5cbnZhciBib29sZWFuQXR0cnMgPSBbXCJhbGxvd2Z1bGxzY3JlZW5cIiwgXCJhc3luY1wiLCBcImF1dG9mb2N1c1wiLCBcImF1dG9wbGF5XCIsIFwiY2hlY2tlZFwiLCBcImNvbXBhY3RcIiwgXCJjb250cm9sc1wiLCBcImRlY2xhcmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHRcIiwgXCJkZWZhdWx0Y2hlY2tlZFwiLCBcImRlZmF1bHRtdXRlZFwiLCBcImRlZmF1bHRzZWxlY3RlZFwiLCBcImRlZmVyXCIsIFwiZGlzYWJsZWRcIiwgXCJkcmFnZ2FibGVcIixcbiAgICAgICAgICAgICAgICBcImVuYWJsZWRcIiwgXCJmb3Jtbm92YWxpZGF0ZVwiLCBcImhpZGRlblwiLCBcImluZGV0ZXJtaW5hdGVcIiwgXCJpbmVydFwiLCBcImlzbWFwXCIsIFwiaXRlbXNjb3BlXCIsIFwibG9vcFwiLCBcIm11bHRpcGxlXCIsXG4gICAgICAgICAgICAgICAgXCJtdXRlZFwiLCBcIm5vaHJlZlwiLCBcIm5vcmVzaXplXCIsIFwibm9zaGFkZVwiLCBcIm5vdmFsaWRhdGVcIiwgXCJub3dyYXBcIiwgXCJvcGVuXCIsIFwicGF1c2VvbmV4aXRcIiwgXCJyZWFkb25seVwiLFxuICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIiwgXCJyZXZlcnNlZFwiLCBcInNjb3BlZFwiLCBcInNlYW1sZXNzXCIsIFwic2VsZWN0ZWRcIiwgXCJzb3J0YWJsZVwiLCBcInNwZWxsY2hlY2tcIiwgXCJ0cmFuc2xhdGVcIixcbiAgICAgICAgICAgICAgICBcInRydWVzcGVlZFwiLCBcInR5cGVtdXN0bWF0Y2hcIiwgXCJ2aXNpYmxlXCJdO1xuXG52YXIgYm9vbGVhbkF0dHJzRGljdCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5mb3IodmFyIGk9MCwgbGVuID0gYm9vbGVhbkF0dHJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gIGJvb2xlYW5BdHRyc0RpY3RbYm9vbGVhbkF0dHJzW2ldXSA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUF0dHJzKG9sZFZub2RlLCB2bm9kZSkge1xuICB2YXIga2V5LCBjdXIsIG9sZCwgZWxtID0gdm5vZGUuZWxtLFxuICAgICAgb2xkQXR0cnMgPSBvbGRWbm9kZS5kYXRhLmF0dHJzLCBhdHRycyA9IHZub2RlLmRhdGEuYXR0cnMsIG5hbWVzcGFjZVNwbGl0O1xuXG4gIGlmICghb2xkQXR0cnMgJiYgIWF0dHJzKSByZXR1cm47XG4gIG9sZEF0dHJzID0gb2xkQXR0cnMgfHwge307XG4gIGF0dHJzID0gYXR0cnMgfHwge307XG5cbiAgLy8gdXBkYXRlIG1vZGlmaWVkIGF0dHJpYnV0ZXMsIGFkZCBuZXcgYXR0cmlidXRlc1xuICBmb3IgKGtleSBpbiBhdHRycykge1xuICAgIGN1ciA9IGF0dHJzW2tleV07XG4gICAgb2xkID0gb2xkQXR0cnNba2V5XTtcbiAgICBpZiAob2xkICE9PSBjdXIpIHtcbiAgICAgIGlmKCFjdXIgJiYgYm9vbGVhbkF0dHJzRGljdFtrZXldKVxuICAgICAgICBlbG0ucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICBlbHNlIHtcbiAgICAgICAgbmFtZXNwYWNlU3BsaXQgPSBrZXkuc3BsaXQoXCI6XCIpO1xuICAgICAgICBpZihuYW1lc3BhY2VTcGxpdC5sZW5ndGggPiAxICYmIE5hbWVzcGFjZVVSSXMuaGFzT3duUHJvcGVydHkobmFtZXNwYWNlU3BsaXRbMF0pKVxuICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGVOUyhOYW1lc3BhY2VVUklzW25hbWVzcGFjZVNwbGl0WzBdXSwga2V5LCBjdXIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIGN1cik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vcmVtb3ZlIHJlbW92ZWQgYXR0cmlidXRlc1xuICAvLyB1c2UgYGluYCBvcGVyYXRvciBzaW5jZSB0aGUgcHJldmlvdXMgYGZvcmAgaXRlcmF0aW9uIHVzZXMgaXQgKC5pLmUuIGFkZCBldmVuIGF0dHJpYnV0ZXMgd2l0aCB1bmRlZmluZWQgdmFsdWUpXG4gIC8vIHRoZSBvdGhlciBvcHRpb24gaXMgdG8gcmVtb3ZlIGFsbCBhdHRyaWJ1dGVzIHdpdGggdmFsdWUgPT0gdW5kZWZpbmVkXG4gIGZvciAoa2V5IGluIG9sZEF0dHJzKSB7XG4gICAgaWYgKCEoa2V5IGluIGF0dHJzKSkge1xuICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtjcmVhdGU6IHVwZGF0ZUF0dHJzLCB1cGRhdGU6IHVwZGF0ZUF0dHJzfTtcbiIsImZ1bmN0aW9uIHVwZGF0ZUNsYXNzKG9sZFZub2RlLCB2bm9kZSkge1xuICB2YXIgY3VyLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sXG4gICAgICBvbGRDbGFzcyA9IG9sZFZub2RlLmRhdGEuY2xhc3MsXG4gICAgICBrbGFzcyA9IHZub2RlLmRhdGEuY2xhc3M7XG5cbiAgaWYgKCFvbGRDbGFzcyAmJiAha2xhc3MpIHJldHVybjtcbiAgb2xkQ2xhc3MgPSBvbGRDbGFzcyB8fCB7fTtcbiAga2xhc3MgPSBrbGFzcyB8fCB7fTtcblxuICBmb3IgKG5hbWUgaW4gb2xkQ2xhc3MpIHtcbiAgICBpZiAoIWtsYXNzW25hbWVdKSB7XG4gICAgICBlbG0uY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcbiAgICB9XG4gIH1cbiAgZm9yIChuYW1lIGluIGtsYXNzKSB7XG4gICAgY3VyID0ga2xhc3NbbmFtZV07XG4gICAgaWYgKGN1ciAhPT0gb2xkQ2xhc3NbbmFtZV0pIHtcbiAgICAgIGVsbS5jbGFzc0xpc3RbY3VyID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge2NyZWF0ZTogdXBkYXRlQ2xhc3MsIHVwZGF0ZTogdXBkYXRlQ2xhc3N9O1xuIiwiZnVuY3Rpb24gaW52b2tlSGFuZGxlcihoYW5kbGVyLCB2bm9kZSwgZXZlbnQpIHtcbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAvLyBjYWxsIGZ1bmN0aW9uIGhhbmRsZXJcbiAgICBoYW5kbGVyLmNhbGwodm5vZGUsIGV2ZW50LCB2bm9kZSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGhhbmRsZXIgPT09IFwib2JqZWN0XCIpIHtcbiAgICAvLyBjYWxsIGhhbmRsZXIgd2l0aCBhcmd1bWVudHNcbiAgICBpZiAodHlwZW9mIGhhbmRsZXJbMF0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgLy8gc3BlY2lhbCBjYXNlIGZvciBzaW5nbGUgYXJndW1lbnQgZm9yIHBlcmZvcm1hbmNlXG4gICAgICBpZiAoaGFuZGxlci5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgaGFuZGxlclswXS5jYWxsKHZub2RlLCBoYW5kbGVyWzFdLCBldmVudCwgdm5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBoYW5kbGVyLnNsaWNlKDEpO1xuICAgICAgICBhcmdzLnB1c2goZXZlbnQpO1xuICAgICAgICBhcmdzLnB1c2godm5vZGUpO1xuICAgICAgICBoYW5kbGVyWzBdLmFwcGx5KHZub2RlLCBhcmdzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY2FsbCBtdWx0aXBsZSBoYW5kbGVyc1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGludm9rZUhhbmRsZXIoaGFuZGxlcltpXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUV2ZW50KGV2ZW50LCB2bm9kZSkge1xuICB2YXIgbmFtZSA9IGV2ZW50LnR5cGUsXG4gICAgICBvbiA9IHZub2RlLmRhdGEub247XG5cbiAgLy8gY2FsbCBldmVudCBoYW5kbGVyKHMpIGlmIGV4aXN0c1xuICBpZiAob24gJiYgb25bbmFtZV0pIHtcbiAgICBpbnZva2VIYW5kbGVyKG9uW25hbWVdLCB2bm9kZSwgZXZlbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpc3RlbmVyKCkge1xuICByZXR1cm4gZnVuY3Rpb24gaGFuZGxlcihldmVudCkge1xuICAgIGhhbmRsZUV2ZW50KGV2ZW50LCBoYW5kbGVyLnZub2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVFdmVudExpc3RlbmVycyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgdmFyIG9sZE9uID0gb2xkVm5vZGUuZGF0YS5vbixcbiAgICAgIG9sZExpc3RlbmVyID0gb2xkVm5vZGUubGlzdGVuZXIsXG4gICAgICBvbGRFbG0gPSBvbGRWbm9kZS5lbG0sXG4gICAgICBvbiA9IHZub2RlICYmIHZub2RlLmRhdGEub24sXG4gICAgICBlbG0gPSB2bm9kZSAmJiB2bm9kZS5lbG0sXG4gICAgICBuYW1lO1xuXG4gIC8vIG9wdGltaXphdGlvbiBmb3IgcmV1c2VkIGltbXV0YWJsZSBoYW5kbGVyc1xuICBpZiAob2xkT24gPT09IG9uKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gcmVtb3ZlIGV4aXN0aW5nIGxpc3RlbmVycyB3aGljaCBubyBsb25nZXIgdXNlZFxuICBpZiAob2xkT24gJiYgb2xkTGlzdGVuZXIpIHtcbiAgICAvLyBpZiBlbGVtZW50IGNoYW5nZWQgb3IgZGVsZXRlZCB3ZSByZW1vdmUgYWxsIGV4aXN0aW5nIGxpc3RlbmVycyB1bmNvbmRpdGlvbmFsbHlcbiAgICBpZiAoIW9uKSB7XG4gICAgICBmb3IgKG5hbWUgaW4gb2xkT24pIHtcbiAgICAgICAgLy8gcmVtb3ZlIGxpc3RlbmVyIGlmIGVsZW1lbnQgd2FzIGNoYW5nZWQgb3IgZXhpc3RpbmcgbGlzdGVuZXJzIHJlbW92ZWRcbiAgICAgICAgb2xkRWxtLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgb2xkTGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChuYW1lIGluIG9sZE9uKSB7XG4gICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lciBpZiBleGlzdGluZyBsaXN0ZW5lciByZW1vdmVkXG4gICAgICAgIGlmICghb25bbmFtZV0pIHtcbiAgICAgICAgICBvbGRFbG0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBvbGRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gYWRkIG5ldyBsaXN0ZW5lcnMgd2hpY2ggaGFzIG5vdCBhbHJlYWR5IGF0dGFjaGVkXG4gIGlmIChvbikge1xuICAgIC8vIHJldXNlIGV4aXN0aW5nIGxpc3RlbmVyIG9yIGNyZWF0ZSBuZXdcbiAgICB2YXIgbGlzdGVuZXIgPSB2bm9kZS5saXN0ZW5lciA9IG9sZFZub2RlLmxpc3RlbmVyIHx8IGNyZWF0ZUxpc3RlbmVyKCk7XG4gICAgLy8gdXBkYXRlIHZub2RlIGZvciBsaXN0ZW5lclxuICAgIGxpc3RlbmVyLnZub2RlID0gdm5vZGU7XG5cbiAgICAvLyBpZiBlbGVtZW50IGNoYW5nZWQgb3IgYWRkZWQgd2UgYWRkIGFsbCBuZWVkZWQgbGlzdGVuZXJzIHVuY29uZGl0aW9uYWxseVxuICAgIGlmICghb2xkT24pIHtcbiAgICAgIGZvciAobmFtZSBpbiBvbikge1xuICAgICAgICAvLyBhZGQgbGlzdGVuZXIgaWYgZWxlbWVudCB3YXMgY2hhbmdlZCBvciBuZXcgbGlzdGVuZXJzIGFkZGVkXG4gICAgICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobmFtZSBpbiBvbikge1xuICAgICAgICAvLyBhZGQgbGlzdGVuZXIgaWYgbmV3IGxpc3RlbmVyIGFkZGVkXG4gICAgICAgIGlmICghb2xkT25bbmFtZV0pIHtcbiAgICAgICAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6IHVwZGF0ZUV2ZW50TGlzdGVuZXJzLFxuICB1cGRhdGU6IHVwZGF0ZUV2ZW50TGlzdGVuZXJzLFxuICBkZXN0cm95OiB1cGRhdGVFdmVudExpc3RlbmVyc1xufTtcbiIsImZ1bmN0aW9uIHVwZGF0ZVByb3BzKG9sZFZub2RlLCB2bm9kZSkge1xuICB2YXIga2V5LCBjdXIsIG9sZCwgZWxtID0gdm5vZGUuZWxtLFxuICAgICAgb2xkUHJvcHMgPSBvbGRWbm9kZS5kYXRhLnByb3BzLCBwcm9wcyA9IHZub2RlLmRhdGEucHJvcHM7XG5cbiAgaWYgKCFvbGRQcm9wcyAmJiAhcHJvcHMpIHJldHVybjtcbiAgb2xkUHJvcHMgPSBvbGRQcm9wcyB8fCB7fTtcbiAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcblxuICBmb3IgKGtleSBpbiBvbGRQcm9wcykge1xuICAgIGlmICghcHJvcHNba2V5XSkge1xuICAgICAgZGVsZXRlIGVsbVtrZXldO1xuICAgIH1cbiAgfVxuICBmb3IgKGtleSBpbiBwcm9wcykge1xuICAgIGN1ciA9IHByb3BzW2tleV07XG4gICAgb2xkID0gb2xkUHJvcHNba2V5XTtcbiAgICBpZiAob2xkICE9PSBjdXIgJiYgKGtleSAhPT0gJ3ZhbHVlJyB8fCBlbG1ba2V5XSAhPT0gY3VyKSkge1xuICAgICAgZWxtW2tleV0gPSBjdXI7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge2NyZWF0ZTogdXBkYXRlUHJvcHMsIHVwZGF0ZTogdXBkYXRlUHJvcHN9O1xuIiwidmFyIHJhZiA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB8fCBzZXRUaW1lb3V0O1xudmFyIG5leHRGcmFtZSA9IGZ1bmN0aW9uKGZuKSB7IHJhZihmdW5jdGlvbigpIHsgcmFmKGZuKTsgfSk7IH07XG5cbmZ1bmN0aW9uIHNldE5leHRGcmFtZShvYmosIHByb3AsIHZhbCkge1xuICBuZXh0RnJhbWUoZnVuY3Rpb24oKSB7IG9ialtwcm9wXSA9IHZhbDsgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxlKG9sZFZub2RlLCB2bm9kZSkge1xuICB2YXIgY3VyLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sXG4gICAgICBvbGRTdHlsZSA9IG9sZFZub2RlLmRhdGEuc3R5bGUsXG4gICAgICBzdHlsZSA9IHZub2RlLmRhdGEuc3R5bGU7XG5cbiAgaWYgKCFvbGRTdHlsZSAmJiAhc3R5bGUpIHJldHVybjtcbiAgb2xkU3R5bGUgPSBvbGRTdHlsZSB8fCB7fTtcbiAgc3R5bGUgPSBzdHlsZSB8fCB7fTtcbiAgdmFyIG9sZEhhc0RlbCA9ICdkZWxheWVkJyBpbiBvbGRTdHlsZTtcblxuICBmb3IgKG5hbWUgaW4gb2xkU3R5bGUpIHtcbiAgICBpZiAoIXN0eWxlW25hbWVdKSB7XG4gICAgICBlbG0uc3R5bGVbbmFtZV0gPSAnJztcbiAgICB9XG4gIH1cbiAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgY3VyID0gc3R5bGVbbmFtZV07XG4gICAgaWYgKG5hbWUgPT09ICdkZWxheWVkJykge1xuICAgICAgZm9yIChuYW1lIGluIHN0eWxlLmRlbGF5ZWQpIHtcbiAgICAgICAgY3VyID0gc3R5bGUuZGVsYXllZFtuYW1lXTtcbiAgICAgICAgaWYgKCFvbGRIYXNEZWwgfHwgY3VyICE9PSBvbGRTdHlsZS5kZWxheWVkW25hbWVdKSB7XG4gICAgICAgICAgc2V0TmV4dEZyYW1lKGVsbS5zdHlsZSwgbmFtZSwgY3VyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobmFtZSAhPT0gJ3JlbW92ZScgJiYgY3VyICE9PSBvbGRTdHlsZVtuYW1lXSkge1xuICAgICAgZWxtLnN0eWxlW25hbWVdID0gY3VyO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseURlc3Ryb3lTdHlsZSh2bm9kZSkge1xuICB2YXIgc3R5bGUsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gIGlmICghcyB8fCAhKHN0eWxlID0gcy5kZXN0cm95KSkgcmV0dXJuO1xuICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcbiAgICBlbG0uc3R5bGVbbmFtZV0gPSBzdHlsZVtuYW1lXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseVJlbW92ZVN0eWxlKHZub2RlLCBybSkge1xuICB2YXIgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gIGlmICghcyB8fCAhcy5yZW1vdmUpIHtcbiAgICBybSgpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBpZHgsIGkgPSAwLCBtYXhEdXIgPSAwLFxuICAgICAgY29tcFN0eWxlLCBzdHlsZSA9IHMucmVtb3ZlLCBhbW91bnQgPSAwLCBhcHBsaWVkID0gW107XG4gIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgIGFwcGxpZWQucHVzaChuYW1lKTtcbiAgICBlbG0uc3R5bGVbbmFtZV0gPSBzdHlsZVtuYW1lXTtcbiAgfVxuICBjb21wU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsbSk7XG4gIHZhciBwcm9wcyA9IGNvbXBTdHlsZVsndHJhbnNpdGlvbi1wcm9wZXJ0eSddLnNwbGl0KCcsICcpO1xuICBmb3IgKDsgaSA8IHByb3BzLmxlbmd0aDsgKytpKSB7XG4gICAgaWYoYXBwbGllZC5pbmRleE9mKHByb3BzW2ldKSAhPT0gLTEpIGFtb3VudCsrO1xuICB9XG4gIGVsbS5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgZnVuY3Rpb24oZXYpIHtcbiAgICBpZiAoZXYudGFyZ2V0ID09PSBlbG0pIC0tYW1vdW50O1xuICAgIGlmIChhbW91bnQgPT09IDApIHJtKCk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtjcmVhdGU6IHVwZGF0ZVN0eWxlLCB1cGRhdGU6IHVwZGF0ZVN0eWxlLCBkZXN0cm95OiBhcHBseURlc3Ryb3lTdHlsZSwgcmVtb3ZlOiBhcHBseVJlbW92ZVN0eWxlfTtcbiIsIi8vIGpzaGludCBuZXdjYXA6IGZhbHNlXG4vKiBnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBkb2N1bWVudCwgTm9kZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVk5vZGUgPSByZXF1aXJlKCcuL3Zub2RlJyk7XG52YXIgaXMgPSByZXF1aXJlKCcuL2lzJyk7XG52YXIgZG9tQXBpID0gcmVxdWlyZSgnLi9odG1sZG9tYXBpJyk7XG5cbmZ1bmN0aW9uIGlzVW5kZWYocykgeyByZXR1cm4gcyA9PT0gdW5kZWZpbmVkOyB9XG5mdW5jdGlvbiBpc0RlZihzKSB7IHJldHVybiBzICE9PSB1bmRlZmluZWQ7IH1cblxudmFyIGVtcHR5Tm9kZSA9IFZOb2RlKCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcblxuZnVuY3Rpb24gc2FtZVZub2RlKHZub2RlMSwgdm5vZGUyKSB7XG4gIHJldHVybiB2bm9kZTEua2V5ID09PSB2bm9kZTIua2V5ICYmIHZub2RlMS5zZWwgPT09IHZub2RlMi5zZWw7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUtleVRvT2xkSWR4KGNoaWxkcmVuLCBiZWdpbklkeCwgZW5kSWR4KSB7XG4gIHZhciBpLCBtYXAgPSB7fSwga2V5O1xuICBmb3IgKGkgPSBiZWdpbklkeDsgaSA8PSBlbmRJZHg7ICsraSkge1xuICAgIGtleSA9IGNoaWxkcmVuW2ldLmtleTtcbiAgICBpZiAoaXNEZWYoa2V5KSkgbWFwW2tleV0gPSBpO1xuICB9XG4gIHJldHVybiBtYXA7XG59XG5cbnZhciBob29rcyA9IFsnY3JlYXRlJywgJ3VwZGF0ZScsICdyZW1vdmUnLCAnZGVzdHJveScsICdwcmUnLCAncG9zdCddO1xuXG5mdW5jdGlvbiBpbml0KG1vZHVsZXMsIGFwaSkge1xuICB2YXIgaSwgaiwgY2JzID0ge307XG5cbiAgaWYgKGlzVW5kZWYoYXBpKSkgYXBpID0gZG9tQXBpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBob29rcy5sZW5ndGg7ICsraSkge1xuICAgIGNic1tob29rc1tpXV0gPSBbXTtcbiAgICBmb3IgKGogPSAwOyBqIDwgbW9kdWxlcy5sZW5ndGg7ICsraikge1xuICAgICAgaWYgKG1vZHVsZXNbal1baG9va3NbaV1dICE9PSB1bmRlZmluZWQpIGNic1tob29rc1tpXV0ucHVzaChtb2R1bGVzW2pdW2hvb2tzW2ldXSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZW1wdHlOb2RlQXQoZWxtKSB7XG4gICAgdmFyIGlkID0gZWxtLmlkID8gJyMnICsgZWxtLmlkIDogJyc7XG4gICAgdmFyIGMgPSBlbG0uY2xhc3NOYW1lID8gJy4nICsgZWxtLmNsYXNzTmFtZS5zcGxpdCgnICcpLmpvaW4oJy4nKSA6ICcnO1xuICAgIHJldHVybiBWTm9kZShhcGkudGFnTmFtZShlbG0pLnRvTG93ZXJDYXNlKCkgKyBpZCArIGMsIHt9LCBbXSwgdW5kZWZpbmVkLCBlbG0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlUm1DYihjaGlsZEVsbSwgbGlzdGVuZXJzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tbGlzdGVuZXJzID09PSAwKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBhcGkucGFyZW50Tm9kZShjaGlsZEVsbSk7XG4gICAgICAgIGFwaS5yZW1vdmVDaGlsZChwYXJlbnQsIGNoaWxkRWxtKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICB2YXIgaSwgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgaWYgKGlzRGVmKGRhdGEpKSB7XG4gICAgICBpZiAoaXNEZWYoaSA9IGRhdGEuaG9vaykgJiYgaXNEZWYoaSA9IGkuaW5pdCkpIHtcbiAgICAgICAgaSh2bm9kZSk7XG4gICAgICAgIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgZWxtLCBjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuLCBzZWwgPSB2bm9kZS5zZWw7XG4gICAgaWYgKGlzRGVmKHNlbCkpIHtcbiAgICAgIC8vIFBhcnNlIHNlbGVjdG9yXG4gICAgICB2YXIgaGFzaElkeCA9IHNlbC5pbmRleE9mKCcjJyk7XG4gICAgICB2YXIgZG90SWR4ID0gc2VsLmluZGV4T2YoJy4nLCBoYXNoSWR4KTtcbiAgICAgIHZhciBoYXNoID0gaGFzaElkeCA+IDAgPyBoYXNoSWR4IDogc2VsLmxlbmd0aDtcbiAgICAgIHZhciBkb3QgPSBkb3RJZHggPiAwID8gZG90SWR4IDogc2VsLmxlbmd0aDtcbiAgICAgIHZhciB0YWcgPSBoYXNoSWR4ICE9PSAtMSB8fCBkb3RJZHggIT09IC0xID8gc2VsLnNsaWNlKDAsIE1hdGgubWluKGhhc2gsIGRvdCkpIDogc2VsO1xuICAgICAgZWxtID0gdm5vZGUuZWxtID0gaXNEZWYoZGF0YSkgJiYgaXNEZWYoaSA9IGRhdGEubnMpID8gYXBpLmNyZWF0ZUVsZW1lbnROUyhpLCB0YWcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBhcGkuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgICAgaWYgKGhhc2ggPCBkb3QpIGVsbS5pZCA9IHNlbC5zbGljZShoYXNoICsgMSwgZG90KTtcbiAgICAgIGlmIChkb3RJZHggPiAwKSBlbG0uY2xhc3NOYW1lID0gc2VsLnNsaWNlKGRvdCArIDEpLnJlcGxhY2UoL1xcLi9nLCAnICcpO1xuICAgICAgaWYgKGlzLmFycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBjcmVhdGVFbG0oY2hpbGRyZW5baV0sIGluc2VydGVkVm5vZGVRdWV1ZSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzLnByaW1pdGl2ZSh2bm9kZS50ZXh0KSkge1xuICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCkpO1xuICAgICAgfVxuICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5jcmVhdGUubGVuZ3RoOyArK2kpIGNicy5jcmVhdGVbaV0oZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgICBpID0gdm5vZGUuZGF0YS5ob29rOyAvLyBSZXVzZSB2YXJpYWJsZVxuICAgICAgaWYgKGlzRGVmKGkpKSB7XG4gICAgICAgIGlmIChpLmNyZWF0ZSkgaS5jcmVhdGUoZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgICAgIGlmIChpLmluc2VydCkgaW5zZXJ0ZWRWbm9kZVF1ZXVlLnB1c2godm5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbG0gPSB2bm9kZS5lbG0gPSBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCk7XG4gICAgfVxuICAgIHJldHVybiB2bm9kZS5lbG07XG4gIH1cblxuICBmdW5jdGlvbiBhZGRWbm9kZXMocGFyZW50RWxtLCBiZWZvcmUsIHZub2Rlcywgc3RhcnRJZHgsIGVuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbSh2bm9kZXNbc3RhcnRJZHhdLCBpbnNlcnRlZFZub2RlUXVldWUpLCBiZWZvcmUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGludm9rZURlc3Ryb3lIb29rKHZub2RlKSB7XG4gICAgdmFyIGksIGosIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIGlmIChpc0RlZihkYXRhKSkge1xuICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmRlc3Ryb3kpKSBpKHZub2RlKTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMuZGVzdHJveS5sZW5ndGg7ICsraSkgY2JzLmRlc3Ryb3lbaV0odm5vZGUpO1xuICAgICAgaWYgKGlzRGVmKGkgPSB2bm9kZS5jaGlsZHJlbikpIHtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHZub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgaW52b2tlRGVzdHJveUhvb2sodm5vZGUuY2hpbGRyZW5bal0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4KSB7XG4gICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgdmFyIGksIGxpc3RlbmVycywgcm0sIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgIGlmIChpc0RlZihjaCkpIHtcbiAgICAgICAgaWYgKGlzRGVmKGNoLnNlbCkpIHtcbiAgICAgICAgICBpbnZva2VEZXN0cm95SG9vayhjaCk7XG4gICAgICAgICAgbGlzdGVuZXJzID0gY2JzLnJlbW92ZS5sZW5ndGggKyAxO1xuICAgICAgICAgIHJtID0gY3JlYXRlUm1DYihjaC5lbG0sIGxpc3RlbmVycyk7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5yZW1vdmUubGVuZ3RoOyArK2kpIGNicy5yZW1vdmVbaV0oY2gsIHJtKTtcbiAgICAgICAgICBpZiAoaXNEZWYoaSA9IGNoLmRhdGEpICYmIGlzRGVmKGkgPSBpLmhvb2spICYmIGlzRGVmKGkgPSBpLnJlbW92ZSkpIHtcbiAgICAgICAgICAgIGkoY2gsIHJtKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcm0oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7IC8vIFRleHQgbm9kZVxuICAgICAgICAgIGFwaS5yZW1vdmVDaGlsZChwYXJlbnRFbG0sIGNoLmVsbSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVDaGlsZHJlbihwYXJlbnRFbG0sIG9sZENoLCBuZXdDaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgdmFyIG9sZFN0YXJ0SWR4ID0gMCwgbmV3U3RhcnRJZHggPSAwO1xuICAgIHZhciBvbGRFbmRJZHggPSBvbGRDaC5sZW5ndGggLSAxO1xuICAgIHZhciBvbGRTdGFydFZub2RlID0gb2xkQ2hbMF07XG4gICAgdmFyIG9sZEVuZFZub2RlID0gb2xkQ2hbb2xkRW5kSWR4XTtcbiAgICB2YXIgbmV3RW5kSWR4ID0gbmV3Q2gubGVuZ3RoIC0gMTtcbiAgICB2YXIgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWzBdO1xuICAgIHZhciBuZXdFbmRWbm9kZSA9IG5ld0NoW25ld0VuZElkeF07XG4gICAgdmFyIG9sZEtleVRvSWR4LCBpZHhJbk9sZCwgZWxtVG9Nb3ZlLCBiZWZvcmU7XG5cbiAgICB3aGlsZSAob2xkU3RhcnRJZHggPD0gb2xkRW5kSWR4ICYmIG5ld1N0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgaWYgKGlzVW5kZWYob2xkU3RhcnRWbm9kZSkpIHtcbiAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdOyAvLyBWbm9kZSBoYXMgYmVlbiBtb3ZlZCBsZWZ0XG4gICAgICB9IGVsc2UgaWYgKGlzVW5kZWYob2xkRW5kVm5vZGUpKSB7XG4gICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgfSBlbHNlIGlmIChzYW1lVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3U3RhcnRWbm9kZSkpIHtcbiAgICAgICAgcGF0Y2hWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICBvbGRTdGFydFZub2RlID0gb2xkQ2hbKytvbGRTdGFydElkeF07XG4gICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgIH0gZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdFbmRWbm9kZSkpIHtcbiAgICAgICAgcGF0Y2hWbm9kZShvbGRFbmRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgIH0gZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlKSkgeyAvLyBWbm9kZSBtb3ZlZCByaWdodFxuICAgICAgICBwYXRjaFZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgb2xkU3RhcnRWbm9kZS5lbG0sIGFwaS5uZXh0U2libGluZyhvbGRFbmRWbm9kZS5lbG0pKTtcbiAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xuICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgIH0gZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlKSkgeyAvLyBWbm9kZSBtb3ZlZCBsZWZ0XG4gICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRFbmRWbm9kZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgb2xkRW5kVm5vZGUgPSBvbGRDaFstLW9sZEVuZElkeF07XG4gICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpc1VuZGVmKG9sZEtleVRvSWR4KSkgb2xkS2V5VG9JZHggPSBjcmVhdGVLZXlUb09sZElkeChvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7XG4gICAgICAgIGlkeEluT2xkID0gb2xkS2V5VG9JZHhbbmV3U3RhcnRWbm9kZS5rZXldO1xuICAgICAgICBpZiAoaXNVbmRlZihpZHhJbk9sZCkpIHsgLy8gTmV3IGVsZW1lbnRcbiAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSksIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxtVG9Nb3ZlID0gb2xkQ2hbaWR4SW5PbGRdO1xuICAgICAgICAgIHBhdGNoVm5vZGUoZWxtVG9Nb3ZlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgIG9sZENoW2lkeEluT2xkXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgZWxtVG9Nb3ZlLmVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAob2xkU3RhcnRJZHggPiBvbGRFbmRJZHgpIHtcbiAgICAgIGJlZm9yZSA9IGlzVW5kZWYobmV3Q2hbbmV3RW5kSWR4KzFdKSA/IG51bGwgOiBuZXdDaFtuZXdFbmRJZHgrMV0uZWxtO1xuICAgICAgYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCBuZXdDaCwgbmV3U3RhcnRJZHgsIG5ld0VuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICB9IGVsc2UgaWYgKG5ld1N0YXJ0SWR4ID4gbmV3RW5kSWR4KSB7XG4gICAgICByZW1vdmVWbm9kZXMocGFyZW50RWxtLCBvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGF0Y2hWbm9kZShvbGRWbm9kZSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgIHZhciBpLCBob29rO1xuICAgIGlmIChpc0RlZihpID0gdm5vZGUuZGF0YSkgJiYgaXNEZWYoaG9vayA9IGkuaG9vaykgJiYgaXNEZWYoaSA9IGhvb2sucHJlcGF0Y2gpKSB7XG4gICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgfVxuICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBvbGRWbm9kZS5lbG0sIG9sZENoID0gb2xkVm5vZGUuY2hpbGRyZW4sIGNoID0gdm5vZGUuY2hpbGRyZW47XG4gICAgaWYgKG9sZFZub2RlID09PSB2bm9kZSkgcmV0dXJuO1xuICAgIGlmICghc2FtZVZub2RlKG9sZFZub2RlLCB2bm9kZSkpIHtcbiAgICAgIHZhciBwYXJlbnRFbG0gPSBhcGkucGFyZW50Tm9kZShvbGRWbm9kZS5lbG0pO1xuICAgICAgZWxtID0gY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGVsbSwgb2xkVm5vZGUuZWxtKTtcbiAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIFtvbGRWbm9kZV0sIDAsIDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoaXNEZWYodm5vZGUuZGF0YSkpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMudXBkYXRlLmxlbmd0aDsgKytpKSBjYnMudXBkYXRlW2ldKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICBpID0gdm5vZGUuZGF0YS5ob29rO1xuICAgICAgaWYgKGlzRGVmKGkpICYmIGlzRGVmKGkgPSBpLnVwZGF0ZSkpIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICB9XG4gICAgaWYgKGlzVW5kZWYodm5vZGUudGV4dCkpIHtcbiAgICAgIGlmIChpc0RlZihvbGRDaCkgJiYgaXNEZWYoY2gpKSB7XG4gICAgICAgIGlmIChvbGRDaCAhPT0gY2gpIHVwZGF0ZUNoaWxkcmVuKGVsbSwgb2xkQ2gsIGNoLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgfSBlbHNlIGlmIChpc0RlZihjaCkpIHtcbiAgICAgICAgaWYgKGlzRGVmKG9sZFZub2RlLnRleHQpKSBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICAgIGFkZFZub2RlcyhlbG0sIG51bGwsIGNoLCAwLCBjaC5sZW5ndGggLSAxLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgfSBlbHNlIGlmIChpc0RlZihvbGRDaCkpIHtcbiAgICAgICAgcmVtb3ZlVm5vZGVzKGVsbSwgb2xkQ2gsIDAsIG9sZENoLmxlbmd0aCAtIDEpO1xuICAgICAgfSBlbHNlIGlmIChpc0RlZihvbGRWbm9kZS50ZXh0KSkge1xuICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvbGRWbm9kZS50ZXh0ICE9PSB2bm9kZS50ZXh0KSB7XG4gICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCB2bm9kZS50ZXh0KTtcbiAgICB9XG4gICAgaWYgKGlzRGVmKGhvb2spICYmIGlzRGVmKGkgPSBob29rLnBvc3RwYXRjaCkpIHtcbiAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24ob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGksIGVsbSwgcGFyZW50O1xuICAgIHZhciBpbnNlcnRlZFZub2RlUXVldWUgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnByZS5sZW5ndGg7ICsraSkgY2JzLnByZVtpXSgpO1xuXG4gICAgaWYgKGlzVW5kZWYob2xkVm5vZGUuc2VsKSkge1xuICAgICAgb2xkVm5vZGUgPSBlbXB0eU5vZGVBdChvbGRWbm9kZSk7XG4gICAgfVxuXG4gICAgaWYgKHNhbWVWbm9kZShvbGRWbm9kZSwgdm5vZGUpKSB7XG4gICAgICBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxtID0gb2xkVm5vZGUuZWxtO1xuICAgICAgcGFyZW50ID0gYXBpLnBhcmVudE5vZGUoZWxtKTtcblxuICAgICAgY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuXG4gICAgICBpZiAocGFyZW50ICE9PSBudWxsKSB7XG4gICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50LCB2bm9kZS5lbG0sIGFwaS5uZXh0U2libGluZyhlbG0pKTtcbiAgICAgICAgcmVtb3ZlVm5vZGVzKHBhcmVudCwgW29sZFZub2RlXSwgMCwgMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGluc2VydGVkVm5vZGVRdWV1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgaW5zZXJ0ZWRWbm9kZVF1ZXVlW2ldLmRhdGEuaG9vay5pbnNlcnQoaW5zZXJ0ZWRWbm9kZVF1ZXVlW2ldKTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGNicy5wb3N0Lmxlbmd0aDsgKytpKSBjYnMucG9zdFtpXSgpO1xuICAgIHJldHVybiB2bm9kZTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7aW5pdDogaW5pdH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIGVsbSkge1xuICB2YXIga2V5ID0gZGF0YSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogZGF0YS5rZXk7XG4gIHJldHVybiB7c2VsOiBzZWwsIGRhdGE6IGRhdGEsIGNoaWxkcmVuOiBjaGlsZHJlbixcbiAgICAgICAgICB0ZXh0OiB0ZXh0LCBlbG06IGVsbSwga2V5OiBrZXl9O1xufTtcbiIsImZ1bmN0aW9uIHVwZGF0ZVByb3BzKG9sZFZub2RlLCB2bm9kZSkge1xyXG4gICAgdmFyIGtleSwgY3VyLCBvbGQsIGVsbSA9IHZub2RlLmVsbSxcclxuICAgICAgICBwcm9wcyA9IHZub2RlLmRhdGEubGl2ZVByb3BzIHx8IHt9O1xyXG4gICAgZm9yIChrZXkgaW4gcHJvcHMpIHtcclxuICAgICAgICBjdXIgPSBwcm9wc1trZXldO1xyXG4gICAgICAgIG9sZCA9IGVsbVtrZXldO1xyXG4gICAgICAgIGlmIChvbGQgIT09IGN1cikgZWxtW2tleV0gPSBjdXI7XHJcbiAgICB9XHJcbn1cclxuY29uc3QgbGl2ZVByb3BzUGx1Z2luID0ge2NyZWF0ZTogdXBkYXRlUHJvcHMsIHVwZGF0ZTogdXBkYXRlUHJvcHN9O1xyXG5pbXBvcnQgc25hYmJkb20gZnJvbSBcInNuYWJiZG9tXCJcclxuaW1wb3J0IGggZnJvbSBcInNuYWJiZG9tL2hcIlxyXG5jb25zdCBwYXRjaCA9IHNuYWJiZG9tLmluaXQoW1xyXG4gICAgcmVxdWlyZSgnc25hYmJkb20vbW9kdWxlcy9jbGFzcycpLFxyXG4gICAgcmVxdWlyZSgnc25hYmJkb20vbW9kdWxlcy9wcm9wcycpLFxyXG4gICAgcmVxdWlyZSgnc25hYmJkb20vbW9kdWxlcy9zdHlsZScpLFxyXG4gICAgcmVxdWlyZSgnc25hYmJkb20vbW9kdWxlcy9ldmVudGxpc3RlbmVycycpLFxyXG4gICAgcmVxdWlyZSgnc25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzJyksXHJcbiAgICBsaXZlUHJvcHNQbHVnaW5cclxuXSk7XHJcblxyXG5mdW5jdGlvbiB1dWlkKCl7cmV0dXJuKFwiXCIrMWU3Ky0xZTMrLTRlMystOGUzKy0xZTExKS5yZXBsYWNlKC8xfDAvZyxmdW5jdGlvbigpe3JldHVybigwfE1hdGgucmFuZG9tKCkqMTYpLnRvU3RyaW5nKDE2KX0pfVxyXG5pbXBvcnQgYmlnIGZyb20gJ2JpZy5qcydcclxuYmlnLkVfUE9TID0gMWUrNlxyXG5cclxuaW1wb3J0IHVnbmlzIGZyb20gJy4vdWduaXMnXHJcblxyXG5pbXBvcnQgc2F2ZWRBcHAgZnJvbSAnLi4vdWduaXNfY29tcG9uZW50cy9hcHAuanNvbidcclxuXHJcbmVkaXRvcihzYXZlZEFwcClcclxuXHJcbmZ1bmN0aW9uIGVkaXRvcihhcHBEZWZpbml0aW9uKXtcclxuXHJcbiAgICAvL2FwcC52ZG9tLmVsbS5wYXJlbnROb2RlXHJcblxyXG4gICAgY29uc3QgYXBwID0gdWduaXMoYXBwRGVmaW5pdGlvbilcclxuXHJcbiAgICBsZXQgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpXHJcblxyXG4gICAgLy8gU3RhdGVcclxuICAgIGxldCBzdGF0ZSA9IHtcclxuICAgICAgICBsZWZ0T3BlbjogdHJ1ZSxcclxuICAgICAgICByaWdodE9wZW46IHRydWUsXHJcbiAgICAgICAgZWRpdG9yUmlnaHRXaWR0aDogMzUwLFxyXG4gICAgICAgIGVkaXRvckxlZnRXaWR0aDogMzUwLFxyXG4gICAgICAgIHN1YkVkaXRvcldpZHRoOiAzNTAsXHJcbiAgICAgICAgYXBwSXNGcm96ZW46IGZhbHNlLFxyXG4gICAgICAgIHNlbGVjdGVkVmlld05vZGU6IHt9LFxyXG4gICAgICAgIHNlbGVjdGVkRXZlbnRJZDogJycsXHJcbiAgICAgICAgc2VsZWN0ZWRQaXBlSWQ6ICcnLFxyXG4gICAgICAgIHNlbGVjdGVkU3RhdGVOb2RlSWQ6ICcnLFxyXG4gICAgICAgIHNlbGVjdGVkVmlld1N1Yk1lbnU6ICdwcm9wcycsXHJcbiAgICAgICAgZWRpdGluZ1RpdGxlTm9kZUlkOiAnJyxcclxuICAgICAgICBhY3RpdmVFdmVudDogJycsXHJcbiAgICAgICAgdmlld0ZvbGRlcnNDbG9zZWQ6IHt9LFxyXG4gICAgICAgIGRlZmluaXRpb246IGFwcC5kZWZpbml0aW9uLFxyXG4gICAgfVxyXG4gICAgLy8gdW5kby9yZWRvXHJcbiAgICBsZXQgc3RhdGVTdGFjayA9IFtzdGF0ZV1cclxuICAgIGZ1bmN0aW9uIHNldFN0YXRlKG5ld1N0YXRlLCBwdXNoVG9TdGFjayl7XHJcbiAgICAgICAgaWYobmV3U3RhdGUgPT09IHN0YXRlKXtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdzdGF0ZSB3YXMgbXV0YXRlZCwgc2VhcmNoIGZvciBhIGJ1ZycpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHNvbWUgYWN0aW9ucyBzaG91bGQgbm90IGJlIHJlY29yZGVkIGFuZCBjb250cm9sbGVkIHRocm91Z2ggdW5kby9yZWRvXHJcbiAgICAgICAgaWYocHVzaFRvU3RhY2spe1xyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50SW5kZXggPSBzdGF0ZVN0YWNrLmZpbmRJbmRleCgoYSk9PmE9PT1zdGF0ZSlcclxuICAgICAgICAgICAgc3RhdGVTdGFjayA9IHN0YXRlU3RhY2suc2xpY2UoMCwgY3VycmVudEluZGV4KzEpLmNvbmNhdChuZXdTdGF0ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gb3ZlcndyaXRlIGN1cnJlbnRcclxuICAgICAgICAgICAgc3RhdGVTdGFja1tzdGF0ZVN0YWNrLmZpbmRJbmRleCgoYSk9PmE9PT1zdGF0ZSldID0gbmV3U3RhdGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHN0YXRlLmFwcElzRnJvemVuICE9PSBuZXdTdGF0ZS5hcHBJc0Zyb3plbiB8fCBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlICE9PSBuZXdTdGF0ZS5zZWxlY3RlZFZpZXdOb2RlICl7XHJcbiAgICAgICAgICAgIGFwcC5fZnJlZXplKG5ld1N0YXRlLmFwcElzRnJvemVuLCBWSUVXX05PREVfU0VMRUNURUQsIG5ld1N0YXRlLnNlbGVjdGVkVmlld05vZGUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHN0YXRlLmRlZmluaXRpb24gIT09IG5ld1N0YXRlLmRlZmluaXRpb24pe1xyXG4gICAgICAgICAgICAvLyBUT0RPIGFkZCBnYXJiYWdlIGNvbGxlY3Rpb24/XHJcbiAgICAgICAgICAgIGFwcC5yZW5kZXIobmV3U3RhdGUuZGVmaW5pdGlvbilcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhdGUgPSBuZXdTdGF0ZVxyXG4gICAgICAgIHJlbmRlcigpXHJcbiAgICB9XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKT0+IHtcclxuICAgICAgICAvLyBjbGlja2VkIG91dHNpZGVcclxuICAgICAgICBpZihzdGF0ZS5lZGl0aW5nVGl0bGVOb2RlSWQgJiYgIWUudGFyZ2V0LmRhdGFzZXQuaXN0aXRsZWVkaXRvcil7XHJcbiAgICAgICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZWRpdGluZ1RpdGxlTm9kZUlkOiAnJ30pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSk9PntcclxuICAgICAgICAvLyA4MyAtIHNcclxuICAgICAgICAvLyA5MCAtIHpcclxuICAgICAgICAvLyA4OSAtIHlcclxuICAgICAgICAvLyAzMiAtIHNwYWNlXHJcbiAgICAgICAgLy8gMTMgLSBlbnRlclxyXG4gICAgICAgIGlmKGUud2hpY2ggPT0gODMgJiYgKG5hdmlnYXRvci5wbGF0Zm9ybS5tYXRjaChcIk1hY1wiKSA/IGUubWV0YUtleSA6IGUuY3RybEtleSkpIHtcclxuICAgICAgICAgICAgLy8gVE9ETyBnYXJiYWdlIGNvbGxlY3RcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBmZXRjaCgnL3NhdmUnLCB7bWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHN0YXRlLmRlZmluaXRpb24pLCBoZWFkZXJzOiB7XCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJ9fSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihlLndoaWNoID09IDMyICYmIChuYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goXCJNYWNcIikgPyBlLm1ldGFLZXkgOiBlLmN0cmxLZXkpKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICBGUkVFWkVSX0NMSUNLRUQoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZighZS5zaGlmdEtleSAmJiBlLndoaWNoID09IDkwICYmIChuYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goXCJNYWNcIikgPyBlLm1ldGFLZXkgOiBlLmN0cmxLZXkpKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gc3RhdGVTdGFjay5maW5kSW5kZXgoKGEpPT5hPT09c3RhdGUpXHJcbiAgICAgICAgICAgIGlmKGN1cnJlbnRJbmRleCA+IDApe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3U3RhdGUgPSBzdGF0ZVN0YWNrW2N1cnJlbnRJbmRleC0xXVxyXG4gICAgICAgICAgICAgICAgaWYoc3RhdGUuZGVmaW5pdGlvbiAhPT0gbmV3U3RhdGUuZGVmaW5pdGlvbil7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwLnJlbmRlcihuZXdTdGF0ZS5kZWZpbml0aW9uKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3RhdGUgPSBuZXdTdGF0ZVxyXG4gICAgICAgICAgICAgICAgcmVuZGVyKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZigoZS53aGljaCA9PSA4OSAmJiAobmF2aWdhdG9yLnBsYXRmb3JtLm1hdGNoKFwiTWFjXCIpID8gZS5tZXRhS2V5IDogZS5jdHJsS2V5KSkgfHwgKGUuc2hpZnRLZXkgJiYgZS53aGljaCA9PSA5MCAmJiAobmF2aWdhdG9yLnBsYXRmb3JtLm1hdGNoKFwiTWFjXCIpID8gZS5tZXRhS2V5IDogZS5jdHJsS2V5KSkpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50SW5kZXggPSBzdGF0ZVN0YWNrLmZpbmRJbmRleCgoYSk9PmE9PT1zdGF0ZSlcclxuICAgICAgICAgICAgaWYoY3VycmVudEluZGV4IDwgc3RhdGVTdGFjay5sZW5ndGgtMSl7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdTdGF0ZSA9IHN0YXRlU3RhY2tbY3VycmVudEluZGV4KzFdXHJcbiAgICAgICAgICAgICAgICBpZihzdGF0ZS5kZWZpbml0aW9uICE9PSBuZXdTdGF0ZS5kZWZpbml0aW9uKXtcclxuICAgICAgICAgICAgICAgICAgICBhcHAucmVuZGVyKG5ld1N0YXRlLmRlZmluaXRpb24pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IG5ld1N0YXRlXHJcbiAgICAgICAgICAgICAgICByZW5kZXIoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGUud2hpY2ggPT0gMTMpIHtcclxuICAgICAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBlZGl0aW5nVGl0bGVOb2RlSWQ6ICcnfSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vIEFjdGlvbnNcclxuICAgIGZ1bmN0aW9uIFdJRFRIX0RSQUdHRUQod2lkdGhOYW1lLCBlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgZnVuY3Rpb24gcmVzaXplKGUpe1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgbGV0IG5ld1dpZHRoID0gd2luZG93LmlubmVyV2lkdGggLSAoZS50b3VjaGVzPyBlLnRvdWNoZXNbMF0ucGFnZVg6IGUucGFnZVgpXHJcbiAgICAgICAgICAgIGlmKHdpZHRoTmFtZSA9PT0gJ2VkaXRvckxlZnRXaWR0aCcpe1xyXG4gICAgICAgICAgICAgICAgbmV3V2lkdGggPSBlLnRvdWNoZXM/IGUudG91Y2hlc1swXS5wYWdlWDogZS5wYWdlWFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHdpZHRoTmFtZSA9PT0gJ3N1YkVkaXRvcldpZHRoJyl7XHJcbiAgICAgICAgICAgICAgICBuZXdXaWR0aCA9IG5ld1dpZHRoIC0gc3RhdGUuZWRpdG9yUmlnaHRXaWR0aCAtIDEwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gSSBwcm9iYWJseSB3YXMgZHJ1bmtcclxuICAgICAgICAgICAgaWYod2lkdGhOYW1lICE9PSAnc3ViRWRpdG9yV2lkdGgnICYmICggKHdpZHRoTmFtZSA9PT0gJ2VkaXRvckxlZnRXaWR0aCcgPyBzdGF0ZS5sZWZ0T3Blbjogc3RhdGUucmlnaHRPcGVuKSA/IG5ld1dpZHRoIDwgMTgwOiBuZXdXaWR0aCA+IDE4MCkpe1xyXG4gICAgICAgICAgICAgICAgaWYod2lkdGhOYW1lID09PSAnZWRpdG9yTGVmdFdpZHRoJyl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHsuLi5zdGF0ZSwgbGVmdE9wZW46ICFzdGF0ZS5sZWZ0T3Blbn0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0U3RhdGUoey4uLnN0YXRlLCByaWdodE9wZW46ICFzdGF0ZS5yaWdodE9wZW59KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKG5ld1dpZHRoIDwgMjUwKXtcclxuICAgICAgICAgICAgICAgIG5ld1dpZHRoID0gMjUwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBbd2lkdGhOYW1lXTogbmV3V2lkdGh9KVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICB9XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHJlc2l6ZSlcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgcmVzaXplKVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0b3BEcmFnZ2luZyhlKXtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCByZXNpemUpXHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCByZXNpemUpXHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgc3RvcERyYWdnaW5nKVxyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBzdG9wRHJhZ2dpbmcpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHN0b3BEcmFnZ2luZylcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBzdG9wRHJhZ2dpbmcpXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBGUkVFWkVSX0NMSUNLRUQoKSB7XHJcbiAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBhcHBJc0Zyb3plbjogIXN0YXRlLmFwcElzRnJvemVufSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIFZJRVdfRk9MREVSX0NMSUNLRUQobm9kZUlkKSB7XHJcbiAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCB2aWV3Rm9sZGVyc0Nsb3NlZDp7Li4uc3RhdGUudmlld0ZvbGRlcnNDbG9zZWQsIFtub2RlSWRdOiAhc3RhdGUudmlld0ZvbGRlcnNDbG9zZWRbbm9kZUlkXX19KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gVklFV19OT0RFX1NFTEVDVEVEKHJlZikge1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgc2VsZWN0ZWRWaWV3Tm9kZTpyZWZ9KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gVU5TRUxFQ1RfVklFV19OT0RFKGUpIHtcclxuICAgICAgICBpZihlLnRhcmdldCA9PT0gdGhpcy5lbG0pe1xyXG4gICAgICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIHNlbGVjdGVkVmlld05vZGU6e319KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIFNUQVRFX05PREVfU0VMRUNURUQobm9kZUlkKSB7XHJcbiAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBzZWxlY3RlZFN0YXRlTm9kZUlkOm5vZGVJZH0pXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBVTlNFTEVDVF9TVEFURV9OT0RFKGUpIHtcclxuICAgICAgICBpZihlLnRhcmdldCA9PT0gdGhpcy5lbG0pe1xyXG4gICAgICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIHNlbGVjdGVkU3RhdGVOb2RlSWQ6JycsIHNlbGVjdGVkRXZlbnRJZDonJ30pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gREVMRVRFX1NFTEVDVEVEX1ZJRVcobm9kZVJlZiwgcGFyZW50UmVmLCBlKSB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxyXG4gICAgICAgIGlmKG5vZGVSZWYuaWQgPT09ICdfcm9vdE5vZGUnKXtcclxuICAgICAgICAgICAgLy8gaW1tdXRhYmx5IHJlbW92ZSBhbGwgbm9kZXMgZXhjZXB0IHJvb3ROb2RlXHJcbiAgICAgICAgICAgIHJldHVybiBzZXRTdGF0ZSh7Li4uc3RhdGUsIGRlZmluaXRpb246IHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICB2Tm9kZUJveDogeydfcm9vdE5vZGUnOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi52Tm9kZUJveFsnX3Jvb3ROb2RlJ10sIGNoaWxkcmVuOiBbXX19LFxyXG4gICAgICAgICAgICB9LCBzZWxlY3RlZFZpZXdOb2RlOiB7fX0sIHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBbcGFyZW50UmVmLnJlZl06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW3BhcmVudFJlZi5yZWZdLCBbcGFyZW50UmVmLmlkXTogey4uLnN0YXRlLmRlZmluaXRpb25bcGFyZW50UmVmLnJlZl1bcGFyZW50UmVmLmlkXSwgY2hpbGRyZW46c3RhdGUuZGVmaW5pdGlvbltwYXJlbnRSZWYucmVmXVtwYXJlbnRSZWYuaWRdLmNoaWxkcmVuLmZpbHRlcigocmVmKT0+cmVmLmlkICE9PSBub2RlUmVmLmlkKX19LFxyXG4gICAgICAgIH0sIHNlbGVjdGVkVmlld05vZGU6IHt9fSwgdHJ1ZSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIEFERF9OT0RFKG5vZGVSZWYsIHR5cGUpIHtcclxuICAgICAgICBjb25zdCBub2RlSWQgPSBub2RlUmVmLmlkXHJcbiAgICAgICAgY29uc3QgbmV3Tm9kZUlkID0gdXVpZCgpXHJcbiAgICAgICAgY29uc3QgbmV3U3R5bGVJZCA9IHV1aWQoKVxyXG4gICAgICAgIGNvbnN0IG5ld1N0eWxlID0ge1xyXG4gICAgICAgICAgICBwYWRkaW5nOiAnMTBweCcsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGUgPT09ICdib3gnKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld05vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2JveCcsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge3JlZjonc3R5bGUnLCBpZDpuZXdTdHlsZUlkfSxcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgLi4uc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFZpZXdOb2RlOiB7cmVmOid2Tm9kZUJveCcsIGlkOiBuZXdOb2RlSWR9LFxyXG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbjogbm9kZVJlZi5yZWYgPT09ICd2Tm9kZUJveCcgPyB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZOb2RlQm94OiB7Li4uc3RhdGUuZGVmaW5pdGlvbi52Tm9kZUJveCwgW25vZGVJZF06IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnZOb2RlQm94W25vZGVJZF0sIGNoaWxkcmVuOiBzdGF0ZS5kZWZpbml0aW9uLnZOb2RlQm94W25vZGVJZF0uY2hpbGRyZW4uY29uY2F0KHtyZWY6J3ZOb2RlQm94JywgaWQ6bmV3Tm9kZUlkfSl9LCBbbmV3Tm9kZUlkXTogbmV3Tm9kZX0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZSwgW25ld1N0eWxlSWRdOiBuZXdTdHlsZX0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSA6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgW25vZGVSZWYucmVmXTogey4uLnN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdLCBbbm9kZUlkXTogey4uLnN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdW25vZGVJZF0sIGNoaWxkcmVuOiBzdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXVtub2RlSWRdLmNoaWxkcmVuLmNvbmNhdCh7cmVmOid2Tm9kZUJveCcsIGlkOm5ld05vZGVJZH0pfX0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZOb2RlQm94OiB7Li4uc3RhdGUuZGVmaW5pdGlvbi52Tm9kZUJveCwgW25ld05vZGVJZF06IG5ld05vZGV9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogey4uLnN0YXRlLmRlZmluaXRpb24uc3R5bGUsIFtuZXdTdHlsZUlkXTogbmV3U3R5bGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgdHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ3RleHQnKXtcclxuICAgICAgICAgICAgY29uc3QgcGlwZUlkID0gdXVpZCgpXHJcbiAgICAgICAgICAgIGNvbnN0IG5ld05vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtyZWY6J3N0eWxlJywgaWQ6bmV3U3R5bGVJZH0sXHJcbiAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjoncGlwZScsIGlkOnBpcGVJZH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdQaXBlID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdEZWZhdWx0IFRleHQnLFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBbXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkVmlld05vZGU6IHtyZWY6J3ZOb2RlVGV4dCcsIGlkOiBuZXdOb2RlSWR9LFxyXG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgcGlwZTogey4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSwgW3BpcGVJZF06IG5ld1BpcGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIFtub2RlUmVmLnJlZl06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXSwgW25vZGVJZF06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXVtub2RlSWRdLCBjaGlsZHJlbjogc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZUlkXS5jaGlsZHJlbi5jb25jYXQoe3JlZjondk5vZGVUZXh0JywgaWQ6bmV3Tm9kZUlkfSl9fSxcclxuICAgICAgICAgICAgICAgICAgICB2Tm9kZVRleHQ6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnZOb2RlVGV4dCwgW25ld05vZGVJZF06IG5ld05vZGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZSwgW25ld1N0eWxlSWRdOiBuZXdTdHlsZX0sXHJcbiAgICAgICAgICAgICAgICB9fSwgdHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ2lucHV0Jykge1xyXG4gICAgICAgICAgICBjb25zdCBzdGF0ZUlkID0gdXVpZCgpXHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50SWQgPSB1dWlkKClcclxuICAgICAgICAgICAgY29uc3QgbXV0YXRvcklkID0gdXVpZCgpXHJcbiAgICAgICAgICAgIGNvbnN0IHBpcGVJbnB1dElkID0gdXVpZCgpXHJcbiAgICAgICAgICAgIGNvbnN0IHBpcGVNdXRhdG9ySWQgPSB1dWlkKClcclxuICAgICAgICAgICAgY29uc3QgbmV3Tm9kZSA9IHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaW5wdXQnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtyZWY6J3N0eWxlJywgaWQ6bmV3U3R5bGVJZH0sXHJcbiAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjoncGlwZScsIGlkOnBpcGVJbnB1dElkfSxcclxuICAgICAgICAgICAgICAgIGlucHV0OiB7cmVmOidldmVudCcsIGlkOmV2ZW50SWR9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbmV3UGlwZUlucHV0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHtyZWY6ICdzdGF0ZScsIGlkOiBzdGF0ZUlkfSxcclxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogW11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdQaXBlTXV0YXRvciA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiB7cmVmOiAnZXZlbnREYXRhJywgaWQ6ICdfaW5wdXQnfSxcclxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogW11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdTdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnaW5wdXQgdmFsdWUnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgcmVmOiBzdGF0ZUlkLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiAnRGVmYXVsdCB0ZXh0JyxcclxuICAgICAgICAgICAgICAgIG11dGF0b3JzOiBbeyByZWY6J211dGF0b3InLCBpZDptdXRhdG9ySWR9XSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdNdXRhdG9yID0ge1xyXG4gICAgICAgICAgICAgICAgZXZlbnQ6IHsgcmVmOiAnZXZlbnQnLCBpZDpldmVudElkfSxcclxuICAgICAgICAgICAgICAgIHN0YXRlOiB7IHJlZjogJ3N0YXRlJywgaWQ6c3RhdGVJZH0sXHJcbiAgICAgICAgICAgICAgICBtdXRhdGlvbjogeyByZWY6ICdwaXBlJywgaWQ6IHBpcGVNdXRhdG9ySWR9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld0V2ZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICd1cGRhdGUgaW5wdXQnLFxyXG4gICAgICAgICAgICAgICAgbXV0YXRvcnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IHJlZjogJ211dGF0b3InLCBpZDogbXV0YXRvcklkfSxcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge3JlZjogJ2V2ZW50RGF0YScsIGlkOiAnX2lucHV0J31cclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRWaWV3Tm9kZToge3JlZjondk5vZGVJbnB1dCcsIGlkOiBuZXdOb2RlSWR9LFxyXG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgcGlwZTogey4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSwgW3BpcGVJbnB1dElkXTogbmV3UGlwZUlucHV0LCBbcGlwZU11dGF0b3JJZF06IG5ld1BpcGVNdXRhdG9yfSxcclxuICAgICAgICAgICAgICAgICAgICBbbm9kZVJlZi5yZWZdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl0sIFtub2RlSWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZUlkXSwgY2hpbGRyZW46IHN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdW25vZGVJZF0uY2hpbGRyZW4uY29uY2F0KHtyZWY6J3ZOb2RlSW5wdXQnLCBpZDpuZXdOb2RlSWR9KX19LFxyXG4gICAgICAgICAgICAgICAgICAgIHZOb2RlSW5wdXQ6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnZOb2RlSW5wdXQsIFtuZXdOb2RlSWRdOiBuZXdOb2RlfSxcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZTogey4uLnN0YXRlLmRlZmluaXRpb24uc3R5bGUsIFtuZXdTdHlsZUlkXTogbmV3U3R5bGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWVTcGFjZTogey4uLnN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlLCBbJ19yb290TmFtZVNwYWNlJ106IHsuLi5zdGF0ZS5kZWZpbml0aW9uLm5hbWVTcGFjZVsnX3Jvb3ROYW1lU3BhY2UnXSwgY2hpbGRyZW46IHN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlWydfcm9vdE5hbWVTcGFjZSddLmNoaWxkcmVuLmNvbmNhdCh7cmVmOidzdGF0ZScsIGlkOnN0YXRlSWR9KX19LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZSwgW3N0YXRlSWRdOiBuZXdTdGF0ZX0sXHJcbiAgICAgICAgICAgICAgICAgICAgbXV0YXRvcjogey4uLnN0YXRlLmRlZmluaXRpb24ubXV0YXRvciwgW211dGF0b3JJZF06IG5ld011dGF0b3J9LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50OiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5ldmVudCwgW2V2ZW50SWRdOiBuZXdFdmVudH0sXHJcbiAgICAgICAgICAgICAgICB9fSwgdHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBBRERfU1RBVEUobmFtZXNwYWNlSWQsIHR5cGUpIHtcclxuICAgICAgICBjb25zdCBuZXdTdGF0ZUlkID0gdXVpZCgpXHJcbiAgICAgICAgbGV0IG5ld1N0YXRlXHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ3RleHQnKSB7XHJcbiAgICAgICAgICAgIG5ld1N0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICduZXcgdGV4dCcsXHJcbiAgICAgICAgICAgICAgICByZWY6IG5ld1N0YXRlSWQsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6ICdEZWZhdWx0IHRleHQnLFxyXG4gICAgICAgICAgICAgICAgbXV0YXRvcnM6IFtdLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGUgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIG5ld1N0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICduZXcgbnVtYmVyJyxcclxuICAgICAgICAgICAgICAgIHJlZjogbmV3U3RhdGVJZCxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiAwLFxyXG4gICAgICAgICAgICAgICAgbXV0YXRvcnM6IFtdLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGUgPT09ICdib29sZWFuJykge1xyXG4gICAgICAgICAgICBuZXdTdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnbmV3IGJvb2xlYW4nLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICAgICAgcmVmOiBuZXdTdGF0ZUlkLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgbXV0YXRvcnM6IFtdLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGUgPT09ICd0YWJsZScpIHtcclxuICAgICAgICAgICAgbmV3U3RhdGUgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ25ldyB0YWJsZScsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAndGFibGUnLFxyXG4gICAgICAgICAgICAgICAgcmVmOiBuZXdTdGF0ZUlkLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiB7fSxcclxuICAgICAgICAgICAgICAgIG11dGF0b3JzOiBbXSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0eXBlID09PSAnbmFtZXNwYWNlJykge1xyXG4gICAgICAgICAgICBuZXdTdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnbmV3IG5hbWVzcGFjZScsXHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgICAgIG5hbWVTcGFjZTogey4uLnN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlLCBbbmFtZXNwYWNlSWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5uYW1lU3BhY2VbbmFtZXNwYWNlSWRdLCBjaGlsZHJlbjogc3RhdGUuZGVmaW5pdGlvbi5uYW1lU3BhY2VbbmFtZXNwYWNlSWRdLmNoaWxkcmVuLmNvbmNhdCh7cmVmOiduYW1lU3BhY2UnLCBpZDpuZXdTdGF0ZUlkfSl9LCBbbmV3U3RhdGVJZF06IG5ld1N0YXRlfSxcclxuICAgICAgICAgICAgfX0sIHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBuYW1lU3BhY2U6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLm5hbWVTcGFjZSwgW25hbWVzcGFjZUlkXTogey4uLnN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlW25hbWVzcGFjZUlkXSwgY2hpbGRyZW46IHN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlW25hbWVzcGFjZUlkXS5jaGlsZHJlbi5jb25jYXQoe3JlZjonc3RhdGUnLCBpZDpuZXdTdGF0ZUlkfSl9fSxcclxuICAgICAgICAgICAgc3RhdGU6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnN0YXRlLCBbbmV3U3RhdGVJZF06IG5ld1N0YXRlfSxcclxuICAgICAgICB9fSwgdHJ1ZSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIENIQU5HRV9TVFlMRShzdHlsZUlkLCBrZXksIGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAvLyBhbmQgbm93IEkgcmVhbGx5IHJlZ3JldCBub3QgdXNpbmcgaW1tdXRhYmxlIG9yIHJhbWRhIGxlbnNlc1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjogey4uLnN0YXRlLmRlZmluaXRpb24sIHN0eWxlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZSwgW3N0eWxlSWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZVtzdHlsZUlkXSwgW2tleV06IGUudGFyZ2V0LnZhbHVlfX19fSwgdHJ1ZSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIEFERF9ERUZBVUxUX1NUWUxFKHN0eWxlSWQsIGtleSkge1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjogey4uLnN0YXRlLmRlZmluaXRpb24sIHN0eWxlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZSwgW3N0eWxlSWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZVtzdHlsZUlkXSwgW2tleV06ICdkZWZhdWx0J319fX0sIHRydWUpXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBTRUxFQ1RfVklFV19TVUJNRU5VKG5ld0lkKSB7XHJcbiAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBzZWxlY3RlZFZpZXdTdWJNZW51Om5ld0lkfSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIEVESVRfVklFV19OT0RFX1RJVExFKG5vZGVJZCkge1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZWRpdGluZ1RpdGxlTm9kZUlkOm5vZGVJZH0pXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBFRElUX0VWRU5UX1RJVExFKG5vZGVJZCkge1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZWRpdGluZ1RpdGxlTm9kZUlkOm5vZGVJZH0pXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBDSEFOR0VfRVZFTlRfVElUTEUobm9kZUlkLCBlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBldmVudDoge1xyXG4gICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5ldmVudCxcclxuICAgICAgICAgICAgICAgIFtub2RlSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5ldmVudFtub2RlSWRdLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH19LCB0cnVlKVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gQ0hBTkdFX1ZJRVdfTk9ERV9USVRMRShub2RlUmVmLCBlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IG5vZGVJZCA9IG5vZGVSZWYuaWRcclxuICAgICAgICBjb25zdCBub2RlVHlwZSA9IG5vZGVSZWYucmVmXHJcbiAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBkZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgIFtub2RlVHlwZV06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW25vZGVUeXBlXSwgW25vZGVJZF06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW25vZGVUeXBlXVtub2RlSWRdLCB0aXRsZTogZS50YXJnZXQudmFsdWV9fSxcclxuICAgICAgICB9fSwgdHJ1ZSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIENIQU5HRV9TVEFURV9OT0RFX1RJVExFKG5vZGVJZCwgZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGRlZmluaXRpb246IHtcclxuICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgc3RhdGU6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnN0YXRlLCBbbm9kZUlkXTogey4uLnN0YXRlLmRlZmluaXRpb24uc3RhdGVbbm9kZUlkXSwgdGl0bGU6IGUudGFyZ2V0LnZhbHVlfX0sXHJcbiAgICAgICAgfX0sIHRydWUpXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBDSEFOR0VfTkFNRVNQQUNFX1RJVExFKG5vZGVJZCwgZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGRlZmluaXRpb246IHtcclxuICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgbmFtZVNwYWNlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5uYW1lU3BhY2UsIFtub2RlSWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5uYW1lU3BhY2Vbbm9kZUlkXSwgdGl0bGU6IGUudGFyZ2V0LnZhbHVlfX0sXHJcbiAgICAgICAgfX0sIHRydWUpXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBDSEFOR0VfQ1VSUkVOVF9TVEFURV9URVhUX1ZBTFVFKHN0YXRlSWQsIGUpIHtcclxuICAgICAgICBhcHAuc2V0Q3VycmVudFN0YXRlKHsuLi5hcHAuZ2V0Q3VycmVudFN0YXRlKCksIFtzdGF0ZUlkXTogZS50YXJnZXQudmFsdWV9KVxyXG4gICAgICAgIHJlbmRlcigpXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBDSEFOR0VfQ1VSUkVOVF9TVEFURV9OVU1CRVJfVkFMVUUoc3RhdGVJZCwgZSkge1xyXG4gICAgICAgIC8vIHRvZG8gYmlnIHRocm93cyBlcnJvciBpbnN0ZWFkIG9mIHJldHVybmluZyBOYU4uLi4gZml4LCByZXdyaXRlIG9yIGhhY2tcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZihiaWcoZS50YXJnZXQudmFsdWUpLnRvU3RyaW5nKCkgIT09IGFwcC5nZXRDdXJyZW50U3RhdGUoKVtzdGF0ZUlkXS50b1N0cmluZygpKXtcclxuICAgICAgICAgICAgICAgIGFwcC5zZXRDdXJyZW50U3RhdGUoey4uLmFwcC5nZXRDdXJyZW50U3RhdGUoKSwgW3N0YXRlSWRdOiBiaWcoZS50YXJnZXQudmFsdWUpfSlcclxuICAgICAgICAgICAgICAgIHJlbmRlcigpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoKGVycikge1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIElOQ1JFTUVOVF9DVVJSRU5UX1NUQVRFX05VTUJFUl9WQUxVRShzdGF0ZUlkKSB7XHJcbiAgICAgICAgYXBwLnNldEN1cnJlbnRTdGF0ZSh7Li4uYXBwLmdldEN1cnJlbnRTdGF0ZSgpLCBbc3RhdGVJZF06IGJpZyhhcHAuZ2V0Q3VycmVudFN0YXRlKClbc3RhdGVJZF0pLmFkZCgxKX0pXHJcbiAgICAgICAgcmVuZGVyKClcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIERFQ1JFTUVOVF9DVVJSRU5UX1NUQVRFX05VTUJFUl9WQUxVRShzdGF0ZUlkKSB7XHJcbiAgICAgICAgYXBwLnNldEN1cnJlbnRTdGF0ZSh7Li4uYXBwLmdldEN1cnJlbnRTdGF0ZSgpLCBbc3RhdGVJZF06IGJpZyhhcHAuZ2V0Q3VycmVudFN0YXRlKClbc3RhdGVJZF0pLmFkZCgtMSl9KVxyXG4gICAgICAgIHJlbmRlcigpXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBTRUxFQ1RfRVZFTlQoZXZlbnRJZCkge1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgc2VsZWN0ZWRFdmVudElkOmV2ZW50SWR9KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gQ0hBTkdFX1NUQVRJQ19WQUxVRShyZWYsIHByb3BlcnR5TmFtZSwgdHlwZSwgZSkge1xyXG4gICAgICAgIGxldCB2YWx1ZSA9IGUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ251bWJlcicpe1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBiaWcoZS50YXJnZXQudmFsdWUpXHJcbiAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBkZWZpbml0aW9uOntcclxuICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgW3JlZi5yZWZdOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uW3JlZi5yZWZdLFxyXG4gICAgICAgICAgICAgICAgW3JlZi5pZF06IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgW3Byb3BlcnR5TmFtZV06IHZhbHVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9fSwgdHJ1ZSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIEFERF9FVkVOVChwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICBjb25zdCByZWYgPSBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlXHJcbiAgICAgICAgY29uc3QgZXZlbnRJZCA9IHV1aWQoKTtcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGRlZmluaXRpb246e1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBbcmVmLnJlZl06IHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb25bcmVmLnJlZl0sXHJcbiAgICAgICAgICAgICAgICBbcmVmLmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb25bcmVmLnJlZl1bcmVmLmlkXSxcclxuICAgICAgICAgICAgICAgICAgICBbcHJvcGVydHlOYW1lXToge3JlZjogJ2V2ZW50JywgaWQ6IGV2ZW50SWR9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGV2ZW50OiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLmV2ZW50LFxyXG4gICAgICAgICAgICAgICAgW2V2ZW50SWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdPbiAnICsgcHJvcGVydHlOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG11dGF0b3JzOiBbXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfX0sIHRydWUpXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBBRERfTVVUQVRPUihzdGF0ZUlkLCBldmVudElkKSB7XHJcbiAgICAgICAgY29uc3QgbXV0YXRvcklkID0gdXVpZCgpO1xyXG4gICAgICAgIGNvbnN0IHBpcGVJZCA9IHV1aWQoKTtcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGRlZmluaXRpb246e1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBwaXBlOntcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSxcclxuICAgICAgICAgICAgICAgIFtwaXBlSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZVtzdGF0ZUlkXS50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBzdGF0ZS5kZWZpbml0aW9uLnN0YXRlW3N0YXRlSWRdLmRlZmF1bHRWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IFtdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0YXRlOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgW3N0YXRlSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZVtzdGF0ZUlkXSxcclxuICAgICAgICAgICAgICAgICAgICBtdXRhdG9yczogc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZVtzdGF0ZUlkXS5tdXRhdG9ycy5jb25jYXQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWY6ICdtdXRhdG9yJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IG11dGF0b3JJZFxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG11dGF0b3I6IHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ubXV0YXRvcixcclxuICAgICAgICAgICAgICAgIFttdXRhdG9ySWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmOiBcImV2ZW50XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBldmVudElkXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWY6IFwic3RhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHN0YXRlSWRcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG11dGF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogXCJwaXBlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwaXBlSWRcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGV2ZW50OiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLmV2ZW50LFxyXG4gICAgICAgICAgICAgICAgW2V2ZW50SWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5ldmVudFtldmVudElkXSxcclxuICAgICAgICAgICAgICAgICAgICBtdXRhdG9yczogc3RhdGUuZGVmaW5pdGlvbi5ldmVudFtldmVudElkXS5tdXRhdG9ycy5jb25jYXQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWY6ICdtdXRhdG9yJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IG11dGF0b3JJZFxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9fSwgdHJ1ZSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIE1PVkVfVklFV19OT0RFKHBhcmVudFJlZiwgcG9zaXRpb24sIGFtb3VudCwgZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGRlZmluaXRpb246e1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBbcGFyZW50UmVmLnJlZl06IHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb25bcGFyZW50UmVmLnJlZl0sXHJcbiAgICAgICAgICAgICAgICBbcGFyZW50UmVmLmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb25bcGFyZW50UmVmLnJlZl1bcGFyZW50UmVmLmlkXSxcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogc3RhdGUuZGVmaW5pdGlvbltwYXJlbnRSZWYucmVmXVtwYXJlbnRSZWYuaWRdLmNoaWxkcmVuLm1hcCggLy8gZnVuY3Rpb25hbCBzd2FwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChjaGlsZCxpbmRleCk9PiBpbmRleCA9PT0gcG9zaXRpb24gKyBhbW91bnQgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZGVmaW5pdGlvbltwYXJlbnRSZWYucmVmXVtwYXJlbnRSZWYuaWRdLmNoaWxkcmVuW3Bvc2l0aW9uXTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID09PSBwb3NpdGlvbiA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZGVmaW5pdGlvbltwYXJlbnRSZWYucmVmXVtwYXJlbnRSZWYuaWRdLmNoaWxkcmVuW3Bvc2l0aW9uICsgYW1vdW50XTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5kZWZpbml0aW9uW3BhcmVudFJlZi5yZWZdW3BhcmVudFJlZi5pZF0uY2hpbGRyZW5baW5kZXhdXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfX0sIHRydWUpXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBTRUxFQ1RfUElQRShwaXBlSWQpIHtcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIHNlbGVjdGVkUGlwZUlkOnBpcGVJZH0pXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBDSEFOR0VfUElQRV9WQUxVRV9UT19TVEFURShwaXBlSWQpIHtcclxuICAgICAgICBpZighc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCB8fCBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBzdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGlwZUlkXS52YWx1ZS5pZCApe1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBwaXBlOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGUsXHJcbiAgICAgICAgICAgICAgICBbcGlwZUlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZVtwaXBlSWRdLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7cmVmOiAnc3RhdGUnLCBpZDogc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBbXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfX0sIHRydWUpXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBBRERfVFJBTlNGT1JNQVRJT04ocGlwZUlkLCB0cmFuc2Zvcm1hdGlvbikge1xyXG4gICAgICAgIGlmKHRyYW5zZm9ybWF0aW9uID09PSAnam9pbicpe1xyXG4gICAgICAgICAgICBjb25zdCBuZXdQaXBlSWQgPSB1dWlkKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGpvaW5JZCA9IHV1aWQoKTtcclxuICAgICAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBkZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgam9pbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24uam9pbixcclxuICAgICAgICAgICAgICAgICAgICBbam9pbklkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjogJ3BpcGUnLCBpZDpuZXdQaXBlSWR9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHBpcGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGUsXHJcbiAgICAgICAgICAgICAgICAgICAgW25ld1BpcGVJZF06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ0RlZmF1bHQgdGV4dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogW11cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIFtwaXBlSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZVtwaXBlSWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IHN0YXRlLmRlZmluaXRpb24ucGlwZVtwaXBlSWRdLnRyYW5zZm9ybWF0aW9ucy5jb25jYXQoe3JlZjogJ2pvaW4nLCBpZDpqb2luSWR9KVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfX0sIHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRyYW5zZm9ybWF0aW9uID09PSAndG9VcHBlckNhc2UnKXtcclxuICAgICAgICAgICAgY29uc3QgbmV3SWQgPSB1dWlkKCk7XHJcbiAgICAgICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgICAgIHRvVXBwZXJDYXNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi50b1VwcGVyQ2FzZSxcclxuICAgICAgICAgICAgICAgICAgICBbbmV3SWRdOiB7fVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHBpcGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGUsXHJcbiAgICAgICAgICAgICAgICAgICAgW3BpcGVJZF06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5waXBlW3BpcGVJZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogc3RhdGUuZGVmaW5pdGlvbi5waXBlW3BpcGVJZF0udHJhbnNmb3JtYXRpb25zLmNvbmNhdCh7cmVmOiAndG9VcHBlckNhc2UnLCBpZDpuZXdJZH0pXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9fSwgdHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodHJhbnNmb3JtYXRpb24gPT09ICd0b0xvd2VyQ2FzZScpe1xyXG4gICAgICAgICAgICBjb25zdCBuZXdJZCA9IHV1aWQoKTtcclxuICAgICAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBkZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgdG9Mb3dlckNhc2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnRvTG93ZXJDYXNlLFxyXG4gICAgICAgICAgICAgICAgICAgIFtuZXdJZF06IHt9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcGlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSxcclxuICAgICAgICAgICAgICAgICAgICBbcGlwZUlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGlwZUlkXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBzdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGlwZUlkXS50cmFuc2Zvcm1hdGlvbnMuY29uY2F0KHtyZWY6ICd0b0xvd2VyQ2FzZScsIGlkOm5ld0lkfSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH19LCB0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0cmFuc2Zvcm1hdGlvbiA9PT0gJ3RvVGV4dCcpe1xyXG4gICAgICAgICAgICBjb25zdCBuZXdJZCA9IHV1aWQoKTtcclxuICAgICAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBkZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgdG9UZXh0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi50b1RleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgW25ld0lkXToge31cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBwaXBlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5waXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIFtwaXBlSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZVtwaXBlSWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IHN0YXRlLmRlZmluaXRpb24ucGlwZVtwaXBlSWRdLnRyYW5zZm9ybWF0aW9ucy5jb25jYXQoe3JlZjogJ3RvVGV4dCcsIGlkOm5ld0lkfSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH19LCB0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0cmFuc2Zvcm1hdGlvbiA9PT0gJ2FkZCcpe1xyXG4gICAgICAgICAgICBjb25zdCBuZXdQaXBlSWQgPSB1dWlkKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFkZElkID0gdXVpZCgpO1xyXG4gICAgICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGRlZmluaXRpb246IHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICBhZGQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLmFkZCxcclxuICAgICAgICAgICAgICAgICAgICBbYWRkSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7cmVmOiAncGlwZScsIGlkOm5ld1BpcGVJZH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcGlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSxcclxuICAgICAgICAgICAgICAgICAgICBbbmV3UGlwZUlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogW11cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIFtwaXBlSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZVtwaXBlSWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IHN0YXRlLmRlZmluaXRpb24ucGlwZVtwaXBlSWRdLnRyYW5zZm9ybWF0aW9ucy5jb25jYXQoe3JlZjogJ2FkZCcsIGlkOmFkZElkfSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH19LCB0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0cmFuc2Zvcm1hdGlvbiA9PT0gJ3N1YnRyYWN0Jyl7XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld1BpcGVJZCA9IHV1aWQoKTtcclxuICAgICAgICAgICAgY29uc3Qgc3VidHJhY3RJZCA9IHV1aWQoKTtcclxuICAgICAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBkZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3VidHJhY3Q6IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnN1YnRyYWN0LFxyXG4gICAgICAgICAgICAgICAgICAgIFtzdWJ0cmFjdElkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjogJ3BpcGUnLCBpZDpuZXdQaXBlSWR9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHBpcGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGUsXHJcbiAgICAgICAgICAgICAgICAgICAgW25ld1BpcGVJZF06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBbcGlwZUlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGlwZUlkXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBzdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGlwZUlkXS50cmFuc2Zvcm1hdGlvbnMuY29uY2F0KHtyZWY6ICdzdWJ0cmFjdCcsIGlkOnN1YnRyYWN0SWR9KVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfX0sIHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIExpc3RlbiB0byBhcHAgYW5kIGJsaW5rIGV2ZXJ5IGFjdGlvblxyXG4gICAgbGV0IHRpbWVyID0gbnVsbFxyXG4gICAgY29uc3QgZXZlbnRTdGFjayA9IFtdXHJcbiAgICBhcHAuYWRkTGlzdGVuZXIoKGV2ZW50TmFtZSwgZGF0YSwgZSwgcHJldmlvdXNTdGF0ZSwgY3VycmVudFN0YXRlLCBtdXRhdGlvbnMpPT57XHJcbiAgICAgICAgZXZlbnRTdGFjay5wdXNoKHtldmVudE5hbWUsIGRhdGEsIGUsIHByZXZpb3VzU3RhdGUsIGN1cnJlbnRTdGF0ZSwgbXV0YXRpb25zfSlcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGFjdGl2ZUV2ZW50OiBldmVudE5hbWV9KVxyXG4gICAgICAgIC8vIHllYWgsIEkgcHJvYmFibHkgbmVlZGVkIHNvbWUgb2JzZXJ2YWJsZXMgdG9vXHJcbiAgICAgICAgaWYodGltZXIpe1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRpbWVyID0gc2V0VGltZW91dCgoKT0+IHtcclxuICAgICAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBhY3RpdmVFdmVudDogJyd9KVxyXG4gICAgICAgIH0sIDUwMClcclxuICAgIH0pXHJcblxyXG4gICAgLy8gUmVuZGVyXHJcbiAgICBmdW5jdGlvbiByZW5kZXIoKSB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudFN0YXRlID0gYXBwLmdldEN1cnJlbnRTdGF0ZSgpXHJcbiAgICAgICAgY29uc3QgZHJhZ0NvbXBvbmVudExlZnQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICBtb3VzZWRvd246IFtXSURUSF9EUkFHR0VELCAnZWRpdG9yTGVmdFdpZHRoJ10sXHJcbiAgICAgICAgICAgICAgICB0b3VjaHN0YXJ0OiBbV0lEVEhfRFJBR0dFRCwgJ2VkaXRvckxlZnRXaWR0aCddLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhdHRyczoge1xyXG5cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgcmlnaHQ6ICcwJyxcclxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVgoMTAwJSknLFxyXG4gICAgICAgICAgICAgICAgdG9wOiAnMCcsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwcHgnLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxZW0nLFxyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogJzAnLFxyXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAnY29sLXJlc2l6ZScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBkcmFnQ29tcG9uZW50UmlnaHQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICBtb3VzZWRvd246IFtXSURUSF9EUkFHR0VELCAnZWRpdG9yUmlnaHRXaWR0aCddLFxyXG4gICAgICAgICAgICAgICAgdG91Y2hzdGFydDogW1dJRFRIX0RSQUdHRUQsICdlZGl0b3JSaWdodFdpZHRoJ10sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGF0dHJzOiB7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiAnMCcsXHJcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKC0xMDAlKScsXHJcbiAgICAgICAgICAgICAgICB0b3A6ICcwJyxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAnMTBweCcsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogJzFlbScsXHJcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAnMCcsXHJcbiAgICAgICAgICAgICAgICBjdXJzb3I6ICdjb2wtcmVzaXplJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGRyYWdTdWJDb21wb25lbnQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICBtb3VzZWRvd246IFtXSURUSF9EUkFHR0VELCAnc3ViRWRpdG9yV2lkdGgnXSxcclxuICAgICAgICAgICAgICAgIHRvdWNoc3RhcnQ6IFtXSURUSF9EUkFHR0VELCAnc3ViRWRpdG9yV2lkdGgnXSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYXR0cnM6IHtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgIGxlZnQ6ICcycHgnLFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCgtMTAwJSknLFxyXG4gICAgICAgICAgICAgICAgdG9wOiAnMCcsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwcHgnLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxZW0nLFxyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAgICAgICAgIGN1cnNvcjogJ2NvbC1yZXNpemUnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGVtYmVyRWRpdG9yKHJlZiwgdHlwZSl7XHJcbiAgICAgICAgICAgIGNvbnN0IHBpcGUgPSBzdGF0ZS5kZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGxpc3RUcmFuc2Zvcm1hdGlvbnModHJhbnNmb3JtYXRpb25zLCB0cmFuc1R5cGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cmFuc2Zvcm1hdGlvbnMubWFwKCh0cmFuc1JlZiwgaW5kZXgpPT57XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtZXIgPSBzdGF0ZS5kZWZpbml0aW9uW3RyYW5zUmVmLnJlZl1bdHJhbnNSZWYuaWRdXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHRyYW5zUmVmLnJlZiA9PT0gJ2VxdWFsJykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gaCgnZGl2Jywge30sIFtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2NvbG9yOiAnI2JkYmRiZCcsIGN1cnNvcjogJ2RlZmF1bHQnLCBkaXNwbGF5OidmbGV4J319LCBbaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcxJ319LCB0cmFuc1JlZi5yZWYpLCBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzAnfX0sIHRyYW5zVHlwZSldKSxcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGVtYmVyRWRpdG9yKHRyYW5zZm9ybWVyLnZhbHVlLCB0eXBlKVxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNSZWYucmVmID09PSAnYWRkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge30sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtrZXk6IGluZGV4LCBzdHlsZToge2NvbG9yOiAnI2JkYmRiZCcsIGN1cnNvcjogJ2RlZmF1bHQnLCBkaXNwbGF5OidmbGV4J319LCBbaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcxJ319LCB0cmFuc1JlZi5yZWYpLCBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzAnLCBjb2xvcjogdHJhbnNmb3JtYXRpb25zLmxlbmd0aC0xICE9PSBpbmRleCA/ICcjYmRiZGJkJzogdHJhbnNUeXBlID09PSB0eXBlID8gJ2dyZWVuJzogJ3JlZCd9fSwgJ251bWJlcicpXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtwYWRkaW5nTGVmdDogJzE1cHgnfX0sIFtlbWJlckVkaXRvcih0cmFuc2Zvcm1lci52YWx1ZSwgdHJhbnNUeXBlKV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc1JlZi5yZWYgPT09ICdzdWJ0cmFjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHt9LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7a2V5OiBpbmRleCwgc3R5bGU6IHtjb2xvcjogJyNiZGJkYmQnLCBjdXJzb3I6ICdkZWZhdWx0JywgZGlzcGxheTonZmxleCd9fSwgW2goJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnMSd9fSwgdHJhbnNSZWYucmVmKSwgaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcwJywgY29sb3I6IHRyYW5zZm9ybWF0aW9ucy5sZW5ndGgtMSAhPT0gaW5kZXggPyAnI2JkYmRiZCc6IHRyYW5zVHlwZSA9PT0gdHlwZSA/ICdncmVlbic6ICdyZWQnfX0sICdudW1iZXInKV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZ0xlZnQ6ICcxNXB4J319LCBbZW1iZXJFZGl0b3IodHJhbnNmb3JtZXIudmFsdWUsIHRyYW5zVHlwZSldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAodHJhbnNSZWYucmVmID09PSAnYnJhbmNoJykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBpZihyZXNvbHZlKHRyYW5zZm9ybWVyLnByZWRpY2F0ZSkpe1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgdmFsdWUgPSB0cmFuc2Zvcm1WYWx1ZSh2YWx1ZSwgdHJhbnNmb3JtZXIudGhlbilcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIHZhbHVlID0gdHJhbnNmb3JtVmFsdWUodmFsdWUsIHRyYW5zZm9ybWVyLmVsc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zUmVmLnJlZiA9PT0gJ2pvaW4nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7Y29sb3I6ICcjYmRiZGJkJywgY3Vyc29yOiAnZGVmYXVsdCcsIGRpc3BsYXk6J2ZsZXgnfX0sIFtoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzEnfX0sIHRyYW5zUmVmLnJlZiksIGgoJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnMCcsIGNvbG9yOiB0cmFuc2Zvcm1hdGlvbnMubGVuZ3RoLTEgIT09IGluZGV4ID8gJyNiZGJkYmQnOiB0cmFuc1R5cGUgPT09IHR5cGUgPyAnZ3JlZW4nOiAncmVkJ319LCAndGV4dCcpXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtwYWRkaW5nTGVmdDogJzE1cHgnfX0sIFtlbWJlckVkaXRvcih0cmFuc2Zvcm1lci52YWx1ZSwgdHJhbnNUeXBlKV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc1JlZi5yZWYgPT09ICd0b1VwcGVyQ2FzZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHt9LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtjdXJzb3I6ICdkZWZhdWx0JywgZGlzcGxheTonZmxleCd9fSwgW2goJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnMScsIGNvbG9yOiAnI2JkYmRiZCd9fSwgdHJhbnNSZWYucmVmKSwgaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcwJywgY29sb3I6IHRyYW5zZm9ybWF0aW9ucy5sZW5ndGgtMSAhPT0gaW5kZXggPyAnI2JkYmRiZCc6IHRyYW5zVHlwZSA9PT0gdHlwZSA/ICdncmVlbic6ICdyZWQnfX0sICd0ZXh0JyldKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zUmVmLnJlZiA9PT0gJ3RvTG93ZXJDYXNlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge30sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2N1cnNvcjogJ2RlZmF1bHQnLCBkaXNwbGF5OidmbGV4J319LCBbaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcxJywgY29sb3I6ICcjYmRiZGJkJ319LCB0cmFuc1JlZi5yZWYpLCBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzAnLCBjb2xvcjogdHJhbnNmb3JtYXRpb25zLmxlbmd0aC0xICE9PSBpbmRleCA/ICcjYmRiZGJkJzogdHJhbnNUeXBlID09PSB0eXBlID8gJ2dyZWVuJzogJ3JlZCd9fSwgJ3RleHQnKV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNSZWYucmVmID09PSAndG9UZXh0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge30sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2N1cnNvcjogJ2RlZmF1bHQnLCBkaXNwbGF5OidmbGV4J319LCBbaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcxJywgY29sb3I6ICcjYmRiZGJkJ319LCB0cmFuc1JlZi5yZWYpLCBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzAnLCBjb2xvcjogdHJhbnNmb3JtYXRpb25zLmxlbmd0aC0xICE9PSBpbmRleCA/ICcjYmRiZGJkJzogdHJhbnNUeXBlID09PSB0eXBlID8gJ2dyZWVuJzogJ3JlZCd9fSwgJ3RleHQnKV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdlblRyYW5zZm9ybWF0b3JzKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgIGlmKHR5cGUgPT09ICd0ZXh0Jyl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZzogJzVweCAxMHB4JywgZGlzcGxheTogJ2lubGluZS1ibG9jaycsIGJvcmRlclJhZGl1czogJzEwcHgnLCBtYXJnaW46ICc1cHgnLCBjdXJzb3I6ICdwb2ludGVyJywgYm9yZGVyOiBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID8gJzJweCBzb2xpZCB3aGl0ZScgOiAnMnB4IHNvbGlkICNiZGJkYmQnLCBjb2xvcjogc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA/ICd3aGl0ZScgOiAnI2JkYmRiZCcsfSwgb246IHtjbGljazogW0NIQU5HRV9QSVBFX1ZBTFVFX1RPX1NUQVRFLCByZWYuaWRdfX0sICdjaGFuZ2UgdG8gc3RhdGUnKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZzogJzVweCAxMHB4JywgZGlzcGxheTogJ2lubGluZS1ibG9jaycsIGJvcmRlclJhZGl1czogJzEwcHgnLCBtYXJnaW46ICc1cHgnLCBjdXJzb3I6ICdwb2ludGVyJywgYm9yZGVyOiAnMnB4IHNvbGlkIHdoaXRlJ30sIG9uOiB7Y2xpY2s6IFtBRERfVFJBTlNGT1JNQVRJT04sIHJlZi5pZCwgJ2pvaW4nXX19LCAnam9pbicpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtwYWRkaW5nOiAnNXB4IDEwcHgnLCBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJywgYm9yZGVyUmFkaXVzOiAnMTBweCcsIG1hcmdpbjogJzVweCcsIGN1cnNvcjogJ3BvaW50ZXInLCBib3JkZXI6ICcycHggc29saWQgd2hpdGUnfSwgb246IHtjbGljazogW0FERF9UUkFOU0ZPUk1BVElPTiwgcmVmLmlkLCAndG9VcHBlckNhc2UnXX19LCAndG8gVXBwZXIgY2FzZScpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtwYWRkaW5nOiAnNXB4IDEwcHgnLCBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJywgYm9yZGVyUmFkaXVzOiAnMTBweCcsIG1hcmdpbjogJzVweCcsIGN1cnNvcjogJ3BvaW50ZXInLCBib3JkZXI6ICcycHggc29saWQgd2hpdGUnfSwgb246IHtjbGljazogW0FERF9UUkFOU0ZPUk1BVElPTiwgcmVmLmlkLCAndG9Mb3dlckNhc2UnXX19LCAndG8gTG93ZXIgY2FzZScpLFxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKHR5cGUgPT09ICdudW1iZXInKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtwYWRkaW5nOiAnNXB4IDEwcHgnLCBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJywgYm9yZGVyUmFkaXVzOiAnMTBweCcsIG1hcmdpbjogJzVweCcsIGN1cnNvcjogJ3BvaW50ZXInLCBib3JkZXI6IHN0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWQgPyAnMnB4IHNvbGlkIHdoaXRlJyA6ICcycHggc29saWQgI2JkYmRiZCcsIGNvbG9yOiBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkICA/ICd3aGl0ZScgOiAnI2JkYmRiZCcsfSwgb246IHtjbGljazogW0NIQU5HRV9QSVBFX1ZBTFVFX1RPX1NUQVRFLCByZWYuaWRdfX0sICdjaGFuZ2UgdG8gc3RhdGUnKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZzogJzVweCAxMHB4JywgZGlzcGxheTogJ2lubGluZS1ibG9jaycsIGJvcmRlclJhZGl1czogJzEwcHgnLCBtYXJnaW46ICc1cHgnLCBjdXJzb3I6ICdwb2ludGVyJywgYm9yZGVyOiAnMnB4IHNvbGlkIHdoaXRlJ30sIG9uOiB7Y2xpY2s6IFtBRERfVFJBTlNGT1JNQVRJT04sIHJlZi5pZCwgJ3RvVGV4dCddfX0sICd0byB0ZXh0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmc6ICc1cHggMTBweCcsIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLCBib3JkZXJSYWRpdXM6ICcxMHB4JywgbWFyZ2luOiAnNXB4JywgY3Vyc29yOiAncG9pbnRlcicsIGJvcmRlcjogJzJweCBzb2xpZCB3aGl0ZSd9LCBvbjoge2NsaWNrOiBbQUREX1RSQU5TRk9STUFUSU9OLCByZWYuaWQsICdhZGQnXX19LCAnYWRkJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmc6ICc1cHggMTBweCcsIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLCBib3JkZXJSYWRpdXM6ICcxMHB4JywgbWFyZ2luOiAnNXB4JywgY3Vyc29yOiAncG9pbnRlcicsIGJvcmRlcjogJzJweCBzb2xpZCB3aGl0ZSd9LCBvbjoge2NsaWNrOiBbQUREX1RSQU5TRk9STUFUSU9OLCByZWYuaWQsICdzdWJ0cmFjdCddfX0sICdzdWJ0cmFjdCcpLFxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBpcGUudmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2JywgW2goJ2RpdicsIHtzdHlsZTp7ZGlzcGxheTonZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInfSwgb246IHtjbGljazogW1NFTEVDVF9QSVBFLCByZWYuaWRdfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdpbnB1dCcsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAgJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dERlY29yYXRpb246ICd1bmRlcmxpbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6IFtDSEFOR0VfU1RBVElDX1ZBTFVFLCByZWYsICd2YWx1ZScsICd0ZXh0J10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGl2ZVByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHBpcGUudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMCcsIGN1cnNvcjogJ2RlZmF1bHQnLCBjb2xvcjogcGlwZS50cmFuc2Zvcm1hdGlvbnMubGVuZ3RoID4gMCA/ICcjYmRiZGJkJzogdHlwZSA9PT0gJ3RleHQnID8gJ2dyZWVuJzogJ3JlZCd9fSwgJ3RleHQnKVxyXG4gICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZ0xlZnQ6ICcxNXB4J319LCBsaXN0VHJhbnNmb3JtYXRpb25zKHBpcGUudHJhbnNmb3JtYXRpb25zLCBwaXBlLnR5cGUpKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCBzdGF0ZS5zZWxlY3RlZFBpcGVJZCA9PT0gcmVmLmlkID8gZ2VuVHJhbnNmb3JtYXRvcnMoJ3RleHQnKTogW10pXHJcbiAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzTmFOKHBhcnNlRmxvYXQoTnVtYmVyKHBpcGUudmFsdWUpKSkgJiYgaXNGaW5pdGUoTnVtYmVyKHBpcGUudmFsdWUpKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIFtoKCdkaXYnLCB7c3R5bGU6e2Rpc3BsYXk6J2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJ30sIG9uOiB7Y2xpY2s6IFtTRUxFQ1RfUElQRSwgcmVmLmlkXX19LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnaW5wdXQnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyczoge3R5cGU6J251bWJlcid9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0bGluZTogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46ICAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3doaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ3VuZGVybGluZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogW0NIQU5HRV9TVEFUSUNfVkFMVUUsIHJlZiwgJ3ZhbHVlJywgJ251bWJlciddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpdmVQcm9wczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBOdW1iZXIocGlwZS52YWx1ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMCcsIGN1cnNvcjogJ2RlZmF1bHQnLCBjb2xvcjogcGlwZS50cmFuc2Zvcm1hdGlvbnMubGVuZ3RoID4gMCA/ICcjYmRiZGJkJzogdHlwZSA9PT0gJ251bWJlcicgPyAnZ3JlZW4nOiAncmVkJ319LCAnbnVtYmVyJylcclxuICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmdMZWZ0OiAnMTVweCd9fSwgbGlzdFRyYW5zZm9ybWF0aW9ucyhwaXBlLnRyYW5zZm9ybWF0aW9ucywgcGlwZS50eXBlKSksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywgc3RhdGUuc2VsZWN0ZWRQaXBlSWQgPT09IHJlZi5pZCA/IGdlblRyYW5zZm9ybWF0b3JzKCdudW1iZXInKTogW10pXHJcbiAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZihwaXBlLnZhbHVlLnJlZiA9PT0gJ3N0YXRlJyl7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkaXNwbFN0YXRlID0gc3RhdGUuZGVmaW5pdGlvbltwaXBlLnZhbHVlLnJlZl1bcGlwZS52YWx1ZS5pZF1cclxuICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCBbaCgnZGl2Jywge3N0eWxlOntkaXNwbGF5OidmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcid9LCBvbjoge2NsaWNrOiBbU0VMRUNUX1BJUEUsIHJlZi5pZF19fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2ZsZXg6ICcxJ319LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbaCgnZGl2Jyx7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHsgY3Vyc29yOiAncG9pbnRlcicsIGNvbG9yOiBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBwaXBlLnZhbHVlLmlkID8gJyNlYWI2NWMnOiAnd2hpdGUnLCBwYWRkaW5nOiAnMnB4IDVweCcsIG1hcmdpbjogJzNweCAzcHggMCAwJywgYm9yZGVyOiAnMnB4IHNvbGlkICcgKyAoc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gcGlwZS52YWx1ZS5pZCA/ICcjZWFiNjVjJzogJ3doaXRlJyksIGJvcmRlclJhZGl1czogJzEwcHgnLCBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb246IHtjbGljazogW1NUQVRFX05PREVfU0VMRUNURUQsIHBpcGUudmFsdWUuaWRdfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtkaXNwbFN0YXRlLnRpdGxlXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZmxleDogJzAnLCBjdXJzb3I6ICdkZWZhdWx0JywgY29sb3I6IHBpcGUudHJhbnNmb3JtYXRpb25zLmxlbmd0aCA+IDAgPyAnI2JkYmRiZCc6IGRpc3BsU3RhdGUudHlwZSA9PT0gdHlwZSA/ICdncmVlbic6ICdyZWQnfX0sIGRpc3BsU3RhdGUudHlwZSlcclxuICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmdMZWZ0OiAnMTVweCd9fSwgbGlzdFRyYW5zZm9ybWF0aW9ucyhwaXBlLnRyYW5zZm9ybWF0aW9ucywgcGlwZS50eXBlKSksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywgc3RhdGUuc2VsZWN0ZWRQaXBlSWQgPT09IHJlZi5pZCA/IHBpcGUudHJhbnNmb3JtYXRpb25zLmxlbmd0aCA9PT0gMCA/IGdlblRyYW5zZm9ybWF0b3JzKGRpc3BsU3RhdGUudHlwZSk6IHBpcGUudHJhbnNmb3JtYXRpb25zW3BpcGUudHJhbnNmb3JtYXRpb25zLmxlbmd0aC0xXS5yZWYgPT09ICdhZGQnIHx8IHBpcGUudHJhbnNmb3JtYXRpb25zW3BpcGUudHJhbnNmb3JtYXRpb25zLmxlbmd0aC0xXS5yZWYgPT09ICdzdWJ0cmFjdCc/IGdlblRyYW5zZm9ybWF0b3JzKCdudW1iZXInKSA6IGdlblRyYW5zZm9ybWF0b3JzKCd0ZXh0Jyk6IFtdKSAvLyBUT0RPIGZpeCwgYSBoYWNrIGZvciBkZW1vLCB0eXBlIHNob3VsZCBiZSBsYXN0IHRyYW5zZm9ybWF0aW9uIG5vdCBqdXN0IHRleHRcclxuICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYocGlwZS52YWx1ZS5yZWYgPT09ICdldmVudERhdGEnKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50RGF0YSA9IHN0YXRlLmRlZmluaXRpb25bcGlwZS52YWx1ZS5yZWZdW3BpcGUudmFsdWUuaWRdXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2JywgW2goJ2RpdicsIHtzdHlsZTp7ZGlzcGxheTonZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInfSwgb246IHtjbGljazogW1NFTEVDVF9QSVBFLCByZWYuaWRdfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMSd9fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgW2goJ2Rpdicse1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7IGN1cnNvcjogJ3BvaW50ZXInLCBjb2xvcjogc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gcGlwZS52YWx1ZS5pZCA/ICcjZWFiNjVjJzogJ3doaXRlJywgcGFkZGluZzogJzJweCA1cHgnLCBtYXJnaW46ICczcHggM3B4IDAgMCcsIGJvcmRlcjogJzJweCBzb2xpZCAnICsgKHN0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWQgPT09IHBpcGUudmFsdWUuaWQgPyAnI2VhYjY1Yyc6ICd3aGl0ZScpLCBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb246IHtjbGljazogW1NUQVRFX05PREVfU0VMRUNURUQsIHBpcGUudmFsdWUuaWRdfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtldmVudERhdGEudGl0bGVdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMCcsIGN1cnNvcjogJ2RlZmF1bHQnLCBjb2xvcjogcGlwZS50cmFuc2Zvcm1hdGlvbnMubGVuZ3RoID4gMCA/ICcjYmRiZGJkJzogZXZlbnREYXRhLnR5cGUgPT09IHR5cGUgPyAnZ3JlZW4nOiAncmVkJ319LCBldmVudERhdGEudHlwZSlcclxuICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmdMZWZ0OiAnMTVweCd9fSwgbGlzdFRyYW5zZm9ybWF0aW9ucyhwaXBlLnRyYW5zZm9ybWF0aW9ucywgcGlwZS50eXBlKSksXHJcbiAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBsaXN0TmFtZVNwYWNlKHN0YXRlSWQpIHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudE5hbWVTcGFjZSA9IHN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlW3N0YXRlSWRdXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGVkaXRpbmdOb2RlKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2lucHV0Jywge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHN0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWQgPT09IHN0YXRlSWQgPyAnI2VhYjY1Yyc6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiAnaW5zZXQgMCAtMXB4IDAgMCB3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAgJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250OiAnaW5oZXJpdCdcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiBbQ0hBTkdFX05BTUVTUEFDRV9USVRMRSwgc3RhdGVJZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBsaXZlUHJvcHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGN1cnJlbnROYW1lU3BhY2UudGl0bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBhdHRyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhLWlzdGl0bGVlZGl0b3InOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjbG9zZWQgPSBzdGF0ZS52aWV3Rm9sZGVyc0Nsb3NlZFtzdGF0ZUlkXSB8fCAoc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCAhPT0gc3RhdGVJZCAmJiBjdXJyZW50TmFtZVNwYWNlLmNoaWxkcmVuLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2JywgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzdmcnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHt3aWR0aDogMTIsIGhlaWdodDogMTZ9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7IGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMCA1cHgnLCB0cmFuc2Zvcm06IGNsb3NlZCA/ICdyb3RhdGUoMGRlZyknOiAncm90YXRlKDkwZGVnKScsIHRyYW5zaXRpb246ICdhbGwgMC4ycycsIG1hcmdpbkxlZnQ6ICctMTBweCd9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiBbVklFV19GT0xERVJfQ0xJQ0tFRCwgc3RhdGVJZF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtoKCdwb2x5Z29uJywge2F0dHJzOiB7cG9pbnRzOiAnMTIsOCAwLDEgMyw4IDAsMTUnfSwgc3R5bGU6IHtmaWxsOiBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBzdGF0ZUlkID8gJyNlYWI2NWMnOiAnd2hpdGUnLCB0cmFuc2l0aW9uOiAnZmlsbCAwLjJzJ319KV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5lZGl0aW5nVGl0bGVOb2RlSWQgPT09IHN0YXRlSWQgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGluZ05vZGUoKTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7IHN0eWxlOiB7IGN1cnNvcjogJ3BvaW50ZXInfSwgb246IHtjbGljazogW1NUQVRFX05PREVfU0VMRUNURUQsIHN0YXRlSWRdLCBkYmxjbGljazogW0VESVRfVklFV19OT0RFX1RJVExFLCBzdGF0ZUlkXX19LCBbaCgnc3BhbicsIHtzdHlsZToge2NvbG9yOiBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBzdGF0ZUlkID8gJyNlYWI2NWMnOiAnd2hpdGUnLCB0cmFuc2l0aW9uOiAnY29sb3IgMC4ycyd9fSwgY3VycmVudE5hbWVTcGFjZS50aXRsZSldKSxcclxuICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHsgZGlzcGxheTogY2xvc2VkID8gJ25vbmUnOiAnYmxvY2snLCBwYWRkaW5nTGVmdDogJzEwcHgnLCBwYWRkaW5nQm90dG9tOiAnNXB4JywgYm9yZGVyTGVmdDogc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gc3RhdGVJZCA/ICcycHggc29saWQgI2VhYjY1YycgOicycHggc29saWQgI2JkYmRiZCcsIHRyYW5zaXRpb246ICdib3JkZXItY29sb3IgMC4ycyd9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5jdXJyZW50TmFtZVNwYWNlLmNoaWxkcmVuLm1hcCgocmVmKT0+IHJlZi5yZWYgPT09ICdzdGF0ZScgPyBsaXN0U3RhdGUocmVmLmlkKTogbGlzdE5hbWVTcGFjZShyZWYuaWQpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2Rpc3BsYXk6IHN0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWQgPT09IHN0YXRlSWQgPyAnaW5saW5lLWJsb2NrJzogJ25vbmUnLCBjdXJzb3I6ICdwb2ludGVyJywgYm9yZGVyUmFkaXVzOiAnNXB4JywgYm9yZGVyOiAnM3B4IHNvbGlkICNlYWI2NWMnLCBwYWRkaW5nOiAnNXB4JywgbWFyZ2luOiAnNXB4J30sIG9uOiB7Y2xpY2s6IFtBRERfU1RBVEUsIHN0YXRlSWQsICd0ZXh0J119fSwgJysgdGV4dCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZGlzcGxheTogc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gc3RhdGVJZCA/ICdpbmxpbmUtYmxvY2snOiAnbm9uZScsIGN1cnNvcjogJ3BvaW50ZXInLCBib3JkZXJSYWRpdXM6ICc1cHgnLCBib3JkZXI6ICczcHggc29saWQgI2VhYjY1YycsIHBhZGRpbmc6ICc1cHgnLCBtYXJnaW46ICc1cHgnfSwgb246IHtjbGljazogW0FERF9TVEFURSwgc3RhdGVJZCwgJ251bWJlciddfX0sICcrIG51bWJlcicpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2goJ3NwYW4nLCB7c3R5bGU6IHtkaXNwbGF5OiBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBzdGF0ZUlkID8gJ2lubGluZS1ibG9jayc6ICdub25lJywgY3Vyc29yOiAncG9pbnRlcicsIGJvcmRlclJhZGl1czogJzVweCcsIGJvcmRlcjogJzNweCBzb2xpZCAjZWFiNjVjJywgcGFkZGluZzogJzVweCcsIG1hcmdpbjogJzVweCd9LCBvbjoge2NsaWNrOiBbQUREX1NUQVRFLCBzdGF0ZUlkLCAnYm9vbGVhbiddfX0sICcrIHZhcmlhbnQnKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9oKCdzcGFuJywge3N0eWxlOiB7ZGlzcGxheTogc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gc3RhdGVJZCA/ICdpbmxpbmUtYmxvY2snOiAnbm9uZScsIGN1cnNvcjogJ3BvaW50ZXInLCBib3JkZXJSYWRpdXM6ICc1cHgnLCBib3JkZXI6ICczcHggc29saWQgI2VhYjY1YycsIHBhZGRpbmc6ICc1cHgnLCBtYXJnaW46ICc1cHgnfSwgb246IHtjbGljazogW0FERF9TVEFURSwgc3RhdGVJZCwgJ3RhYmxlJ119fSwgJysgdGFibGUnKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2Rpc3BsYXk6IHN0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWQgPT09IHN0YXRlSWQgPyAnaW5saW5lLWJsb2NrJzogJ25vbmUnLCBjdXJzb3I6ICdwb2ludGVyJywgYm9yZGVyUmFkaXVzOiAnNXB4JywgYm9yZGVyOiAnM3B4IHNvbGlkICNlYWI2NWMnLCBwYWRkaW5nOiAnNXB4JywgbWFyZ2luOiAnNXB4J30sIG9uOiB7Y2xpY2s6IFtBRERfU1RBVEUsIHN0YXRlSWQsICduYW1lc3BhY2UnXX19LCAnKyBmb2xkZXInKSxcclxuICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBsaXN0U3RhdGUoc3RhdGVJZCkge1xyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U3RhdGUgPSBzdGF0ZS5kZWZpbml0aW9uLnN0YXRlW3N0YXRlSWRdXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGVkaXRpbmdOb2RlKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2lucHV0Jywge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHN0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWQgPT09IHN0YXRlSWQgPyAnI2VhYjY1Yyc6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcycHggNXB4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAnM3B4IDNweCAwIDAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICcycHggc29saWQgJyArIChzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBzdGF0ZUlkID8gJyNlYWI2NWMnOiAnI2JkYmRiZCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICcxMHB4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6ICdpbmhlcml0J1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6IFtDSEFOR0VfU1RBVEVfTk9ERV9USVRMRSwgc3RhdGVJZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBsaXZlUHJvcHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGN1cnJlbnRTdGF0ZS50aXRsZSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEtaXN0aXRsZWVkaXRvcic6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzAuOGVtJyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge29uOiB7Y2xpY2s6IFtTVEFURV9OT0RFX1NFTEVDVEVELCBzdGF0ZUlkXSwgZGJsY2xpY2s6IFtFRElUX1ZJRVdfTk9ERV9USVRMRSwgc3RhdGVJZF19fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5lZGl0aW5nVGl0bGVOb2RlSWQgPT09IHN0YXRlSWQgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGluZ05vZGUoKTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtjb2xvcjogc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gc3RhdGVJZCA/ICcjZWFiNjVjJzogJ3doaXRlJywgcGFkZGluZzogJzJweCA1cHgnLCBtYXJnaW46ICc3cHggM3B4IDJweCAwJywgYm9yZGVyOiAnMnB4IHNvbGlkICcgKyAoc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gc3RhdGVJZCA/ICcjZWFiNjVjJzogJyNiZGJkYmQnKSwgYm9yZGVyUmFkaXVzOiAnMTBweCcsIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLCB0cmFuc2l0aW9uOiAnYWxsIDAuMnMnfX0sIGN1cnJlbnRTdGF0ZS50aXRsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsICc6ICcpLFxyXG4gICAgICAgICAgICAgICAgICAgICgoKT0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9TdHlsZUlucHV0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGFwcC5nZXRDdXJyZW50U3RhdGUoKVtzdGF0ZUlkXSAhPSBzdGF0ZS5kZWZpbml0aW9uLnN0YXRlW3N0YXRlSWRdLmRlZmF1bHRWYWx1ZSA/ICdyZ2IoOTEsIDIwNCwgOTEpJyA6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aDogJzUwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoY3VycmVudFN0YXRlLnR5cGUgPT09ICd0ZXh0JykgcmV0dXJuIGgoJ2lucHV0Jywge2F0dHJzOiB7dHlwZTogJ3RleHQnfSwgbGl2ZVByb3BzOiB7dmFsdWU6IGFwcC5nZXRDdXJyZW50U3RhdGUoKVtzdGF0ZUlkXX0sIHN0eWxlOiBub1N0eWxlSW5wdXQsIG9uOiB7aW5wdXQ6IFtDSEFOR0VfQ1VSUkVOVF9TVEFURV9URVhUX1ZBTFVFLCBzdGF0ZUlkXX19KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihjdXJyZW50U3RhdGUudHlwZSA9PT0gJ251bWJlcicpIHJldHVybiBoKCdzcGFuJywge3N0eWxlOiB7cG9zaXRpb246ICdyZWxhdGl2ZSd9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnaW5wdXQnLCB7YXR0cnM6IHt0eXBlOiAnbnVtYmVyJ30sIGxpdmVQcm9wczoge3ZhbHVlOiBhcHAuZ2V0Q3VycmVudFN0YXRlKClbc3RhdGVJZF19LCBzdHlsZTogey4uLm5vU3R5bGVJbnB1dCwgd2lkdGg6IDkqYXBwLmdldEN1cnJlbnRTdGF0ZSgpW3N0YXRlSWRdLnRvU3RyaW5nKCkubGVuZ3RoICsgJ3B4J30sIG9uOiB7aW5wdXQ6IFtDSEFOR0VfQ1VSUkVOVF9TVEFURV9OVU1CRVJfVkFMVUUsIHN0YXRlSWRdfX0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3ZnJywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyczoge3dpZHRoOiA2LCBoZWlnaHQ6IDh9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogeyBjdXJzb3I6ICdwb2ludGVyJywgcG9zaXRpb246ICdhYnNvbHV0ZScsIHRvcDogJzAnLCByaWdodDogJy0xMnB4JywgcGFkZGluZzogJzFweCAycHggM3B4IDJweCcsIHRyYW5zZm9ybToncm90YXRlKC05MGRlZyknfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiBbSU5DUkVNRU5UX0NVUlJFTlRfU1RBVEVfTlVNQkVSX1ZBTFVFLCBzdGF0ZUlkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW2goJ3BvbHlnb24nLCB7YXR0cnM6IHtwb2ludHM6ICc2LDQgMCwwIDIsNCAwLDgnLCBmaWxsOiAnd2hpdGUnfX0pXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzdmcnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzOiB7d2lkdGg6IDYsIGhlaWdodDogOH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7IGN1cnNvcjogJ3BvaW50ZXInLCBwb3NpdGlvbjogJ2Fic29sdXRlJywgYm90dG9tOiAnMCcsIHJpZ2h0OiAnLTEycHgnLCBwYWRkaW5nOiAnM3B4IDJweCAxcHggMnB4JywgdHJhbnNmb3JtOidyb3RhdGUoOTBkZWcpJ30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGljazogW0RFQ1JFTUVOVF9DVVJSRU5UX1NUQVRFX05VTUJFUl9WQUxVRSwgc3RhdGVJZF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtoKCdwb2x5Z29uJywge2F0dHJzOiB7cG9pbnRzOiAnNiw0IDAsMCAyLDQgMCw4JywgZmlsbDogJ3doaXRlJ319KV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihjdXJyZW50U3RhdGUudHlwZSA9PT0gJ3RhYmxlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFibGUgPSBhcHAuZ2V0Q3VycmVudFN0YXRlKClbc3RhdGVJZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAnM3B4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjODI4MTgzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZGlzcGxheTogJ2ZsZXgnfX0sICBPYmplY3Qua2V5cyhjdXJyZW50U3RhdGUuZGVmaW5pdGlvbikubWFwKGtleSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2ZsZXg6ICcxJywgcGFkZGluZzogJzJweCA1cHgnLCBib3JkZXJCb3R0b206ICcycHggc29saWQgd2hpdGUnfX0sIGtleSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uT2JqZWN0LmtleXModGFibGUpLm1hcChpZCA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZGlzcGxheTogJ2ZsZXgnfX0sIE9iamVjdC5rZXlzKHRhYmxlW2lkXSkubWFwKGtleSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2ZsZXg6ICcxJywgcGFkZGluZzogJzJweCA1cHgnfX0sIHRhYmxlW2lkXVtrZXldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pKCksXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gc3RhdGVJZCA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCBjdXJyZW50U3RhdGUubXV0YXRvcnMubWFwKHJlZiA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge2NvbG9yOiBzdGF0ZS5hY3RpdmVFdmVudCA9PT0gc3RhdGUuZGVmaW5pdGlvbi5tdXRhdG9yW3JlZi5pZF0uZXZlbnQuaWQgPyAnIzViY2M1Yic6ICd3aGl0ZScsIHRyYW5zaXRpb246ICdhbGwgMC4ycycsIGJveFNoYWRvdzogc3RhdGUuc2VsZWN0ZWRFdmVudElkID09PSBzdGF0ZS5kZWZpbml0aW9uLm11dGF0b3JbcmVmLmlkXS5ldmVudC5pZCA/ICcjNWJjYzViIDVweCAwIDBweCAwcHggaW5zZXQnOiAnbm9uZScsIHBhZGRpbmc6ICcwIDAgMCA3cHgnfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiBbU0VMRUNUX0VWRU5ULCBzdGF0ZS5kZWZpbml0aW9uLm11dGF0b3JbcmVmLmlkXS5ldmVudC5pZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYmxjbGljazogW0VESVRfRVZFTlRfVElUTEUsIHN0YXRlLmRlZmluaXRpb24ubXV0YXRvcltyZWYuaWRdLmV2ZW50LmlkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+KAoiAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLmVkaXRpbmdUaXRsZU5vZGVJZCA9PT0gc3RhdGUuZGVmaW5pdGlvbi5tdXRhdG9yW3JlZi5pZF0uZXZlbnQuaWQgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdpbnB1dCcsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnd2hpdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICdpbnNldCAwIC0xcHggMCAwIHdoaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAgJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6ICdpbmhlcml0J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6IFtDSEFOR0VfRVZFTlRfVElUTEUsIHN0YXRlLmRlZmluaXRpb24ubXV0YXRvcltyZWYuaWRdLmV2ZW50LmlkXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXZlUHJvcHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc3RhdGUuZGVmaW5pdGlvbi5ldmVudFtzdGF0ZS5kZWZpbml0aW9uLm11dGF0b3JbcmVmLmlkXS5ldmVudC5pZF0udGl0bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEtaXN0aXRsZWVkaXRvcic6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBzdGF0ZS5kZWZpbml0aW9uLmV2ZW50W3N0YXRlLmRlZmluaXRpb24ubXV0YXRvcltyZWYuaWRdLmV2ZW50LmlkXS50aXRsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZWxlY3RlZEV2ZW50SWQgPT09IHN0YXRlLmRlZmluaXRpb24ubXV0YXRvcltyZWYuaWRdLmV2ZW50LmlkID8gaCgnZGl2Jywge3N0eWxlOiB7bWFyZ2luTGVmdDogJzEwcHgnfX0sIFtlbWJlckVkaXRvcihzdGF0ZS5kZWZpbml0aW9uLm11dGF0b3JbcmVmLmlkXS5tdXRhdGlvbiwgY3VycmVudFN0YXRlLnR5cGUpXSk6IGgoJ2RpdicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgKSkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJyksXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXRlQ29tcG9uZW50ID0gaCgnZGl2JywgeyBhdHRyczoge2NsYXNzOiAnYmV0dGVyLXNjcm9sbGJhcid9LCBzdHlsZToge292ZXJmbG93OiAnYXV0bycsIGZsZXg6ICcxJywgcGFkZGluZzogJzZweCAxNXB4J30sIG9uOiB7Y2xpY2s6IFtVTlNFTEVDVF9TVEFURV9OT0RFXX19LCBbbGlzdE5hbWVTcGFjZSgnX3Jvb3ROYW1lU3BhY2UnKV0pXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxpc3RCb3hOb2RlKG5vZGVSZWYsIHBhcmVudFJlZiwgcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUlkID0gbm9kZVJlZi5pZFxyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRJZCA9IHBhcmVudFJlZi5pZFxyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZUlkXVxyXG4gICAgICAgICAgICBmdW5jdGlvbiBlZGl0aW5nTm9kZSgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBoKCdpbnB1dCcsIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyM1M0IyRUQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiAnaW5zZXQgMCAtMXB4IDAgMCAjNTNCMkVEJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9udDogJ2luaGVyaXQnXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogW0NIQU5HRV9WSUVXX05PREVfVElUTEUsIG5vZGVSZWZdLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbGl2ZVByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBub2RlLnRpdGxlLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnZGF0YS1pc3RpdGxlZWRpdG9yJzogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY2xvc2VkID0gc3RhdGUudmlld0ZvbGRlcnNDbG9zZWRbbm9kZUlkXVxyXG4gICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3ZnJywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzOiB7d2lkdGg6IDEyLCBoZWlnaHQ6IDE2fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogeyBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzAgNXB4JywgdHJhbnNmb3JtOiBjbG9zZWQgPyAncm90YXRlKDBkZWcpJzogJ3JvdGF0ZSg5MGRlZyknLCB0cmFuc2l0aW9uOiAnYWxsIDAuMnMnLCBtYXJnaW5MZWZ0OiAnLTNweCd9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiBbVklFV19GT0xERVJfQ0xJQ0tFRCwgbm9kZUlkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2goJ3BvbHlnb24nLCB7YXR0cnM6IHtwb2ludHM6ICcxMiw4IDAsMSAzLDggMCwxNSd9LCBzdHlsZToge2ZpbGw6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJ3doaXRlJywgdHJhbnNpdGlvbjogJ2ZpbGwgMC4ycyd9fSldKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3ZnJywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzOiB7d2lkdGg6IDE0LCBoZWlnaHQ6IDE0fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogeyBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzAgNXB4IDAgMCd9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uOiB7Y2xpY2s6IFtWSUVXX05PREVfU0VMRUNURUQsIG5vZGVSZWZdfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVSZWYucmVmID09PSAndk5vZGVCb3gnID8gW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdyZWN0Jywge2F0dHJzOiB7eDogMSwgeTogMSwgd2lkdGg6IDEyLCBoZWlnaHQ6IDEyLCBmaWxsOiAnbm9uZScsIHRyYW5zaXRpb246ICdhbGwgMC4ycycsc3Ryb2tlOiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnIzUzQjJFRCc6ICd3aGl0ZScsICdzdHJva2Utd2lkdGgnOiAnMid9fSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlUmVmLnJlZiA9PT0gJ3ZOb2RlTGlzdCcgPyBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdjaXJjbGUnLCB7YXR0cnM6IHtyOiAyLCBjeDogMiwgY3k6IDIsIHRyYW5zaXRpb246ICdhbGwgMC4ycycsIGZpbGw6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJ3doaXRlJyx9fSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdyZWN0Jywge2F0dHJzOiB7eDogNiwgeTogMSwgd2lkdGg6IDEwLCB0cmFuc2l0aW9uOiAnYWxsIDAuMnMnLCBoZWlnaHQ6IDIsIGZpbGw6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJ3doaXRlJyx9fSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdjaXJjbGUnLCB7YXR0cnM6IHtyOiAyLCBjeDogMiwgY3k6IDcsIHRyYW5zaXRpb246ICdhbGwgMC4ycycsIGZpbGw6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJ3doaXRlJyx9fSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdyZWN0Jywge2F0dHJzOiB7eDogNiwgeTogNiwgd2lkdGg6IDEwLCB0cmFuc2l0aW9uOiAnYWxsIDAuMnMnLCBoZWlnaHQ6IDIsIGZpbGw6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJ3doaXRlJyx9fSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdjaXJjbGUnLCB7YXR0cnM6IHtyOiAyLCBjeDogMiwgY3k6IDEyLCB0cmFuc2l0aW9uOiAnYWxsIDAuMnMnLCBmaWxsOiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnIzUzQjJFRCc6ICd3aGl0ZScsfX0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgncmVjdCcsIHthdHRyczoge3g6IDYsIHk6IDExLCB3aWR0aDogMTAsIHRyYW5zaXRpb246ICdhbGwgMC4ycycsIGhlaWdodDogMiwgZmlsbDogc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCA9PT0gbm9kZUlkID8gJyM1M0IyRUQnOiAnd2hpdGUnLH19KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSA6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3RleHQnLCB7YXR0cnM6IHsgeDoyLCB5OjE0LCBmaWxsOiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnIzUzQjJFRCc6ICd3aGl0ZSd9fSwgJ2lmJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZWRpdGluZ1RpdGxlTm9kZUlkID09PSBub2RlSWQgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGluZ05vZGUoKTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7IHN0eWxlOiB7ZmxleDogJzEnLCBjdXJzb3I6ICdwb2ludGVyJywgY29sb3I6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJ3doaXRlJywgdHJhbnNpdGlvbjogJ2NvbG9yIDAuMnMnfSwgb246IHtjbGljazogW1ZJRVdfTk9ERV9TRUxFQ1RFRCwgbm9kZVJlZl0sIGRibGNsaWNrOiBbRURJVF9WSUVXX05PREVfVElUTEUsIG5vZGVJZF19fSwgbm9kZS50aXRsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7IGRpc3BsYXk6IGNsb3NlZCA/ICdub25lJzogJ2Jsb2NrJywgbWFyZ2luTGVmdDogJzdweCcsIHBhZGRpbmdMZWZ0OiAnMTBweCcsIGJvcmRlckxlZnQ6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcycHggc29saWQgIzUzQjJFRCcgOiAnMnB4IHNvbGlkICNiZGJkYmQnLCB0cmFuc2l0aW9uOiAnYm9yZGVyLWNvbG9yIDAuMnMnfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4ubm9kZS5jaGlsZHJlbi5tYXAoKHJlZiwgaW5kZXgpPT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihyZWYucmVmID09PSAndk5vZGVUZXh0JykgcmV0dXJuIGxpc3RUZXh0Tm9kZShyZWYsIG5vZGVSZWYsIGluZGV4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYocmVmLnJlZiA9PT0gJ3ZOb2RlQm94JyB8fCByZWYucmVmID09PSAndk5vZGVMaXN0JyB8fCByZWYucmVmID09PSAndk5vZGVJZicpIHJldHVybiBsaXN0Qm94Tm9kZShyZWYsIG5vZGVSZWYsIGluZGV4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYocmVmLnJlZiA9PT0gJ3ZOb2RlSW5wdXQnKSByZXR1cm4gbGlzdElucHV0Tm9kZShyZWYsIG5vZGVSZWYsIGluZGV4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2Rpc3BsYXk6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICdpbmxpbmUtYmxvY2snOiAnbm9uZScsIGN1cnNvcjogJ3BvaW50ZXInLCBib3JkZXJSYWRpdXM6ICc1cHgnLCBib3JkZXI6ICczcHggc29saWQgIzUzQjJFRCcsIHBhZGRpbmc6ICc1cHgnLCBtYXJnaW46ICc1cHgnfSwgb246IHtjbGljazogW0FERF9OT0RFLCBub2RlUmVmLCAnYm94J119fSwgJysgYm94JyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtkaXNwbGF5OiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnaW5saW5lLWJsb2NrJzogJ25vbmUnLCBjdXJzb3I6ICdwb2ludGVyJywgYm9yZGVyUmFkaXVzOiAnNXB4JywgYm9yZGVyOiAnM3B4IHNvbGlkICM1M0IyRUQnLCBwYWRkaW5nOiAnNXB4JywgbWFyZ2luOiAnNXB4J30sIG9uOiB7Y2xpY2s6IFtBRERfTk9ERSwgbm9kZVJlZiwgJ3RleHQnXX19LCAnKyB0ZXh0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtkaXNwbGF5OiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnaW5saW5lLWJsb2NrJzogJ25vbmUnLCBjdXJzb3I6ICdwb2ludGVyJywgYm9yZGVyUmFkaXVzOiAnNXB4JywgYm9yZGVyOiAnM3B4IHNvbGlkICM1M0IyRUQnLCBwYWRkaW5nOiAnNXB4JywgbWFyZ2luOiAnNXB4J30sIG9uOiB7Y2xpY2s6IFtBRERfTk9ERSwgbm9kZVJlZiwgJ2lucHV0J119fSwgJysgaW5wdXQnKSxcclxuICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA+IDAgPyBoKCdzdmcnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHt3aWR0aDogNiwgaGVpZ2h0OiA4fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge2Rpc3BsYXk6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICdibG9jayc6ICdub25lJywgY3Vyc29yOiAncG9pbnRlcicsIHBvc2l0aW9uOiAnYWJzb2x1dGUnLCB0b3A6ICcwJywgcmlnaHQ6ICcyNXB4JywgcGFkZGluZzogJzFweCAycHggM3B4IDJweCcsIHRyYW5zZm9ybToncm90YXRlKC05MGRlZyknfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGljazogW01PVkVfVklFV19OT0RFLCBwYXJlbnRSZWYsIHBvc2l0aW9uLCAtMV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtoKCdwb2x5Z29uJywge2F0dHJzOiB7cG9pbnRzOiAnNiw0IDAsMCAyLDQgMCw4JywgZmlsbDogJ3doaXRlJ319KV0pOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50SWQgJiYgcG9zaXRpb24gPCBzdGF0ZS5kZWZpbml0aW9uW3BhcmVudFJlZi5yZWZdW3BhcmVudElkXS5jaGlsZHJlbi5sZW5ndGgtMSA/IGgoJ3N2ZycsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyczoge3dpZHRoOiA2LCBoZWlnaHQ6IDh9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7ZGlzcGxheTogc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCA9PT0gbm9kZUlkID8gJ2Jsb2NrJzogJ25vbmUnLCBjdXJzb3I6ICdwb2ludGVyJywgcG9zaXRpb246ICdhYnNvbHV0ZScsIGJvdHRvbTogJzAnLCByaWdodDogJzI1cHgnLCBwYWRkaW5nOiAnM3B4IDJweCAxcHggMnB4JywgdHJhbnNmb3JtOidyb3RhdGUoOTBkZWcpJ30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6IFtNT1ZFX1ZJRVdfTk9ERSwgcGFyZW50UmVmLCBwb3NpdGlvbiwgMV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtoKCdwb2x5Z29uJywge2F0dHJzOiB7cG9pbnRzOiAnNiw0IDAsMCAyLDQgMCw4JywgZmlsbDogJ3doaXRlJ319KV0pOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7Y3Vyc29yOiAncG9pbnRlcicsIGRpc3BsYXk6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICdibG9jayc6ICdub25lJywgcG9zaXRpb246ICdhYnNvbHV0ZScsIHJpZ2h0OiAnNXB4JywgdG9wOiAnMCd9LCBvbjoge2NsaWNrOiBbREVMRVRFX1NFTEVDVEVEX1ZJRVcsIG5vZGVSZWYsIHBhcmVudFJlZl19fSwgJ3gnKSxcclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBsaXN0VGV4dE5vZGUobm9kZVJlZiwgcGFyZW50UmVmLCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlSWQgPSBub2RlUmVmLmlkXHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudElkID0gcGFyZW50UmVmLmlkXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzdGF0ZS5kZWZpbml0aW9uLnZOb2RlVGV4dFtub2RlSWRdXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGVkaXRpbmdOb2RlKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2lucHV0Jywge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzUzQjJFRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICdpbnNldCAwIC0xcHggMCAwICM1M0IyRUQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250OiAnaW5oZXJpdCdcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiBbQ0hBTkdFX1ZJRVdfTk9ERV9USVRMRSwgbm9kZVJlZl0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBsaXZlUHJvcHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG5vZGUudGl0bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBhdHRyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhLWlzdGl0bGVlZGl0b3InOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgb246IHtjbGljazogW1ZJRVdfTk9ERV9TRUxFQ1RFRCwgbm9kZVJlZl0sIGRibGNsaWNrOiBbRURJVF9WSUVXX05PREVfVElUTEUsIG5vZGVJZF19XHJcbiAgICAgICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnc3ZnJywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHt2aWV3Qm94OiAnMCAwIDMwMCAzMDAnLCB3aWR0aDogMTQsIGhlaWdodDogMTR9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHsgY3Vyc29yOiAncG9pbnRlcicsIHBhZGRpbmc6ICcwIDdweCAwIDAnfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgncGF0aCcsIHthdHRyczoge2Q6ICdNIDAgMCBMIDAgODUuODEyNSBMIDI3LjAzMTI1IDg1LjgxMjUgQyAzNi42MTc3ODYgNDQuMzQ2MzE2IDY3Ljg3NjU3OSA0Mi4xNzk3OTMgMTA2LjkwNjI1IDQyLjU5Mzc1IEwgMTA2LjkwNjI1IDIyOC4zNzUgQyAxMDcuMzExMDEgMjc5LjA5NjQxIDk4LjkwODM4NiAyNzcuMzM2MDIgNjIuMTI1IDI3Ny41IEwgNjIuMTI1IDI5OS41NjI1IEwgMTQ5IDI5OS41NjI1IEwgMTUwLjAzMTI1IDI5OS41NjI1IEwgMjM2LjkwNjI1IDI5OS41NjI1IEwgMjM2LjkwNjI1IDI3Ny41IEMgMjAwLjEyMjg2IDI3Ny4zMzYgMTkxLjcyMDI0IDI3OS4wOTYzOSAxOTIuMTI1IDIyOC4zNzUgTCAxOTIuMTI1IDQyLjU5Mzc1IEMgMjMxLjE1NDY3IDQyLjE3OTc1IDI2Mi40MTM0NiA0NC4zNDYzMDQgMjcyIDg1LjgxMjUgTCAyOTkuMDMxMjUgODUuODEyNSBMIDI5OS4wMzEyNSAwIEwgMTUwLjAzMTI1IDAgTCAxNDkgMCBMIDAgMCB6JywgZmlsbDogc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCA9PT0gbm9kZUlkID8gJyM1M0IyRUQnOiAnd2hpdGUnfX0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmVkaXRpbmdUaXRsZU5vZGVJZCA9PT0gbm9kZUlkID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGluZ05vZGUoKTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2NvbG9yOiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnIzUzQjJFRCc6ICd3aGl0ZScsIHRyYW5zaXRpb246ICdjb2xvciAwLjJzJ319LCBub2RlLnRpdGxlKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA+IDAgPyBoKCdzdmcnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHt3aWR0aDogNiwgaGVpZ2h0OiA4fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge2Rpc3BsYXk6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICdibG9jayc6ICdub25lJywgY3Vyc29yOiAncG9pbnRlcicsIHBvc2l0aW9uOiAnYWJzb2x1dGUnLCB0b3A6ICcwJywgcmlnaHQ6ICcyNXB4JywgcGFkZGluZzogJzFweCAycHggM3B4IDJweCcsIHRyYW5zZm9ybToncm90YXRlKC05MGRlZyknfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGljazogW01PVkVfVklFV19OT0RFLCBwYXJlbnRSZWYsIHBvc2l0aW9uLCAtMV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtoKCdwb2x5Z29uJywge2F0dHJzOiB7cG9pbnRzOiAnNiw0IDAsMCAyLDQgMCw4JywgZmlsbDogJ3doaXRlJ319KV0pOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPCBzdGF0ZS5kZWZpbml0aW9uW3BhcmVudFJlZi5yZWZdW3BhcmVudElkXS5jaGlsZHJlbi5sZW5ndGgtMSA/IGgoJ3N2ZycsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyczoge3dpZHRoOiA2LCBoZWlnaHQ6IDh9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7ZGlzcGxheTogc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCA9PT0gbm9kZUlkID8gJ2Jsb2NrJzogJ25vbmUnLCBjdXJzb3I6ICdwb2ludGVyJywgcG9zaXRpb246ICdhYnNvbHV0ZScsIGJvdHRvbTogJzAnLCByaWdodDogJzI1cHgnLCBwYWRkaW5nOiAnM3B4IDJweCAxcHggMnB4JywgdHJhbnNmb3JtOidyb3RhdGUoOTBkZWcpJ30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6IFtNT1ZFX1ZJRVdfTk9ERSwgcGFyZW50UmVmLCBwb3NpdGlvbiwgMV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtoKCdwb2x5Z29uJywge2F0dHJzOiB7cG9pbnRzOiAnNiw0IDAsMCAyLDQgMCw4JywgZmlsbDogJ3doaXRlJ319KV0pOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZGlzcGxheTogc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCA9PT0gbm9kZUlkID8gJ2Jsb2NrJzogJ25vbmUnLCBwb3NpdGlvbjogJ2Fic29sdXRlJywgcmlnaHQ6ICc1cHgnLCB0b3A6ICcwJ30sIG9uOiB7Y2xpY2s6IFtERUxFVEVfU0VMRUNURURfVklFVywgbm9kZVJlZiwgcGFyZW50UmVmXX19LCAneCcpXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbGlzdElucHV0Tm9kZShub2RlUmVmLCBwYXJlbnRSZWYsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJZCA9IG5vZGVSZWYuaWRcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50SWQgPSBwYXJlbnRSZWYuaWRcclxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHN0YXRlLmRlZmluaXRpb24udk5vZGVJbnB1dFtub2RlSWRdXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGVkaXRpbmdOb2RlKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2lucHV0Jywge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzUzQjJFRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICdpbnNldCAwIC0xcHggMCAwICM1M0IyRUQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250OiAnaW5oZXJpdCdcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiBbQ0hBTkdFX1ZJRVdfTk9ERV9USVRMRSwgbm9kZVJlZl0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBsaXZlUHJvcHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG5vZGUudGl0bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBhdHRyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhLWlzdGl0bGVlZGl0b3InOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgb246IHtjbGljazogW1ZJRVdfTk9ERV9TRUxFQ1RFRCwgbm9kZVJlZl0sIGRibGNsaWNrOiBbRURJVF9WSUVXX05PREVfVElUTEUsIG5vZGVJZF19XHJcbiAgICAgICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnc3ZnJywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHt2aWV3Qm94OiAnMCAwIDE2IDE2Jywgd2lkdGg6IDE0LCBoZWlnaHQ6IDE0fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7IGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMCA3cHggMCAwJ30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3BhdGgnLCB7YXR0cnM6IHtkOiAnTSAxNSwyIDExLDIgQyAxMC40NDcsMiAxMCwxLjU1MiAxMCwxIDEwLDAuNDQ4IDEwLjQ0NywwIDExLDAgbCA0LDAgYyAwLjU1MywwIDEsMC40NDggMSwxIDAsMC41NTIgLTAuNDQ3LDEgLTEsMSB6IG0gLTIsMTQgYyAtMC41NTMsMCAtMSwtMC40NDcgLTEsLTEgTCAxMiwxIGMgMCwtMC41NTIgMC40NDcsLTEgMSwtMSAwLjU1MywwIDEsMC40NDggMSwxIGwgMCwxNCBjIDAsMC41NTMgLTAuNDQ3LDEgLTEsMSB6IG0gMiwwIC00LDAgYyAtMC41NTMsMCAtMSwtMC40NDcgLTEsLTEgMCwtMC41NTMgMC40NDcsLTEgMSwtMSBsIDQsMCBjIDAuNTUzLDAgMSwwLjQ0NyAxLDEgMCwwLjU1MyAtMC40NDcsMSAtMSwxIHonLCBmaWxsOiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnIzUzQjJFRCc6ICd3aGl0ZSd9fSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdwYXRoJywge2F0dHJzOiB7ZDogJ00gOS44MTE0ODI3LDQuMjM2MDM5MyBDIDkuNjU0NzM1Nyw0LjU4NjU5MDYgOS4zMDM5OTMzLDQuODI5NTg1NCA4Ljg5NTcyMzMsNC44Mjg4Njg0IEwgMS4yOTY4OTI2LDQuODExNTQwNCAxLjMxNjk0MzYsMi44MDY0NDcgOC45MDA2Mzc3LDIuODI4NjQyIGMgMC41NTI0NDgsMC4wMDE2NSAwLjk5OTMwNzQsMC40NTAxMjIzIDAuOTk3NjU2NCwxLjAwMjU2OTggLTIuMWUtNSwwLjE0NDU4NTYgLTAuMDMxMywwLjI4MDY3MzQgLTAuMDg2ODEsMC40MDQ4MjcgeicsIGZpbGw6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJ3doaXRlJ319KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3BhdGgnLCB7YXR0cnM6IHtkOiAnbSA5LjgxMTQ4MjcsMTEuNzM4NTYyIGMgLTAuMTU2NzQ3LDAuMzUwNTUxIC0wLjUwNzQ4OTQsMC41OTM1NDYgLTAuOTE1NzU5NCwwLjU5MjgyOSBsIC03LjU5ODgzMDcsLTAuMDE3MzMgMC4wMjAwNTEsLTIuMDA1MDkzIDcuNTgzNjk0MSwwLjAyMjE5IGMgMC41NTI0NDgsMC4wMDE2IDAuOTk5MzA3NCwwLjQ1MDEyMiAwLjk5NzY1NjQsMS4wMDI1NyAtMi4xZS01LDAuMTQ0NTg1IC0wLjAzMTMsMC4yODA2NzMgLTAuMDg2ODEsMC40MDQ4MjcgeicsIGZpbGw6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJ3doaXRlJ319KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3BhdGgnLCB7YXR0cnM6IHtkOiAnbSAxLjI5NDA1ODMsMTIuMjM5ODM2IDAuMDE3MDQsLTkuNDQ1MDk0NyAxLjk3MTQ4NTIsMC4wMjQ5MjMgLTAuMDIxODE4LDkuNDI2Mjc5NyB6JywgZmlsbDogc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCA9PT0gbm9kZUlkID8gJyM1M0IyRUQnOiAnd2hpdGUnfX0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5lZGl0aW5nVGl0bGVOb2RlSWQgPT09IG5vZGVJZCA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRpbmdOb2RlKCk6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtjb2xvcjogc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCA9PT0gbm9kZUlkID8gJyM1M0IyRUQnOiAnd2hpdGUnLCB0cmFuc2l0aW9uOiAnY29sb3IgMC4ycyd9fSwgbm9kZS50aXRsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPiAwID8gaCgnc3ZnJywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzOiB7d2lkdGg6IDYsIGhlaWdodDogOH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtkaXNwbGF5OiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnYmxvY2snOiAnbm9uZScsIGN1cnNvcjogJ3BvaW50ZXInLCBwb3NpdGlvbjogJ2Fic29sdXRlJywgdG9wOiAnMCcsIHJpZ2h0OiAnMjVweCcsIHBhZGRpbmc6ICcxcHggMnB4IDNweCAycHgnLCB0cmFuc2Zvcm06J3JvdGF0ZSgtOTBkZWcpJ30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6IFtNT1ZFX1ZJRVdfTk9ERSwgcGFyZW50UmVmLCBwb3NpdGlvbiwgLTFdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbaCgncG9seWdvbicsIHthdHRyczoge3BvaW50czogJzYsNCAwLDAgMiw0IDAsOCcsIGZpbGw6ICd3aGl0ZSd9fSldKTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicpLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uIDwgc3RhdGUuZGVmaW5pdGlvbltwYXJlbnRSZWYucmVmXVtwYXJlbnRJZF0uY2hpbGRyZW4ubGVuZ3RoLTEgPyBoKCdzdmcnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHt3aWR0aDogNiwgaGVpZ2h0OiA4fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge2Rpc3BsYXk6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICdibG9jayc6ICdub25lJywgY3Vyc29yOiAncG9pbnRlcicsIHBvc2l0aW9uOiAnYWJzb2x1dGUnLCBib3R0b206ICcwJywgcmlnaHQ6ICcyNXB4JywgcGFkZGluZzogJzNweCAycHggMXB4IDJweCcsIHRyYW5zZm9ybToncm90YXRlKDkwZGVnKSd9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiBbTU9WRV9WSUVXX05PREUsIHBhcmVudFJlZiwgcG9zaXRpb24sIDFdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbaCgncG9seWdvbicsIHthdHRyczoge3BvaW50czogJzYsNCAwLDAgMiw0IDAsOCcsIGZpbGw6ICd3aGl0ZSd9fSldKTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicpLFxyXG4gICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2Rpc3BsYXk6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICdibG9jayc6ICdub25lJywgcG9zaXRpb246ICdhYnNvbHV0ZScsIHJpZ2h0OiAnNXB4JywgdG9wOiAnMCd9LCBvbjoge2NsaWNrOiBbREVMRVRFX1NFTEVDVEVEX1ZJRVcsIG5vZGVSZWYsIHBhcmVudFJlZl19fSwgJ3gnKVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBwcm9wc0NvbXBvbmVudCA9IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHN0YXRlLnNlbGVjdGVkVmlld1N1Yk1lbnUgPT09ICdwcm9wcycgPyAnIzRkNGQ0ZCc6ICcjM2QzZDNkJyxcclxuICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcxMnB4IDE1cHggOHB4JyxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgdG9wOiAnMCcsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiAnNnB4JyxcclxuICAgICAgICAgICAgICAgIHpJbmRleDogc3RhdGUuc2VsZWN0ZWRWaWV3U3ViTWVudSA9PT0gJ3Byb3BzJyA/ICc1MDAnOiAnMCcsXHJcbiAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzE1cHggMTVweCAwIDAnLFxyXG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjMjIyJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlclN0eWxlOiAnc29saWQnLFxyXG4gICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6ICczcHggM3B4IDAgM3B4JyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgIGNsaWNrOiBbU0VMRUNUX1ZJRVdfU1VCTUVOVSwgJ3Byb3BzJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sICdwcm9wcycpXHJcbiAgICAgICAgY29uc3Qgc3R5bGVDb21wb25lbnQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBzdGF0ZS5zZWxlY3RlZFZpZXdTdWJNZW51ID09PSAnc3R5bGUnID8gJyM0ZDRkNGQnOiAnIzNkM2QzZCcsXHJcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMTJweCAxNXB4IDhweCcsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgIHRvcDogJzAnLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogJzkxcHgnLFxyXG4gICAgICAgICAgICAgICAgekluZGV4OiBzdGF0ZS5zZWxlY3RlZFZpZXdTdWJNZW51ID09PSAnc3R5bGUnID8gJzUwMCc6ICcwJyxcclxuICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnMTVweCAxNXB4IDAgMCcsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJyMyMjInLFxyXG4gICAgICAgICAgICAgICAgYm9yZGVyU3R5bGU6ICdzb2xpZCcsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJXaWR0aDogJzNweCAzcHggMCAzcHgnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgY2xpY2s6IFtTRUxFQ1RfVklFV19TVUJNRU5VLCAnc3R5bGUnXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgJ3N0eWxlJylcclxuICAgICAgICBjb25zdCBldmVudHNDb21wb25lbnQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBzdGF0ZS5zZWxlY3RlZFZpZXdTdWJNZW51ID09PSAnZXZlbnRzJyA/ICcjNGQ0ZDRkJzogJyMzZDNkM2QnLFxyXG4gICAgICAgICAgICAgICAgcGFkZGluZzogJzEycHggMTVweCA4cHgnLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICB0b3A6ICcwJyxcclxuICAgICAgICAgICAgICAgIGxlZnQ6ICcxNjVweCcsXHJcbiAgICAgICAgICAgICAgICB6SW5kZXg6IHN0YXRlLnNlbGVjdGVkVmlld1N1Yk1lbnUgPT09ICdldmVudHMnID8gJzUwMCc6ICcwJyxcclxuICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnMTVweCAxNXB4IDAgMCcsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJyMyMjInLFxyXG4gICAgICAgICAgICAgICAgYm9yZGVyU3R5bGU6ICdzb2xpZCcsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJXaWR0aDogJzNweCAzcHggMCAzcHgnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgY2xpY2s6IFtTRUxFQ1RfVklFV19TVUJNRU5VLCAnZXZlbnRzJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sICdldmVudHMnKVxyXG4gICAgICAgIGNvbnN0IHVuc2VsZWN0Q29tcG9uZW50ID0gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyM0ZDRkNGQnLFxyXG4gICAgICAgICAgICAgICAgcGFkZGluZzogJzE1cHggMjNweCA1cHgnLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICB0b3A6ICcwJyxcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiAnMTZweCcsXHJcbiAgICAgICAgICAgICAgICB6SW5kZXg6ICcxMDAnLFxyXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6ICcxNXB4IDE1cHggMCAwJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAnIzIyMicsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJTdHlsZTogJ3NvbGlkJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAnM3B4IDNweCAwIDNweCcsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICBjbGljazogW1VOU0VMRUNUX1ZJRVdfTk9ERV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sICd4JylcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVFZGl0Tm9kZUNvbXBvbmVudCgpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3R5bGVzID0gWydiYWNrZ3JvdW5kJywgJ2JvcmRlcicsICdvdXRsaW5lJywgJ2N1cnNvcicsICdjb2xvcicsICdkaXNwbGF5JywgJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCcsICdwb3NpdGlvbicsICdvdmVyZmxvdycsICdoZWlnaHQnLCAnd2lkdGgnLCAnZm9udCcsICdmb250JywgJ21hcmdpbicsICdwYWRkaW5nJywgJ3VzZXJTZWxlY3QnXVxyXG4gICAgICAgICAgICBjb25zdCBzZWxlY3RlZE5vZGUgPSBzdGF0ZS5kZWZpbml0aW9uW3N0YXRlLnNlbGVjdGVkVmlld05vZGUucmVmXVtzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkXVxyXG4gICAgICAgICAgICBjb25zdCBzZWxlY3RlZFN0eWxlID0gc3RhdGUuZGVmaW5pdGlvbi5zdHlsZVtzZWxlY3RlZE5vZGUuc3R5bGUuaWRdXHJcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlRWRpdG9yQ29tcG9uZW50ID0gaCgnZGl2Jywge3N0eWxlOiB7fX0sXHJcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhzZWxlY3RlZFN0eWxlKS5tYXAoKGtleSk9PmgoJ2RpdicsIFtoKCdpbnB1dCcsIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICdpbnNldCAwIC0xcHggMCAwIHdoaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTYwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46ICcxMHB4JyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BzOiB7dmFsdWU6IHNlbGVjdGVkU3R5bGVba2V5XX0sXHJcbiAgICAgICAgICAgICAgICAgICAgb246IHtpbnB1dDogW0NIQU5HRV9TVFlMRSwgc2VsZWN0ZWROb2RlLnN0eWxlLmlkLCBrZXldfX0pLFxyXG4gICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCBrZXkpXSkpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgY29uc3QgYWRkU3R5bGVDb21wb25lbnQgPSBoKCdkaXYnLCB7c3R5bGU6IHt9fSxcclxuICAgICAgICAgICAgICAgIHN0eWxlc1xyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGtleSk9PiFPYmplY3Qua2V5cyhzZWxlY3RlZFN0eWxlKS5pbmNsdWRlcyhrZXkpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGtleSk9PmgoJ2RpdicsIHtvbjoge2NsaWNrOiBbQUREX0RFRkFVTFRfU1RZTEUsIHNlbGVjdGVkTm9kZS5zdHlsZS5pZCwga2V5XX0sc3R5bGU6e2Rpc3BsYXk6ICdpbmxpbmUtYmxvY2snLCBjdXJzb3I6ICdwb2ludGVyJywgYm9yZGVyUmFkaXVzOiAnNXB4JywgYm9yZGVyOiAnM3B4IHNvbGlkIHdoaXRlJywgcGFkZGluZzogJzVweCcsIG1hcmdpbjogJzVweCd9fSwgJysgJyArIGtleSkpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVQcm9wc01lbnUoKSB7XHJcbiAgICAgICAgICAgICAgICBpZihzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA9PT0gJ3ZOb2RlQm94Jyl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtzdHlsZToge3RleHRBbGlnbjogJ2NlbnRlcicsIG1hcmdpblRvcDogJzEwMHB4JywgY29sb3I6ICcjYmRiZGJkJyB9fSwgJ0NvbXBvbmVudCBoYXMgbm8gcHJvcHMnKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5yZWYgPT09ICd2Tm9kZVRleHQnKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZ1RvcDogJzIwcHgnfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZGlzcGxheTonZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBiYWNrZ3JvdW5kOiAnIzY3Njc2NycsIHBhZGRpbmc6ICc1cHggMTBweCcsIG1hcmdpbkJvdHRvbTogJzEwcHgnfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnMSd9fSwgJ3RleHQgdmFsdWUnKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2ZsZXg6ICcwJywgY3Vyc29yOiAnZGVmYXVsdCcsIGNvbG9yOiAnI2JkYmRiZCd9fSwgJ3RleHQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZzogJzVweCAxMHB4J319LCBbZW1iZXJFZGl0b3Ioc2VsZWN0ZWROb2RlLnZhbHVlLCAndGV4dCcpXSlcclxuICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5yZWYgPT09ICd2Tm9kZUlucHV0Jyl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmdUb3A6ICcyMHB4J319LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2Rpc3BsYXk6J2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgYmFja2dyb3VuZDogJyM2NzY3NjcnLCBwYWRkaW5nOiAnNXB4IDEwcHgnLCBtYXJnaW5Cb3R0b206ICcxMHB4J319LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzEnfX0sICdpbnB1dCB2YWx1ZScpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZmxleDogJzAnLCBjdXJzb3I6ICdkZWZhdWx0JywgY29sb3I6ICcjYmRiZGJkJ319LCAndGV4dCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtwYWRkaW5nOiAnNXB4IDEwcHgnfX0sIFtlbWJlckVkaXRvcihzZWxlY3RlZE5vZGUudmFsdWUsICd0ZXh0JyldKVxyXG4gICAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA9PT0gJ3ZOb2RlTGlzdCcpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7c3R5bGU6IHt0ZXh0QWxpZ246ICdjZW50ZXInLCBtYXJnaW5Ub3A6ICcxMDBweCcsIGNvbG9yOiAnI2JkYmRiZCcgfX0sICdUT0RPIEFERCBQUk9QUycpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA9PT0gJ3ZOb2RlSWYnKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge3N0eWxlOiB7dGV4dEFsaWduOiAnY2VudGVyJywgbWFyZ2luVG9wOiAnMTAwcHgnLCBjb2xvcjogJyNiZGJkYmQnIH19LCAnVE9ETyBBREQgUFJPUFMnKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHByb3BzU3VibWVudUNvbXBvbmVudCA9IGgoJ2RpdicsIFtnZW5lcmF0ZVByb3BzTWVudSgpXSlcclxuICAgICAgICAgICAgY29uc3Qgc3R5bGVTdWJtZW51Q29tcG9uZW50ID0gaCgnZGl2JywgW3N0eWxlRWRpdG9yQ29tcG9uZW50LCBhZGRTdHlsZUNvbXBvbmVudF0pXHJcbiAgICAgICAgICAgIGxldCBhdmFpbGFibGVFdmVudHMgPSBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdvbiBjbGljaycsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiAnY2xpY2snXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnZG91YmxlIGNsaWNrZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogJ2RibGNsaWNrJ1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ21vdXNlIG92ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogJ21vdXNlb3ZlcidcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdtb3VzZSBvdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogJ21vdXNlb3V0J1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICBpZihzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA9PT0gJ3ZOb2RlSW5wdXQnKXtcclxuICAgICAgICAgICAgICAgIGF2YWlsYWJsZUV2ZW50cyA9IGF2YWlsYWJsZUV2ZW50cy5jb25jYXQoW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpbnB1dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogJ2lucHV0J1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2ZvY3VzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiAnZm9jdXMnXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnYmx1cicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogJ2JsdXInXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY3VycmVudEV2ZW50cyA9IGF2YWlsYWJsZUV2ZW50cy5maWx0ZXIoKGV2ZW50KT0+c2VsZWN0ZWROb2RlW2V2ZW50LnByb3BlcnR5TmFtZV0pXHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50c0xlZnQgPSBhdmFpbGFibGVFdmVudHMuZmlsdGVyKChldmVudCk9PiFzZWxlY3RlZE5vZGVbZXZlbnQucHJvcGVydHlOYW1lXSlcclxuICAgICAgICAgICAgY29uc3QgZXZlbnRzU3VibWVudUNvbXBvbmVudCA9IGgoJ2RpdicsIHsgc3R5bGU6IHtwYWRkaW5nVG9wOiAnMjBweCd9fSwgZXZlbnRzTGVmdC5tYXAoKGV2ZW50KT0+XHJcbiAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtkaXNwbGF5OiAnaW5saW5lLWJsb2NrJywgYm9yZGVyOiAnM3B4IHNvbGlkICM1YmNjNWInLCBib3JkZXJSYWRpdXM6ICc1cHgnLCBjdXJzb3I6ICdwb2ludGVyJywgcGFkZGluZzogJzVweCcsIG1hcmdpbjogJzEwcHgnfSwgb246e2NsaWNrOiBbQUREX0VWRU5ULCBldmVudC5wcm9wZXJ0eU5hbWVdfX0sICcrICcgKyBldmVudC5kZXNjcmlwdGlvbiksXHJcbiAgICAgICAgICAgICkuY29uY2F0KGN1cnJlbnRFdmVudHMubGVuZ3RoID9cclxuICAgICAgICAgICAgICAgIGN1cnJlbnRFdmVudHMubWFwKChldmVudCk9PlxyXG4gICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7YmFja2dyb3VuZDogJyM2NzY3NjcnLCBwYWRkaW5nOiAnNXB4IDEwcHgnfX0sIGV2ZW50LmRlc2NyaXB0aW9uKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2NvbG9yOiBzdGF0ZS5hY3RpdmVFdmVudCA9PT0gc2VsZWN0ZWROb2RlW2V2ZW50LnByb3BlcnR5TmFtZV0uaWQgPyAnIzViY2M1Yic6ICd3aGl0ZScsIHRyYW5zaXRpb246ICdjb2xvciAwLjJzJywgZm9udFNpemU6ICcwLjhlbScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnNXB4IDEwcHgnLCBib3hTaGFkb3c6IHN0YXRlLnNlbGVjdGVkRXZlbnRJZCA9PT0gc2VsZWN0ZWROb2RlW2V2ZW50LnByb3BlcnR5TmFtZV0uaWQgPyAnIzViY2M1YiA1cHggMCAwcHggMHB4IGluc2V0JzogJ25vbmUnfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGljazogW1NFTEVDVF9FVkVOVCwgc2VsZWN0ZWROb2RlW2V2ZW50LnByb3BlcnR5TmFtZV0uaWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYmxjbGljazogW0VESVRfRVZFTlRfVElUTEUsIHNlbGVjdGVkTm9kZVtldmVudC5wcm9wZXJ0eU5hbWVdLmlkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge30sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+KAoiAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5lZGl0aW5nVGl0bGVOb2RlSWQgPT09IHNlbGVjdGVkTm9kZVtldmVudC5wcm9wZXJ0eU5hbWVdLmlkID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2lucHV0Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiAnaW5zZXQgMCAtMXB4IDAgMCB3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAgJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250OiAnaW5oZXJpdCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiBbQ0hBTkdFX0VWRU5UX1RJVExFLCBzZWxlY3RlZE5vZGVbZXZlbnQucHJvcGVydHlOYW1lXS5pZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXZlUHJvcHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHN0YXRlLmRlZmluaXRpb24uZXZlbnRbc2VsZWN0ZWROb2RlW2V2ZW50LnByb3BlcnR5TmFtZV0uaWRdLnRpdGxlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YS1pc3RpdGxlZWRpdG9yJzogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHN0YXRlLmRlZmluaXRpb24uZXZlbnRbc2VsZWN0ZWROb2RlW2V2ZW50LnByb3BlcnR5TmFtZV0uaWRdLnRpdGxlXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgIF0pKSA6XHJcbiAgICAgICAgICAgICAgICBbXSkpXHJcbiAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6ICctOHB4JyxcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUoLTEwMCUsIDApJyxcclxuICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzhweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tOiAnNnB4JyxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICc1MCUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICAgICBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZmxleDogJzEnLCBtYXhIZWlnaHQ6ICc0M3B4JywgbWluSGVpZ2h0OiAnNDNweCcsIHBvc2l0aW9uOiAncmVsYXRpdmUnLCBtYXJnaW5Ub3A6ICc2cHgnfX0sIFtldmVudHNDb21wb25lbnQsIHN0eWxlQ29tcG9uZW50LCBwcm9wc0NvbXBvbmVudCwgdW5zZWxlY3RDb21wb25lbnRdKSxcclxuICAgICAgICAgICAgICAgIGgoJ2RpdicsIHthdHRyczoge2NsYXNzOiAnYmV0dGVyLXNjcm9sbGJhcid9LCBzdHlsZToge2ZsZXg6ICcxJywgb3ZlcmZsb3c6ICdhdXRvJywgYmFja2dyb3VuZDogJyM0ZDRkNGQnLCBib3JkZXJSYWRpdXM6ICcxMHB4Jywgd2lkdGg6IHN0YXRlLnN1YkVkaXRvcldpZHRoICsgJ3B4JywgYm9yZGVyOiAnM3B4IHNvbGlkICMyMjInfX0sW1xyXG4gICAgICAgICAgICAgICAgICAgIGRyYWdTdWJDb21wb25lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2VsZWN0ZWRWaWV3U3ViTWVudSA9PT0gJ3Byb3BzJyA/IHByb3BzU3VibWVudUNvbXBvbmVudDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2VsZWN0ZWRWaWV3U3ViTWVudSA9PT0gJ3N0eWxlJyA/IHN0eWxlU3VibWVudUNvbXBvbmVudDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLnNlbGVjdGVkVmlld1N1Yk1lbnUgPT09ICdldmVudHMnID8gZXZlbnRzU3VibWVudUNvbXBvbmVudDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywgJ0Vycm9yLCBubyBzdWNoIG1lbnUnKVxyXG4gICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgXSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXdDb21wb25lbnQgPSBoKCdkaXYnLCB7YXR0cnM6IHtjbGFzczogJ2JldHRlci1zY3JvbGxiYXInfSwgc3R5bGU6IHtvdmVyZmxvdzogJ2F1dG8nLCBwb3NpdGlvbjogJ3JlbGF0aXZlJywgZmxleDogJzEnLCBib3JkZXJUb3A6ICczcHggc29saWQgIzIyMicsIHBhZGRpbmc6ICc2cHggOHB4J30sIG9uOiB7Y2xpY2s6IFtVTlNFTEVDVF9WSUVXX05PREVdfX0sIFtcclxuICAgICAgICAgICAgbGlzdEJveE5vZGUoe3JlZjogJ3ZOb2RlQm94JywgaWQ6J19yb290Tm9kZSd9LCB7fSksXHJcbiAgICAgICAgXSlcclxuXHJcbiAgICAgICAgY29uc3QgcmlnaHRDb21wb25lbnQgPVxyXG4gICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICAgICBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcclxuICAgICAgICAgICAgICAgICAgICB0b3A6ICcwJyxcclxuICAgICAgICAgICAgICAgICAgICByaWdodDogJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnd2hpdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbnQ6IFwiMzAwIDEuMmVtICdPcGVuIFNhbnMnXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbGluZUhlaWdodDogJzEuMmVtJyxcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogc3RhdGUuZWRpdG9yUmlnaHRXaWR0aCArICdweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyM0ZDRkNGQnLFxyXG4gICAgICAgICAgICAgICAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyTGVmdDogJzNweCBzb2xpZCAjMjIyJyxcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnMC41cyB0cmFuc2Zvcm0nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc3RhdGUucmlnaHRPcGVuID8gJ3RyYW5zbGF0ZVooMCkgdHJhbnNsYXRlWCgwJSknOiAndHJhbnNsYXRlWigwKSB0cmFuc2xhdGVYKDEwMCUpJyxcclxuICAgICAgICAgICAgICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgICBkcmFnQ29tcG9uZW50UmlnaHQsXHJcbiAgICAgICAgICAgICAgICBzdGF0ZUNvbXBvbmVudCxcclxuICAgICAgICAgICAgICAgIHZpZXdDb21wb25lbnQsXHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA/IGdlbmVyYXRlRWRpdE5vZGVDb21wb25lbnQoKTogaCgnc3BhbicpXHJcbiAgICAgICAgICAgIF0pXHJcblxyXG5cclxuICAgICAgICBjb25zdCB0b3BDb21wb25lbnQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBmbGV4OiAnMSBhdXRvJyxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJzc1cHgnLFxyXG4gICAgICAgICAgICAgICAgbWF4SGVpZ2h0OiAnNzVweCcsXHJcbiAgICAgICAgICAgICAgICBtaW5IZWlnaHQ6ICc3NXB4JyxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjMjIyJyxcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6J2ZsZXgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIGgoJ2EnLCB7c3R5bGU6IHtmbGV4OiAnMCBhdXRvJywgd2lkdGg6ICcxOTBweCcsIHRleHREZWNvcmF0aW9uOiAnaW5oZXJpdCcsIHVzZXJTZWxlY3Q6ICdub25lJ30sIGF0dHJzOiB7aHJlZjonL19kZXYnfX0sIFtcclxuICAgICAgICAgICAgICAgIGgoJ2ltZycse3N0eWxlOiB7IG1hcmdpbjogJzdweCAtMnB4IC0zcHggNXB4JywgZGlzcGxheTogJ2lubGluZS1ibG9jayd9LCBhdHRyczoge3NyYzogJy9pbWFnZXMvbG9nbzI1NngyNTYucG5nJywgaGVpZ2h0OiAnNTcnfX0pLFxyXG4gICAgICAgICAgICAgICAgaCgnc3Bhbicse3N0eWxlOiB7IGZvbnRTaXplOic0NHB4JywgZm9udEZhbWlseTogXCInQ29tZm9ydGFhJywgc2Fucy1zZXJpZlwiLCB2ZXJ0aWNhbEFsaWduOiAnYm90dG9tJywgY29sb3I6ICcjZmZmJ319LCAndWduaXMnKVxyXG4gICAgICAgICAgICBdKSxcclxuICAgICAgICBdKVxyXG4gICAgICAgIGNvbnN0IGxlZnRDb21wb25lbnQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxyXG4gICAgICAgICAgICAgICAgdG9wOiAnMCcsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiAnMCcsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnd2hpdGUnLFxyXG4gICAgICAgICAgICAgICAgZm9udDogXCIzMDAgMS4yZW0gJ09wZW4gU2FucydcIixcclxuICAgICAgICAgICAgICAgIGxpbmVIZWlnaHQ6ICcxLjJlbScsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogc3RhdGUuZWRpdG9yTGVmdFdpZHRoICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjNGQ0ZDRkJyxcclxuICAgICAgICAgICAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJSaWdodDogJzNweCBzb2xpZCAjMjIyJyxcclxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICcwLjVzIHRyYW5zZm9ybScsXHJcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHN0YXRlLmxlZnRPcGVuID8gJ3RyYW5zbGF0ZVooMCkgdHJhbnNsYXRlWCgwJSknOiAndHJhbnNsYXRlWigwKSB0cmFuc2xhdGVYKC0xMDAlKScsXHJcbiAgICAgICAgICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICBkcmFnQ29tcG9uZW50TGVmdCxcclxuICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICBjbGljazogRlJFRVpFUl9DTElDS0VEXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBmbGV4OiAnMCBhdXRvJyxcclxuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMTBweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzMzMycsXHJcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7IHBhZGRpbmc6ICcxNXB4IDE1cHggMTBweCAxNXB4JywgY29sb3I6IHN0YXRlLmFwcElzRnJvemVuID8gJ3JnYig5MSwgMjA0LCA5MSknIDogJ3JnYigyMDQsIDkxLCA5MSknfX0sIHN0YXRlLmFwcElzRnJvemVuID8gJ+KWuicgOiAn4p2a4p2aJyksXHJcbiAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHtjbGFzczogJ2JldHRlci1zY3JvbGxiYXInfSxcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAnMSBhdXRvJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzEwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2F1dG8nXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGV2ZW50U3RhY2tcclxuICAgICAgICAgICAgICAgICAgICAubWFwKChhKT0+YSlcclxuICAgICAgICAgICAgICAgICAgICAucmV2ZXJzZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcChldmVudCA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHsgcGFkZGluZzogJzVweCcsIGNvbG9yOiAnI2ZmZmZmZid9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZGVmaW5pdGlvbi5ldmVudFtldmVudC5ldmVudE5hbWVdLnRpdGxlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2JywgT2JqZWN0LmtleXMoZXZlbnQubXV0YXRpb25zKS5tYXAoc3RhdGVJZCA9PiBzdGF0ZS5kZWZpbml0aW9uLnN0YXRlW3N0YXRlSWRdLnRpdGxlICsgJzogJyArIGV2ZW50Lm11dGF0aW9uc1tzdGF0ZUlkXS50b1N0cmluZygpKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICBdKVxyXG4gICAgICAgIGNvbnN0IHJlbmRlclZpZXdDb21wb25lbnQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBmbGV4OiAnMSBhdXRvJyxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGBcclxuICAgICAgICAgICAgICAgICAgICByYWRpYWwtZ3JhZGllbnQoYmxhY2sgNSUsIHRyYW5zcGFyZW50IDE2JSkgMCAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHJhZGlhbC1ncmFkaWVudChibGFjayA1JSwgdHJhbnNwYXJlbnQgMTYlKSA4cHggOHB4LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhZGlhbC1ncmFkaWVudChyZ2JhKDI1NSwyNTUsMjU1LC4xKSA1JSwgdHJhbnNwYXJlbnQgMjAlKSAwIDFweCxcclxuICAgICAgICAgICAgICAgICAgICByYWRpYWwtZ3JhZGllbnQocmdiYSgyNTUsMjU1LDI1NSwuMSkgNSUsIHRyYW5zcGFyZW50IDIwJSkgOHB4IDlweGAsXHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6JyMzMzMnLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZFNpemU6JzE2cHggMTZweCcsXHJcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVaKDApJyxcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6J3JlbGF0aXZlJyxcclxuICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6ICgoKT0+e1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVzaXJlZFdpZHRoID0gMTkyMFxyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVzaXJlZEhlaWdodCA9IDEwODBcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRvcE1lbnVIZWlnaHQgPSA3NVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgd2lkdGhMZWZ0ID0gd2luZG93LmlubmVyV2lkdGggLSAoc3RhdGUuZWRpdG9yTGVmdFdpZHRoICsgc3RhdGUuZWRpdG9yUmlnaHRXaWR0aClcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhlaWdodExlZnQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSB0b3BNZW51SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBsZXQgc2NhbGVYID0gd2lkdGhMZWZ0IDwgZGVzaXJlZFdpZHRoID8gd2lkdGhMZWZ0L2Rlc2lyZWRXaWR0aDogMVxyXG4gICAgICAgICAgICAgICAgbGV0IHNjYWxlWSA9IGhlaWdodExlZnQgPCBkZXNpcmVkSGVpZ2h0ID8gaGVpZ2h0TGVmdC9kZXNpcmVkSGVpZ2h0OiAxXHJcbiAgICAgICAgICAgICAgICBpZihzY2FsZVggPiBzY2FsZVkpIHtcclxuICAgICAgICAgICAgICAgICAgICBzY2FsZVggPSBzY2FsZVlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NhbGVZID0gc2NhbGVYXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBkZXNpcmVkV2lkdGggKydweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBkZXNpcmVkSGVpZ2h0ICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnI2ZmZmZmZicsXHJcbiAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiAncmdiYSgwLCAwLCAwLCAwLjI0NzA1OSkgMHB4IDE0cHggNDVweCwgcmdiYSgwLCAwLCAwLCAwLjIxOTYwOCkgMHB4IDEwcHggMThweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlWigwKSBzY2FsZSgnKyBzY2FsZVggKyAnLCcrIHNjYWxlWSArJyknLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvcDogKGhlaWdodExlZnQtZGVzaXJlZEhlaWdodCkvMiArICdweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogKHdpZHRoTGVmdC1kZXNpcmVkV2lkdGgpLzIrc3RhdGUuZWRpdG9yTGVmdFdpZHRoICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkoKX0sIFtcclxuICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2JhY2tncm91bmQ6ICcjOTNkMWY3Jywgd2lkdGg6ICcxMDAlJywgaGVpZ2h0OiAnNDBweCcsIHBvc2l0aW9uOidhYnNvbHV0ZScsIHRvcDogJy00MHB4JywgZGlzcGxheTogJ2ZsZXgnLCBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBsZWZ0OiAnMCcsIGJvcmRlclJhZGl1czogJzVweCA1cHggMCAwJywgYm94U2hhZG93OiAnaW5zZXQgMCAtM3B4IDAgMCAjYjdiN2I3J319LCAndG9kbzogdXJsLCB3aWR0aCBhbmQgaGVpZ2h0LCBjbG9zZSBidXR0b24nKSxcclxuICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge292ZXJmbG93OiAnYXV0bycsIHdpZHRoOiAnMTAwJScsIGhlaWdodDogJzEwMCUnfX0sIFthcHAudmRvbV0pXHJcbiAgICAgICAgICAgIF0pXHJcbiAgICAgICAgXSlcclxuICAgICAgICBjb25zdCBtYWluUm93Q29tcG9uZW50ID0gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgZmxleDogJzEnLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXHJcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVaKDApJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIHJlbmRlclZpZXdDb21wb25lbnQsXHJcbiAgICAgICAgICAgIGxlZnRDb21wb25lbnQsXHJcbiAgICAgICAgICAgIHJpZ2h0Q29tcG9uZW50XHJcbiAgICAgICAgXSlcclxuICAgICAgICBjb25zdCB2bm9kZSA9IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdmaXhlZCcsXHJcbiAgICAgICAgICAgICAgICB0b3A6ICcwJyxcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiAnMCcsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwMHZ3JyxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJzEwMHZoJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIHRvcENvbXBvbmVudCxcclxuICAgICAgICAgICAgbWFpblJvd0NvbXBvbmVudCxcclxuICAgICAgICBdKVxyXG5cclxuICAgICAgICBub2RlID0gcGF0Y2gobm9kZSwgdm5vZGUpXHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKClcclxufSIsImZ1bmN0aW9uIHVwZGF0ZVByb3BzKG9sZFZub2RlLCB2bm9kZSkge1xyXG4gICAgdmFyIGtleSwgY3VyLCBvbGQsIGVsbSA9IHZub2RlLmVsbSxcclxuICAgICAgICBwcm9wcyA9IHZub2RlLmRhdGEubGl2ZVByb3BzIHx8IHt9O1xyXG4gICAgZm9yIChrZXkgaW4gcHJvcHMpIHtcclxuICAgICAgICBjdXIgPSBwcm9wc1trZXldO1xyXG4gICAgICAgIG9sZCA9IGVsbVtrZXldO1xyXG4gICAgICAgIGlmIChvbGQgIT09IGN1cikgZWxtW2tleV0gPSBjdXI7XHJcbiAgICB9XHJcbn1cclxuY29uc3QgbGl2ZVByb3BzUGx1Z2luID0ge2NyZWF0ZTogdXBkYXRlUHJvcHMsIHVwZGF0ZTogdXBkYXRlUHJvcHN9O1xyXG5pbXBvcnQgc25hYmJkb20gZnJvbSAnc25hYmJkb20nXHJcbmNvbnN0IHBhdGNoID0gc25hYmJkb20uaW5pdChbXHJcbiAgICByZXF1aXJlKCdzbmFiYmRvbS9tb2R1bGVzL2NsYXNzJyksXHJcbiAgICByZXF1aXJlKCdzbmFiYmRvbS9tb2R1bGVzL3Byb3BzJyksXHJcbiAgICByZXF1aXJlKCdzbmFiYmRvbS9tb2R1bGVzL3N0eWxlJyksXHJcbiAgICByZXF1aXJlKCdzbmFiYmRvbS9tb2R1bGVzL2V2ZW50bGlzdGVuZXJzJyksXHJcbiAgICByZXF1aXJlKCdzbmFiYmRvbS9tb2R1bGVzL2F0dHJpYnV0ZXMnKSxcclxuICAgIGxpdmVQcm9wc1BsdWdpblxyXG5dKTtcclxuaW1wb3J0IGggZnJvbSAnc25hYmJkb20vaCc7XHJcbmltcG9ydCBiaWcgZnJvbSAnYmlnLmpzJztcclxuXHJcbmZ1bmN0aW9uIGZsYXR0ZW4oYXJyKSB7XHJcbiAgICByZXR1cm4gYXJyLnJlZHVjZShmdW5jdGlvbiAoZmxhdCwgdG9GbGF0dGVuKSB7XHJcbiAgICAgICAgcmV0dXJuIGZsYXQuY29uY2F0KEFycmF5LmlzQXJyYXkodG9GbGF0dGVuKSA/IGZsYXR0ZW4odG9GbGF0dGVuKSA6IHRvRmxhdHRlbik7XHJcbiAgICB9LCBbXSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IChkZWZpbml0aW9uKSA9PiB7XHJcblxyXG4gICAgbGV0IGN1cnJlbnRTdGF0ZSA9IE9iamVjdC5rZXlzKGRlZmluaXRpb24uc3RhdGUpLm1hcChrZXk9PmRlZmluaXRpb24uc3RhdGVba2V5XSkucmVkdWNlKChhY2MsIGRlZik9PiB7XHJcbiAgICAgICAgYWNjW2RlZi5yZWZdID0gZGVmLmRlZmF1bHRWYWx1ZVxyXG4gICAgICAgIHJldHVybiBhY2NcclxuICAgIH0sIHt9KVxyXG5cclxuICAgIC8vIEFsbG93cyBzdG9waW5nIGFwcGxpY2F0aW9uIGluIGRldmVsb3BtZW50LiBUaGlzIGlzIG5vdCBhbiBhcHBsaWNhdGlvbiBzdGF0ZVxyXG4gICAgbGV0IGZyb3plbiA9IGZhbHNlXHJcbiAgICBsZXQgZnJvemVuQ2FsbGJhY2sgPSBudWxsXHJcbiAgICBsZXQgc2VsZWN0SG92ZXJBY3RpdmUgPSBmYWxzZVxyXG4gICAgbGV0IHNlbGVjdGVkTm9kZUluRGV2ZWxvcG1lbnQgPSB7fVxyXG5cclxuICAgIGZ1bmN0aW9uIHNlbGVjdE5vZGVIb3ZlcihyZWYsIGUpIHtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXHJcbiAgICAgICAgc2VsZWN0ZWROb2RlSW5EZXZlbG9wbWVudCA9IHJlZlxyXG4gICAgICAgIGZyb3plbkNhbGxiYWNrKHJlZilcclxuICAgICAgICByZW5kZXIoKVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gc2VsZWN0Tm9kZUNsaWNrKHJlZiwgZSkge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcclxuICAgICAgICBzZWxlY3RIb3ZlckFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgc2VsZWN0ZWROb2RlSW5EZXZlbG9wbWVudCA9IHJlZlxyXG4gICAgICAgIGZyb3plbkNhbGxiYWNrKHJlZilcclxuICAgICAgICByZW5kZXIoKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGdsb2JhbCBzdGF0ZSBmb3IgcmVzb2x2ZXJcclxuICAgIGxldCBjdXJyZW50RXZlbnQgPSBudWxsXHJcbiAgICBsZXQgY3VycmVudE1hcFZhbHVlID0ge31cclxuICAgIGxldCBjdXJyZW50TWFwSW5kZXggPSB7fVxyXG4gICAgbGV0IGV2ZW50RGF0YSA9IHt9XHJcbiAgICBmdW5jdGlvbiByZXNvbHZlKHJlZil7XHJcbiAgICAgICAgaWYocmVmID09PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gc3RhdGljIHZhbHVlIChzdHJpbmcvbnVtYmVyKVxyXG4gICAgICAgIGlmKHJlZi5yZWYgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIHJldHVybiByZWZcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZGVmID0gZGVmaW5pdGlvbltyZWYucmVmXVtyZWYuaWRdXHJcbiAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdwaXBlJykge1xyXG4gICAgICAgICAgICByZXR1cm4gcGlwZShyZWYpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZWYucmVmID09PSAnY29uZGl0aW9uYWwnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGRlZi5wcmVkaWNhdGUpID8gcmVzb2x2ZShkZWYudGhlbikgOiByZXNvbHZlKGRlZi5lbHNlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ3N0YXRlJykge1xyXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFN0YXRlW3JlZi5pZF1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZi5yZWYgPT09ICd2Tm9kZUJveCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJveE5vZGUocmVmKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ3ZOb2RlVGV4dCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRleHROb2RlKHJlZilcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZi5yZWYgPT09ICd2Tm9kZUlucHV0Jykge1xyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXROb2RlKHJlZilcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZi5yZWYgPT09ICd2Tm9kZUxpc3QnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBsaXN0Tm9kZShyZWYpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZWYucmVmID09PSAndk5vZGVJZicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlmTm9kZShyZWYpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZWYucmVmID09PSAnc3R5bGUnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhkZWYpLnJlZHVjZSgoYWNjLCB2YWwpPT4ge1xyXG4gICAgICAgICAgICAgICAgYWNjW3ZhbF0gPSByZXNvbHZlKGRlZlt2YWxdKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY1xyXG4gICAgICAgICAgICB9LCB7fSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdldmVudERhdGEnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBldmVudERhdGFbcmVmLmlkXVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ2xpc3RWYWx1ZScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRNYXBWYWx1ZVtkZWYubGlzdC5pZF1bZGVmLnByb3BlcnR5XVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBFcnJvcihyZWYpXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJhbnNmb3JtVmFsdWUodmFsdWUsIHRyYW5zZm9ybWF0aW9ucyl7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRyYW5zZm9ybWF0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCByZWYgPSB0cmFuc2Zvcm1hdGlvbnNbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybWVyID0gZGVmaW5pdGlvbltyZWYucmVmXVtyZWYuaWRdXHJcbiAgICAgICAgICAgIGlmIChyZWYucmVmID09PSAnZXF1YWwnKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wYXJlVmFsdWUgPSByZXNvbHZlKHRyYW5zZm9ybWVyLnZhbHVlKVxyXG4gICAgICAgICAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBiaWcgfHwgY29tcGFyZVZhbHVlIGluc3RhbmNlb2YgYmlnKXtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGJpZyh2YWx1ZSkuZXEoY29tcGFyZVZhbHVlKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgPT09IGNvbXBhcmVWYWx1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZWYucmVmID09PSAnYWRkJykge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBiaWcodmFsdWUpLnBsdXMocmVzb2x2ZSh0cmFuc2Zvcm1lci52YWx1ZSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdzdWJ0cmFjdCcpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gYmlnKHZhbHVlKS5taW51cyhyZXNvbHZlKHRyYW5zZm9ybWVyLnZhbHVlKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ211bHRpcGx5Jykge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBiaWcodmFsdWUpLnRpbWVzKHJlc29sdmUodHJhbnNmb3JtZXIudmFsdWUpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZWYucmVmID09PSAnZGl2aWRlJykge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBiaWcodmFsdWUpLmRpdihyZXNvbHZlKHRyYW5zZm9ybWVyLnZhbHVlKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ3JlbWFpbmRlcicpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gYmlnKHZhbHVlKS5tb2QocmVzb2x2ZSh0cmFuc2Zvcm1lci52YWx1ZSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdicmFuY2gnKSB7XHJcbiAgICAgICAgICAgICAgICBpZihyZXNvbHZlKHRyYW5zZm9ybWVyLnByZWRpY2F0ZSkpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdHJhbnNmb3JtVmFsdWUodmFsdWUsIHRyYW5zZm9ybWVyLnRoZW4pXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdHJhbnNmb3JtVmFsdWUodmFsdWUsIHRyYW5zZm9ybWVyLmVsc2UpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdqb2luJykge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5jb25jYXQocmVzb2x2ZSh0cmFuc2Zvcm1lci52YWx1ZSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJlZi5yZWYgPT09ICd0b1VwcGVyQ2FzZScpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9VcHBlckNhc2UoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZWYucmVmID09PSAndG9Mb3dlckNhc2UnKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ3RvVGV4dCcpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwaXBlKHJlZikge1xyXG4gICAgICAgIGNvbnN0IGRlZiA9IGRlZmluaXRpb25bcmVmLnJlZl1bcmVmLmlkXVxyXG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1WYWx1ZShyZXNvbHZlKGRlZi52YWx1ZSksIGRlZi50cmFuc2Zvcm1hdGlvbnMpXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYm94Tm9kZShyZWYpIHtcclxuICAgICAgICBjb25zdCBub2RlID0gZGVmaW5pdGlvbltyZWYucmVmXVtyZWYuaWRdXHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHtcclxuICAgICAgICAgICAgc3R5bGU6IGZyb3plbiAmJiBzZWxlY3RlZE5vZGVJbkRldmVsb3BtZW50LmlkID09PSByZWYuaWQgPyB7Li4ucmVzb2x2ZShub2RlLnN0eWxlKSwgdHJhbnNpdGlvbjonb3V0bGluZSAwLjFzJyxvdXRsaW5lOiAnM3B4IHNvbGlkICMzNTkwZGYnfSA6IHJlc29sdmUobm9kZS5zdHlsZSksXHJcbiAgICAgICAgICAgIG9uOiBmcm96ZW4gP1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlb3Zlcjogc2VsZWN0SG92ZXJBY3RpdmUgPyBbc2VsZWN0Tm9kZUhvdmVyLCByZWZdOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6IFtzZWxlY3ROb2RlQ2xpY2ssIHJlZl1cclxuICAgICAgICAgICAgICAgIH06e1xyXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBub2RlLmNsaWNrID8gW2VtaXRFdmVudCwgbm9kZS5jbGlja10gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZGJsY2xpY2s6IG5vZGUuZGJsY2xpY2sgPyBbZW1pdEV2ZW50LCBub2RlLmRibGNsaWNrXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBtb3VzZW92ZXI6IG5vZGUubW91c2VvdmVyID8gW2VtaXRFdmVudCwgbm9kZS5tb3VzZW92ZXJdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlb3V0OiBub2RlLm1vdXNlb3V0ID8gW2VtaXRFdmVudCwgbm9kZS5tb3VzZW91dF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaCgnZGl2JywgZGF0YSwgZmxhdHRlbihub2RlLmNoaWxkcmVuLm1hcChyZXNvbHZlKSkpXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaWZOb2RlKHJlZikge1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSBkZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF1cclxuICAgICAgICByZXR1cm4gcmVzb2x2ZShub2RlLnZhbHVlKSA/IG5vZGUuY2hpbGRyZW4ubWFwKHJlc29sdmUpOiBbXVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRleHROb2RlKHJlZikge1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSBkZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF1cclxuICAgICAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICAgICAgICBzdHlsZTogZnJvemVuICYmIHNlbGVjdGVkTm9kZUluRGV2ZWxvcG1lbnQuaWQgPT09IHJlZi5pZCA/IHsuLi5yZXNvbHZlKG5vZGUuc3R5bGUpLCB0cmFuc2l0aW9uOidvdXRsaW5lIDAuMXMnLG91dGxpbmU6ICczcHggc29saWQgIzM1OTBkZid9IDogcmVzb2x2ZShub2RlLnN0eWxlKSxcclxuICAgICAgICAgICAgb246IGZyb3plbiA/XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW91c2VvdmVyOiBzZWxlY3RIb3ZlckFjdGl2ZSA/IFtzZWxlY3ROb2RlSG92ZXIsIHJlZl06IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBjbGljazogW3NlbGVjdE5vZGVDbGljaywgcmVmXVxyXG4gICAgICAgICAgICAgICAgfTp7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6IG5vZGUuY2xpY2sgPyBbZW1pdEV2ZW50LCBub2RlLmNsaWNrXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBkYmxjbGljazogbm9kZS5kYmxjbGljayA/IFtlbWl0RXZlbnQsIG5vZGUuZGJsY2xpY2tdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlb3Zlcjogbm9kZS5tb3VzZW92ZXIgPyBbZW1pdEV2ZW50LCBub2RlLm1vdXNlb3Zlcl0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgbW91c2VvdXQ6IG5vZGUubW91c2VvdXQgPyBbZW1pdEV2ZW50LCBub2RlLm1vdXNlb3V0XSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBoKCdzcGFuJywgZGF0YSwgcmVzb2x2ZShub2RlLnZhbHVlKSlcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpbnB1dE5vZGUocmVmKSB7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IGRlZmluaXRpb25bcmVmLnJlZl1bcmVmLmlkXVxyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgICAgIHN0eWxlOiBmcm96ZW4gJiYgc2VsZWN0ZWROb2RlSW5EZXZlbG9wbWVudC5pZCA9PT0gcmVmLmlkID8gey4uLnJlc29sdmUobm9kZS5zdHlsZSksIHRyYW5zaXRpb246J291dGxpbmUgMC4xcycsb3V0bGluZTogJzNweCBzb2xpZCAjMzU5MGRmJ30gOiByZXNvbHZlKG5vZGUuc3R5bGUpLFxyXG4gICAgICAgICAgICBvbjogZnJvemVuID9cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBtb3VzZW92ZXI6IHNlbGVjdEhvdmVyQWN0aXZlID8gW3NlbGVjdE5vZGVIb3ZlciwgcmVmXTogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBbc2VsZWN0Tm9kZUNsaWNrLCByZWZdXHJcbiAgICAgICAgICAgICAgICB9OntcclxuICAgICAgICAgICAgICAgICAgICBjbGljazogbm9kZS5jbGljayA/IFtlbWl0RXZlbnQsIG5vZGUuY2xpY2tdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIGlucHV0OiBub2RlLmlucHV0ID8gW2VtaXRFdmVudCwgbm9kZS5pbnB1dF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZGJsY2xpY2s6IG5vZGUuZGJsY2xpY2sgPyBbZW1pdEV2ZW50LCBub2RlLmRibGNsaWNrXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBtb3VzZW92ZXI6IG5vZGUubW91c2VvdmVyID8gW2VtaXRFdmVudCwgbm9kZS5tb3VzZW92ZXJdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlb3V0OiBub2RlLm1vdXNlb3V0ID8gW2VtaXRFdmVudCwgbm9kZS5tb3VzZW91dF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZm9jdXM6IG5vZGUuZm9jdXMgPyBbZW1pdEV2ZW50LCBub2RlLmZvY3VzXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBibHVyOiBub2RlLmJsdXIgPyBbZW1pdEV2ZW50LCBub2RlLmJsdXJdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJvcHM6IHtcclxuICAgICAgICAgICAgICAgIHZhbHVlOiByZXNvbHZlKG5vZGUudmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6IG5vZGUucGxhY2Vob2xkZXJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaCgnaW5wdXQnLCBkYXRhKVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGxpc3ROb2RlKHJlZikge1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSBkZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF1cclxuICAgICAgICBjb25zdCBsaXN0ID0gcmVzb2x2ZShub2RlLnZhbHVlKVxyXG5cclxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IE9iamVjdC5rZXlzKGxpc3QpLm1hcChrZXk9Pmxpc3Rba2V5XSkubWFwKCh2YWx1ZSwgaW5kZXgpPT4ge1xyXG4gICAgICAgICAgICBjdXJyZW50TWFwVmFsdWVbcmVmLmlkXSA9IHZhbHVlXHJcbiAgICAgICAgICAgIGN1cnJlbnRNYXBJbmRleFtyZWYuaWRdID0gaW5kZXhcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBub2RlLmNoaWxkcmVuLm1hcChyZXNvbHZlKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZGVsZXRlIGN1cnJlbnRNYXBWYWx1ZVtyZWYuaWRdO1xyXG4gICAgICAgIGRlbGV0ZSBjdXJyZW50TWFwSW5kZXhbcmVmLmlkXTtcclxuXHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHtcclxuICAgICAgICAgICAgc3R5bGU6IGZyb3plbiAmJiBzZWxlY3RlZE5vZGVJbkRldmVsb3BtZW50LmlkID09PSByZWYuaWQgPyB7Li4ucmVzb2x2ZShub2RlLnN0eWxlKSwgdHJhbnNpdGlvbjonb3V0bGluZSAwLjFzJyxvdXRsaW5lOiAnM3B4IHNvbGlkICMzNTkwZGYnfSA6IHJlc29sdmUobm9kZS5zdHlsZSksXHJcbiAgICAgICAgICAgIG9uOiBmcm96ZW4gP1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlb3Zlcjogc2VsZWN0SG92ZXJBY3RpdmUgPyBbc2VsZWN0Tm9kZUhvdmVyLCByZWZdOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6IFtzZWxlY3ROb2RlQ2xpY2ssIHJlZl1cclxuICAgICAgICAgICAgICAgIH06e1xyXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBub2RlLmNsaWNrID8gW2VtaXRFdmVudCwgbm9kZS5jbGljay5pZCwgdW5kZWZpbmVkXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBkYmxjbGljazogbm9kZS5kYmxjbGljayA/IFtlbWl0RXZlbnQsIG5vZGUuZGJsY2xpY2suaWQsIHVuZGVmaW5lZF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgbW91c2VvdmVyOiBub2RlLm1vdXNlb3ZlciA/IFtlbWl0RXZlbnQsIG5vZGUubW91c2VvdmVyLmlkLCB1bmRlZmluZWRdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlb3V0OiBub2RlLm1vdXNlb3V0ID8gW2VtaXRFdmVudCwgbm9kZS5tb3VzZW91dC5pZCwgdW5kZWZpbmVkXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBoKCdkaXYnLCBkYXRhLCBmbGF0dGVuKGNoaWxkcmVuKSlcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSBbXVxyXG5cclxuICAgIGZ1bmN0aW9uIGFkZExpc3RlbmVyKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gbGlzdGVuZXJzLnB1c2goY2FsbGJhY2spXHJcblxyXG4gICAgICAgIC8vIGZvciB1bnN1YnNjcmliaW5nXHJcbiAgICAgICAgcmV0dXJuICgpID0+IGxpc3RlbmVycy5zcGxpY2UobGVuZ3RoIC0gMSwgMSlcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBlbWl0RXZlbnQoZXZlbnRSZWYsIGUpIHtcclxuICAgICAgICBjb25zdCBldmVudElkID0gZXZlbnRSZWYuaWRcclxuICAgICAgICBjb25zdCBldmVudCA9IGRlZmluaXRpb24uZXZlbnRbZXZlbnRJZF1cclxuICAgICAgICBjdXJyZW50RXZlbnQgPSBlXHJcbiAgICAgICAgZXZlbnQuZGF0YS5mb3JFYWNoKChyZWYpPT57XHJcbiAgICAgICAgICAgIGlmKHJlZi5pZCA9PT0gJ19pbnB1dCcpe1xyXG4gICAgICAgICAgICAgICAgZXZlbnREYXRhW3JlZi5pZF0gPSBlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBwcmV2aW91c1N0YXRlID0gY3VycmVudFN0YXRlXHJcbiAgICAgICAgbGV0IG11dGF0aW9ucyA9IHt9XHJcbiAgICAgICAgZGVmaW5pdGlvbi5ldmVudFtldmVudElkXS5tdXRhdG9ycy5mb3JFYWNoKChyZWYpPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBtdXRhdG9yID0gZGVmaW5pdGlvbi5tdXRhdG9yW3JlZi5pZF1cclxuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSBtdXRhdG9yLnN0YXRlXHJcbiAgICAgICAgICAgIG11dGF0aW9uc1tzdGF0ZS5pZF0gPSByZXNvbHZlKG11dGF0b3IubXV0YXRpb24pXHJcbiAgICAgICAgfSlcclxuICAgICAgICBjdXJyZW50U3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBjdXJyZW50U3RhdGUsIG11dGF0aW9ucylcclxuICAgICAgICBsaXN0ZW5lcnMuZm9yRWFjaChjYWxsYmFjayA9PiBjYWxsYmFjayhldmVudElkLCBldmVudERhdGEsIGUsIHByZXZpb3VzU3RhdGUsIGN1cnJlbnRTdGF0ZSwgbXV0YXRpb25zKSlcclxuICAgICAgICBjdXJyZW50RXZlbnQgPSB7fVxyXG4gICAgICAgIGV2ZW50RGF0YSA9IHt9XHJcbiAgICAgICAgaWYoT2JqZWN0LmtleXMobXV0YXRpb25zKS5sZW5ndGgpe1xyXG4gICAgICAgICAgICByZW5kZXIoKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBsZXQgdmRvbSA9IHJlc29sdmUoe3JlZjondk5vZGVCb3gnLCBpZDonX3Jvb3ROb2RlJ30pXHJcbiAgICBmdW5jdGlvbiByZW5kZXIobmV3RGVmaW5pdGlvbikge1xyXG4gICAgICAgIGlmKG5ld0RlZmluaXRpb24pe1xyXG4gICAgICAgICAgICBpZihkZWZpbml0aW9uLnN0YXRlICE9PSBuZXdEZWZpbml0aW9uLnN0YXRlKXtcclxuICAgICAgICAgICAgICAgIGRlZmluaXRpb24gPSBuZXdEZWZpbml0aW9uXHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdTdGF0ZSA9IE9iamVjdC5rZXlzKGRlZmluaXRpb24uc3RhdGUpLm1hcChrZXk9PmRlZmluaXRpb24uc3RhdGVba2V5XSkucmVkdWNlKChhY2MsIGRlZik9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWNjW2RlZi5yZWZdID0gZGVmLmRlZmF1bHRWYWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2NcclxuICAgICAgICAgICAgICAgIH0sIHt9KVxyXG4gICAgICAgICAgICAgICAgY3VycmVudFN0YXRlID0gey4uLm5ld1N0YXRlLCAuLi5jdXJyZW50U3RhdGV9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkZWZpbml0aW9uID0gbmV3RGVmaW5pdGlvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG5ld3Zkb20gPSByZXNvbHZlKHtyZWY6J3ZOb2RlQm94JywgaWQ6J19yb290Tm9kZSd9KVxyXG4gICAgICAgIHBhdGNoKHZkb20sIG5ld3Zkb20pXHJcbiAgICAgICAgdmRvbSA9IG5ld3Zkb21cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfZnJlZXplKGlzRnJvemVuLCBjYWxsYmFjaywgbm9kZUlkKSB7XHJcbiAgICAgICAgZnJvemVuQ2FsbGJhY2sgPSBjYWxsYmFja1xyXG4gICAgICAgIHNlbGVjdGVkTm9kZUluRGV2ZWxvcG1lbnQgPSBub2RlSWRcclxuICAgICAgICBpZihmcm96ZW4gPT09IGZhbHNlICYmIGlzRnJvemVuID09PSB0cnVlKXtcclxuICAgICAgICAgICAgc2VsZWN0SG92ZXJBY3RpdmUgPSB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGZyb3plbiB8fCBmcm96ZW4gIT09IGlzRnJvemVuKXtcclxuICAgICAgICAgICAgZnJvemVuID0gaXNGcm96ZW5cclxuICAgICAgICAgICAgcmVuZGVyKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Q3VycmVudFN0YXRlKCkge1xyXG4gICAgICAgIHJldHVybiBjdXJyZW50U3RhdGVcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzZXRDdXJyZW50U3RhdGUobmV3U3RhdGUpIHtcclxuICAgICAgICBjdXJyZW50U3RhdGUgPSBuZXdTdGF0ZVxyXG4gICAgICAgIHJlbmRlcigpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBkZWZpbml0aW9uLFxyXG4gICAgICAgIHZkb20sXHJcbiAgICAgICAgZ2V0Q3VycmVudFN0YXRlLFxyXG4gICAgICAgIHNldEN1cnJlbnRTdGF0ZSxcclxuICAgICAgICByZW5kZXIsXHJcbiAgICAgICAgZW1pdEV2ZW50LFxyXG4gICAgICAgIGFkZExpc3RlbmVyLFxyXG4gICAgICAgIF9mcmVlemUsXHJcbiAgICAgICAgX3Jlc29sdmU6IHJlc29sdmUsXHJcbiAgICB9XHJcbn0iLCJtb2R1bGUuZXhwb3J0cz17XHJcbiAgICBcImV2ZW50RGF0YVwiOiB7XHJcbiAgICAgICAgXCJfaW5wdXRcIjoge1xyXG4gICAgICAgICAgICBcInRpdGxlXCI6IFwiaW5wdXQgdmFsdWVcIixcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwidG9Mb3dlckNhc2VcIjoge30sXHJcbiAgICBcInRvVXBwZXJDYXNlXCI6IHt9LFxyXG4gICAgXCJjb25kaXRpb25hbFwiOiB7fSxcclxuICAgIFwiZXF1YWxcIjoge1xyXG4gICAgICAgIFwiYTcyNTFhZjAtNTBhNy00ODIzLTg1YTAtNjZjZTA5ZDhhM2NjXCI6IHtcclxuICAgICAgICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJlZTI0MjNlNi01YjQ4LTQxYWUtOGNjZi02YTJjN2I0NmQyZjhcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwibm90XCI6IHt9LFxyXG4gICAgXCJsaXN0XCI6IHt9LFxyXG4gICAgXCJ0b1RleHRcIjoge1xyXG4gICAgICAgIFwiN2JzOWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHt9XHJcbiAgICB9LFxyXG4gICAgXCJsaXN0VmFsdWVcIjoge1xyXG4gICAgICAgIFwicHo3aGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgIFwibGlzdFwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInZOb2RlTGlzdFwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcImZsODlkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNVwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwicHJvcGVydHlcIjogXCJ4XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiaGo5d2Q2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgIFwibGlzdFwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInZOb2RlTGlzdFwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcImZsODlkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNVwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwicHJvcGVydHlcIjogXCJ5XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiaGhyOGI2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICBcImxpc3RcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZUxpc3RcIixcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJmbDg5ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjVcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcInByb3BlcnR5XCI6IFwiY29sb3JcIlxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcInBpcGVcIjoge1xyXG4gICAgICAgIFwiZnc4amQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICBcInZhbHVlXCI6IFwiQ3VycmVudCB2YWx1ZTogXCIsXHJcbiAgICAgICAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcImpvaW5cIixcclxuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwicDlzM2Q2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ1bTVlZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICAgICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgICAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJzdGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIjQ2dmRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcInRvVGV4dFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCI3YnM5ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcInVpOGpkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIitcIixcclxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYzh3ZWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICBcInZhbHVlXCI6IFwiLVwiLFxyXG4gICAgICAgICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJwZHE2ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIixcclxuICAgICAgICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInN0YXRlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiNDZ2ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwicmVmXCI6IFwiYWRkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInc4NmZkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiNDUycWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJzdGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIjQ2dmRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcInN1YnRyYWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInU0M3dkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZXc4M2Q2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgIFwidmFsdWVcIjogMSxcclxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidzNlOWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgIFwidmFsdWVcIjogMSxcclxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiM3FraWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICBcInZhbHVlXCI6IDAsXHJcbiAgICAgICAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcImFkZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJ3YnI3ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcInRvVGV4dFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJub29wXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWZcIjogXCJqb2luXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcInMyNThkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwidDd2cWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICBcInZhbHVlXCI6IDAsXHJcbiAgICAgICAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcImFkZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJ2cThkZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcInRvVGV4dFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJub29wXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWZcIjogXCJqb2luXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIndmOWFkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiOGNxNmI2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICAgICAgICAgIFwicmVmXCI6IFwibGlzdFZhbHVlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiaGhyOGI2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZjlxeGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGFibGVcIixcclxuICAgICAgICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInN0YXRlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiYzhxOWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicXd3OWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICBcInZhbHVlXCI6IFwicHhcIixcclxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicWR3N2M2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICBcInZhbHVlXCI6IFwicHhcIixcclxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiODQzNjlhYmEtNGE0ZC00OTMyLThhOWEtOGY5Y2E5NDhiNmEyXCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICBcInZhbHVlXCI6IFwiVGhlIG51bWJlciBub3cgaXMgZXZlblwiLFxyXG4gICAgICAgICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJjMmZiOWE5Yi0yNWJiLTRlOGItODBjMC1jZjUxYjg1MDYwNzBcIjoge1xyXG4gICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJzdGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIjQ2dmRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcInJlbWFpbmRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCIzNDc4MGQyMi1mNTIxLTRjMzAtODlhNS0zZTdmNWI1YWY3YzJcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcImVxdWFsXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcImE3MjUxYWYwLTUwYTctNDgyMy04NWEwLTY2Y2UwOWQ4YTNjY1wiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiMTIyOWQ0NzgtYmMyNS00NDAxLThhODktNzRmYzZjZmU4OTk2XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgIFwidmFsdWVcIjogMixcclxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZWUyNDIzZTYtNWI0OC00MWFlLThjY2YtNmEyYzdiNDZkMmY4XCI6IHtcclxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgIFwidmFsdWVcIjogMCxcclxuICAgICAgICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJqb2luXCI6IHtcclxuICAgICAgICBcInA5czNkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwidW01ZWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ3ZjlhZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICAgICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICAgICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcInF3dzlkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiczI1OGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJxZHc3YzZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiYWRkXCI6IHtcclxuICAgICAgICBcInc4NmZkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiZXc4M2Q2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ3YnI3ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICAgICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICAgICAgICAgIFwicmVmXCI6IFwibGlzdFZhbHVlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwicHo3aGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ2cThkZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICAgICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICAgICAgICAgIFwicmVmXCI6IFwibGlzdFZhbHVlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiaGo5d2Q2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcInN1YnRyYWN0XCI6IHtcclxuICAgICAgICBcInU0M3dkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwidzNlOWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcInJlbWFpbmRlclwiOiB7XHJcbiAgICAgICAgXCIzNDc4MGQyMi1mNTIxLTRjMzAtODlhNS0zZTdmNWI1YWY3YzJcIjoge1xyXG4gICAgICAgICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICAgICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIjEyMjlkNDc4LWJjMjUtNDQwMS04YTg5LTc0ZmM2Y2ZlODk5NlwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJ2Tm9kZUJveFwiOiB7XHJcbiAgICAgICAgXCJfcm9vdE5vZGVcIjoge1xyXG4gICAgICAgICAgICBcInRpdGxlXCI6IFwiYm94XCIsXHJcbiAgICAgICAgICAgIFwic3R5bGVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJzdHlsZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIl9yb290U3R5bGVcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNoaWxkcmVuXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcInZOb2RlVGV4dFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCIyNDcxZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjVcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcInZOb2RlVGV4dFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCIxNDgxZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjVcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcInZOb2RlVGV4dFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCIzNDgxZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjVcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcInZOb2RlSWZcIixcclxuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiNTc4N2MxNWEtNDI2Yi00MWViLTgzMWQtZTNlMDc0MTU5NTgyXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZUxpc3RcIixcclxuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiZmw4OWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI1XCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJndzlkZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICAgICAgICBcInRpdGxlXCI6IFwiYm94XCIsXHJcbiAgICAgICAgICAgIFwic3R5bGVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJzdHlsZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcImZxOWRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2hpbGRyZW5cIjogW11cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJ2Tm9kZVRleHRcIjoge1xyXG4gICAgICAgIFwiMjQ3MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI1XCI6IHtcclxuICAgICAgICAgICAgXCJ0aXRsZVwiOiBcInRleHRcIixcclxuICAgICAgICAgICAgXCJzdHlsZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInN0eWxlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiODQ4MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJmdzhqZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIjE0ODFkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNVwiOiB7XHJcbiAgICAgICAgICAgIFwidGl0bGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgICAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwidWk4amQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJzdHlsZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInN0eWxlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiOTQ4MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjbGlja1wiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcImV2ZW50XCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiZDQ4cmQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCIzNDgxZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjVcIjoge1xyXG4gICAgICAgICAgICBcInRpdGxlXCI6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICAgICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcImM4d2VkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwic3R5bGVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJzdHlsZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIjc0ODFkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiY2xpY2tcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJldmVudFwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIjNhNTRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiZThhZGQxYzctOGEwMS00MTY0LTg2MDQtNzIyZDhhYjUyOWYxXCI6IHtcclxuICAgICAgICAgICAgXCJ0aXRsZVwiOiBcInRleHRcIixcclxuICAgICAgICAgICAgXCJzdHlsZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInN0eWxlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiNGRjYTczYjMtOTBlYi00MWU3LTg2NTEtMmJkY2M5M2YzODcxXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCI4NDM2OWFiYS00YTRkLTQ5MzItOGE5YS04ZjljYTk0OGI2YTJcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwidk5vZGVJbnB1dFwiOiB7fSxcclxuICAgIFwidk5vZGVMaXN0XCI6IHtcclxuICAgICAgICBcImZsODlkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNVwiOiB7XHJcbiAgICAgICAgICAgIFwidGl0bGVcIjogXCJsaXN0XCIsXHJcbiAgICAgICAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiZjlxeGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJzdHlsZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInN0eWxlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwicTg2c2Q4OWQtMzcwMy00ODNlLWFiNjQtNWE1Yjc4MGFlYzI3XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJjaGlsZHJlblwiOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZUJveFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJndzlkZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwidk5vZGVJZlwiOiB7XHJcbiAgICAgICAgXCI1Nzg3YzE1YS00MjZiLTQxZWItODMxZC1lM2UwNzQxNTk1ODJcIjoge1xyXG4gICAgICAgICAgICBcInRpdGxlXCI6IFwiaWZcIixcclxuICAgICAgICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJjMmZiOWE5Yi0yNWJiLTRlOGItODBjMC1jZjUxYjg1MDYwNzBcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcInN0eWxlXCI6IHtcclxuICAgICAgICAgICAgICAgIFwicmVmXCI6IFwic3R5bGVcIixcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJhMWE4YzViOS1hN2QxLTQxNmItOGU3Ni1lYWM5NmZiMjczYzlcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImNoaWxkcmVuXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcInZOb2RlVGV4dFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJlOGFkZDFjNy04YTAxLTQxNjQtODYwNC03MjJkOGFiNTI5ZjFcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwic3R5bGVcIjoge1xyXG4gICAgICAgIFwiX3Jvb3RTdHlsZVwiOiB7XHJcbiAgICAgICAgICAgIFwiZm9udEZhbWlseVwiOiBcIidDb21mb3J0YWEnLCBjdXJzaXZlXCIsXHJcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZFwiOiBcIiNmNWY1ZjVcIixcclxuICAgICAgICAgICAgXCJtaW5IZWlnaHRcIjogXCIxMDAlXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiODQ4MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJwYWRkaW5nXCI6IFwiMTBweFwiLFxyXG4gICAgICAgICAgICBcIm1hcmdpblwiOiBcIjEwcHggNXB4XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiOTQ4MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJwYWRkaW5nXCI6IFwiMTBweCAxNXB4XCIsXHJcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZFwiOiBcIiNhYWFhYWFcIixcclxuICAgICAgICAgICAgXCJkaXNwbGF5XCI6IFwiaW5saW5lLWJsb2NrXCIsXHJcbiAgICAgICAgICAgIFwibWFyZ2luTGVmdFwiOiBcIjVweFwiLFxyXG4gICAgICAgICAgICBcImJvcmRlclJhZGl1c1wiOiBcIjNweFwiLFxyXG4gICAgICAgICAgICBcImN1cnNvclwiOiBcInBvaW50ZXJcIixcclxuICAgICAgICAgICAgXCJ1c2VyU2VsZWN0XCI6IFwibm9uZVwiLFxyXG4gICAgICAgICAgICBcIm1hcmdpblwiOiBcIjEwcHggNXB4XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiNzQ4MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJwYWRkaW5nXCI6IFwiMTBweCAxNXB4XCIsXHJcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZFwiOiBcIiM5OTk5OTlcIixcclxuICAgICAgICAgICAgXCJkaXNwbGF5XCI6IFwiaW5saW5lLWJsb2NrXCIsXHJcbiAgICAgICAgICAgIFwibWFyZ2luTGVmdFwiOiBcIjVweFwiLFxyXG4gICAgICAgICAgICBcImJvcmRlclJhZGl1c1wiOiBcIjNweFwiLFxyXG4gICAgICAgICAgICBcImN1cnNvclwiOiBcInBvaW50ZXJcIixcclxuICAgICAgICAgICAgXCJtYXJnaW5cIjogXCIxMHB4IDVweFwiLFxyXG4gICAgICAgICAgICBcInVzZXJTZWxlY3RcIjogXCJub25lXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiODA5MmFjNWUtZGZkMC00NDkyLWE2NWQtOGFjM2VlYzMyNWUwXCI6IHtcclxuICAgICAgICAgICAgXCJwYWRkaW5nXCI6IFwiMTBweCAxMHB4IDEwcHggMFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImE5NDYxZTI4LTdkOTItNDlhMC05MDAxLTIzZDc0ZTRiMzgyZFwiOiB7XHJcbiAgICAgICAgICAgIFwicGFkZGluZ1wiOiBcIjEwcHggMTBweCAxMHB4IDBcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCI3NjZiMTFlYy1kYTI3LTQ5NGMtYjI3Mi1jMjZmZWMzZjY0NzVcIjoge1xyXG4gICAgICAgICAgICBcInBhZGRpbmdcIjogXCIxMHB4XCIsXHJcbiAgICAgICAgICAgIFwiZmxvYXRcIjogXCJyaWdodFwiLFxyXG4gICAgICAgICAgICBcInBhZGRpbmdSaWdodFwiOiBcIjUwcHhcIixcclxuICAgICAgICAgICAgXCJ0ZXh0QWxpZ25cIjogXCJyaWdodFwiLFxyXG4gICAgICAgICAgICBcIm1heFdpZHRoXCI6IFwiNTAwcHhcIixcclxuICAgICAgICAgICAgXCJsaW5lLWhlaWdodFwiOiBcIjEuNVwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImNiY2Q4ZWRiLTRhYTItNDNmZS1hZDM5LWNlZTc5YjQ5MDI5NVwiOiB7XHJcbiAgICAgICAgICAgIFwicGFkZGluZ1wiOiBcIjEwcHhcIixcclxuICAgICAgICAgICAgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCI2NzYzZjEwMi0yM2Y3LTQzOTAtYjQ2My00ZTFiMTRlODY2YzlcIjoge1xyXG4gICAgICAgICAgICBcInBhZGRpbmdcIjogXCIxMHB4XCIsXHJcbiAgICAgICAgICAgIFwiZGlzcGxheVwiOiBcImJsb2NrXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiOTFjOWFkZjAtZDYyZS00NTgwLTkzZTctZjM5NTk0YWU1ZTdkXCI6IHtcclxuICAgICAgICAgICAgXCJwYWRkaW5nXCI6IFwiMTBweFwiLFxyXG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJibG9ja1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImU5ZmJlYjM5LTcxOTMtNDUyMi05MWIzLTc2MWJkMzU2MzlkM1wiOiB7XHJcbiAgICAgICAgICAgIFwicGFkZGluZ1wiOiBcIjEwcHhcIixcclxuICAgICAgICAgICAgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCIzY2Y1ZDg5ZC0zNzAzLTQ4M2UtYWI2NC01YTViNzgwYWVjMjdcIjoge1xyXG4gICAgICAgICAgICBcInBhZGRpbmdcIjogXCIxMHB4XCIsXHJcbiAgICAgICAgICAgIFwiZGlzcGxheVwiOiBcImJsb2NrXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwicTg2c2Q4OWQtMzcwMy00ODNlLWFiNjQtNWE1Yjc4MGFlYzI3XCI6IHtcclxuICAgICAgICAgICAgXCJwYWRkaW5nXCI6IFwiMjBweFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImZxOWRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgIFwicGFkZGluZ1wiOiBcIjEwcHhcIixcclxuICAgICAgICAgICAgXCJ3aWR0aFwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCIzcWtpZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImhlaWdodFwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJ0N3ZxZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImJhY2tncm91bmRcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiOGNxNmI2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCI0ZGNhNzNiMy05MGViLTQxZTctODY1MS0yYmRjYzkzZjM4NzFcIjoge1xyXG4gICAgICAgICAgICBcInBhZGRpbmdcIjogXCIxMHB4XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYTFhOGM1YjktYTdkMS00MTZiLThlNzYtZWFjOTZmYjI3M2M5XCI6IHtcclxuICAgICAgICAgICAgXCJwYWRkaW5nXCI6IFwiMTBweFwiXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwibmFtZVNwYWNlXCI6IHtcclxuICAgICAgICBcIl9yb290TmFtZVNwYWNlXCI6IHtcclxuICAgICAgICAgICAgXCJ0aXRsZVwiOiBcInN0YXRlXCIsXHJcbiAgICAgICAgICAgIFwiY2hpbGRyZW5cIjogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwicmVmXCI6IFwic3RhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiNDZ2ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWZcIjogXCJzdGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCJjOHE5ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwic3RhdGVcIjoge1xyXG4gICAgICAgIFwiNDZ2ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0aXRsZVwiOiBcImNvdW50XCIsXHJcbiAgICAgICAgICAgIFwicmVmXCI6IFwiNDZ2ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCIsXHJcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiLFxyXG4gICAgICAgICAgICBcImRlZmF1bHRWYWx1ZVwiOiAwLFxyXG4gICAgICAgICAgICBcIm11dGF0b3JzXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcInJlZlwiOiBcIm11dGF0b3JcIixcclxuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IFwiYXM1NWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWZcIjogXCJtdXRhdG9yXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcIjlkcThkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYzhxOWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJ0aXRsZVwiOiBcInRpbGVzXCIsXHJcbiAgICAgICAgICAgIFwicmVmXCI6IFwiYzhxOWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCIsXHJcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInRhYmxlXCIsXHJcbiAgICAgICAgICAgIFwiZGVmaW5pdGlvblwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInhcIjogXCJudW1iZXJcIixcclxuICAgICAgICAgICAgICAgIFwieVwiOiBcIm51bWJlclwiLFxyXG4gICAgICAgICAgICAgICAgXCJjb2xvclwiOiBcInRleHRcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImRlZmF1bHRWYWx1ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcIm9wczZkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDEyMCxcclxuICAgICAgICAgICAgICAgICAgICBcInlcIjogMTAwLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIjogXCIjZWFiNjVjXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBcIndwdjVkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDIwMCxcclxuICAgICAgICAgICAgICAgICAgICBcInlcIjogMTIwLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIjogXCIjNTNCMkVEXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBcInFuMjdkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDEzMCxcclxuICAgICAgICAgICAgICAgICAgICBcInlcIjogMjAwLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIjogXCIjNWJjYzViXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBcImNhOXJkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDE1MCxcclxuICAgICAgICAgICAgICAgICAgICBcInlcIjogMTUwLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY29sb3JcIjogXCIjNGQ0ZDRkXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJtdXRhdG9yc1wiOiBbXVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIm11dGF0b3JcIjoge1xyXG4gICAgICAgIFwiYXM1NWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgICAgICAgXCJldmVudFwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcImV2ZW50XCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiZDQ4cmQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJzdGF0ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInN0YXRlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiNDZ2ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJtdXRhdGlvblwiOiB7XHJcbiAgICAgICAgICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJwZHE2ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcIjlkcThkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgIFwiZXZlbnRcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJldmVudFwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIjNhNTRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwic3RhdGVcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJzdGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIjQ2dmRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwibXV0YXRpb25cIjoge1xyXG4gICAgICAgICAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiNDUycWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcImV2ZW50XCI6IHtcclxuICAgICAgICBcImQ0OHJkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgICAgICAgIFwidGl0bGVcIjogXCJpbmNyZW1lbnRcIixcclxuICAgICAgICAgICAgXCJtdXRhdG9yc1wiOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWZcIjogXCJtdXRhdG9yXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBcImFzNTVkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIFwiZGF0YVwiOiBbXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCIzYTU0ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICAgICAgICBcInRpdGxlXCI6IFwiZGVjcmVtZW50XCIsXHJcbiAgICAgICAgICAgIFwibXV0YXRvcnNcIjogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwicmVmXCI6IFwibXV0YXRvclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogXCI5ZHE4ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBcImRhdGFcIjogW11cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iXX0=
