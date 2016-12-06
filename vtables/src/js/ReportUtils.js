
function ReportUtils() { }

ReportUtils.prototype.lifecycles = {
    1: "Plan",
    2: "Phase In",
    3: "Active",
    4: "Phase Out",
    5: "End of Life"
};

ReportUtils.prototype.lifecycleArray = function () {
    var lifecycleArray = [];
    for (var key in this.lifecycles) {
        lifecycleArray.push(this.lifecycles[key]);
    }
    return lifecycleArray;
};

ReportUtils.prototype.formattedDate = function (date) {
    var d = new Date(date || Date.now()),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('/');
};

ReportUtils.prototype.getCurrentLifecycle = function (item) {

    item.factSheetHasLifecycles = item.factSheetHasLifecycles.sort(function (a, b) {
        return a.lifecycleStateID > b.lifecycleStateID;
    });

    var current = null;

    for (var i = 0; i < item.factSheetHasLifecycles.length; i++) {
        var curDate = Date.parse(item.factSheetHasLifecycles[i].startDate);
        if (curDate <= Date.now()) {
            current = {
                phase: this.lifecycles[item.factSheetHasLifecycles[i].lifecycleStateID],
                phaseID: item.factSheetHasLifecycles[i].lifecycleStateID,
                startDate: this.formattedDate(curDate),
                date: curDate
            };
        }
    }
    return current;
};

ReportUtils.prototype.getLifecycle = function (item, stateID) {
    var current;
    for (var i = 0; i < item.factSheetHasLifecycles.length; i++) {
        if (item.factSheetHasLifecycles[i].lifecycleStateID == stateID) { 
            var curDate = Date.parse(item.factSheetHasLifecycles[i].startDate);
            current = {
                phase: this.lifecycles[item.factSheetHasLifecycles[i].lifecycleStateID],
                phaseID: item.factSheetHasLifecycles[i].lifecycleStateID,
                startDate: this.formattedDate(curDate),
                date: curDate
            };
        }
    }
    return current;
};

ReportUtils.prototype.getTagFromGroup = function (object, validTags) {
    var cc = object.tags.filter(function (x) {
        if (validTags.indexOf(x) >= 0)
            return true;
        else
            return false;
    });

    if (cc.length)
        return cc[0];

    return '';
};

ReportUtils.prototype.getLookup = function (data) {
    var ret = {};
    for (var i = 0; i < data.length; i++) {
        ret[data[i]] = data[i];
    }

    return ret;
};


