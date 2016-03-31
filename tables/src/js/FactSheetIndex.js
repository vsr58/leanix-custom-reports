/**
 * FactSheetIndex takes JSON data structure from rest api and creates an indexed structure separated
 * by FactSheet type, e.g. index.services.100001010 = {ID:100001010, name:'AC Management', ...}
 */
var FactSheetIndex = (function() {
    function FactSheetIndex(data) {
        this.index = {};

        for (var i = 0; i < data.length; i++) {
            if (data[i].resourceType) {
                var resourceType = data[i].resourceType;
                this.index[resourceType] = {};
            }
        }

        for (var i = 0; i < data.length; i++) {
            this.index[data[i].resourceType][data[i].ID] = data[i];
        }
    }

    FactSheetIndex.prototype.getSortedList = function(type) {
        var list = [];
        for (var key in this.index[type]) {
            list.push(this.index[type][key]);
        }

        return list;
    };

    FactSheetIndex.prototype.getParent = function(type, id) {
        if (this.index[type][id]) {
            var parentId = this.index[type][id].parentID;
            if (parentId && this.index[type][parentId]) {
                return this.index[type][parentId];
            }
        }

        return null;
    };

    return FactSheetIndex;
})();