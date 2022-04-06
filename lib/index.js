'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.makeCookieDriver = makeCookieDriver;

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _cookie_js = require('cookie_js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function makeCookieDriver() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$decode = _ref.decode,
        decode = _ref$decode === undefined ? null : _ref$decode;

    if (decode) {
        _cookie_js.cookie.utils.decode = decode;
    }

    var changesSubject$ = new _xstream2.default.never();

    var noop = function noop() {
        return undefined;
    };
    var err = console.error.bind(console);

    return function cookieDriver(sink$) {
        handleRemoveCookie(sink$);
        handleSetCookie(sink$);
        handleCookieUpdateSubject(sink$);

        return {
            get: getCookie,
            all: getAllCookies
        };
    };

    function handleRemoveCookie(sink$) {
        sink$.filter(function (cookieSettings) {
            return cookieSettings.value === undefined;
        }).addListener({
            next: function next(cookieSettings) {
                return _cookie_js.cookie.remove(cookieSettings.key);
            },
            error: err,
            complete: noop
        });
    }

    function handleSetCookie(sink$) {
        sink$.filter(function (cookieSettings) {
            return cookieSettings.value !== undefined;
        }).addListener({
            next: function next(cookieSettings) {
                return _cookie_js.cookie.set(cookieSettings.key, cookieSettings.value, cookieSettings.settings);
            },
            error: err,
            complete: noop
        });
    }

    function handleCookieUpdateSubject(sink$) {
        sink$.addListener({
            next: function next(val) {
                return changesSubject$.shamefullySendNext(val.key);
            },
            error: function error(err) {
                return changesSubject$.shamefullySendError(err);
            },
            complete: function complete() {
                return changesSubject$.shamefullySendComplete();
            }
        });
    }

    function getCookie(cookieName) {
        return _xstream2.default.merge(_xstream2.default.of(cookieName), changesSubject$).filter(function (name) {
            return name === cookieName;
        }).map(function () {
            return _cookie_js.cookie.get(cookieName);
        });
    }

    function getAllCookies() {
        return _xstream2.default.merge(_xstream2.default.of(null), changesSubject$).map(function () {
            return _cookie_js.cookie.all();
        });
    }
}