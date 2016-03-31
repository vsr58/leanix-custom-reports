/**
 * ReportSetup class extracts parameters submitted to custom report. Custom parameters
 * include baseUrl, apiBaseUrl, token or apiKey
 */
var ReportSetup = (function() {
    function ReportSetup() {
        // Get external params from URL
        var args = _.reduce(window.location.search.substring(1).split('&'), function (accu, kvp) {
            var splitted = kvp.split('=');
            accu[splitted[0]] = splitted[1];
            return accu;
        }, {});

        if (!args.baseUrl || !args.apiBaseUrl || !(args.token || args.apiKey)) {
            console.error('Not enough parameters provided via URL!');
            return;
        }

        this.args = args;

        this.baseUrl = decodeURIComponent(args.baseUrl);
        this.apiBaseUrl = decodeURIComponent(args.apiBaseUrl);

        if (args.token) {
            this.token = args.token;
        } else if (args.apiKey) {
            this.apiKey = args.apiKey;
        }

        var that = this;
        $.ajaxSetup({
            beforeSend : function(xhr) {
                if (that.token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + that.token);
                } else if (that.apiKey) {
                    xhr.setRequestHeader('Api-Key', that.apiKey);
                }
            }
        });
    }

    /**
     * Return arg with given key
     * @param key
     * @returns {string}
     */
    ReportSetup.prototype.getArg = function(key) {
        if (this.args[key]) {
            return decodeURIComponent(this.args[key]);
        }
    };

    return ReportSetup;
})();