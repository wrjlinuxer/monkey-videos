// ==UserScript==
// @name         youkuHTML5
// @description  Play Videos with html5 on youku.com
// @include      http://v.youku.com/v_show/id_*
// @include      http://v.youku.com/v_playlist/*
// @version      2.1
// @license      GPLv3
// @author       LiuLang
// @email        gsushzhsosgsu@gmail.com
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

