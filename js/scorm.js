/**
 * Lightweight SCORM 1.2 wrapper for מצפן 2030
 * Gracefully degrades when running outside an LMS (standalone / file://)
 */
const SCORM = (() => {
    let _api = null;
    let _initialized = false;

    function _findAPI(win) {
        let attempts = 0;
        while (win.API == null && win.parent != null && win.parent !== win) {
            attempts++;
            if (attempts > 10) return null;
            win = win.parent;
        }
        return win.API || null;
    }

    function _getAPI() {
        if (_api) return _api;
        _api = _findAPI(window);
        if (!_api && window.opener) _api = _findAPI(window.opener);
        return _api;
    }

    function init() {
        const api = _getAPI();
        if (!api) return false;
        try {
            const result = api.LMSInitialize('');
            _initialized = (result === 'true' || result === true);
            return _initialized;
        } catch (e) { return false; }
    }

    function set(key, value) {
        if (!_initialized) return false;
        const api = _getAPI();
        if (!api) return false;
        try {
            return api.LMSSetValue(key, String(value)) === 'true';
        } catch (e) { return false; }
    }

    function save() {
        if (!_initialized) return false;
        const api = _getAPI();
        if (!api) return false;
        try {
            return api.LMSCommit('') === 'true';
        } catch (e) { return false; }
    }

    function quit() {
        if (!_initialized) return;
        const api = _getAPI();
        if (!api) return;
        try {
            api.LMSCommit('');
            api.LMSFinish('');
            _initialized = false;
        } catch (e) { /* silent */ }
    }

    return { init, set, save, quit };
})();
