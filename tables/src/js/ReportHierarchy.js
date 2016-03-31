var ReportHierarchy = (function() {
    function ReportHierarchy(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
        this.maxLevel = 3;
    }

    ReportHierarchy.prototype.render = function() {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/businessCapabilities?pageSize=-1')
            .then(function (response) {
                return response;
            });

        $.when(factSheetPromise)
            .then(function (data) {

                var fsIndex = new FactSheetIndex(data);

                for (var id in fsIndex.index.businessCapabilities) {
                    var item = fsIndex.index.businessCapabilities[id];
                }

                // products will be presented by react-bootstrap-table

                var list = fsIndex.getSortedList('businessCapabilities');

                var output = [];
                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1)  {

                        var hierarchy = {};
                        for (var z = 0; z < that.maxLevel; z++) {
                            hierarchy['L' + z] = null;
                        }

                        var tmp = list[i];

                        while (tmp != null) {
                            hierarchy['L' + tmp.level] = tmp;
                            tmp = fsIndex.getParent('businessCapabilities', tmp.ID);
                        }

                        output.push({
                            name : list[i].fullName,
                            level : list[i].level + 1,
                            id : list[i].ID,
                            description : list[i].description,
                            hierarchy : hierarchy,
                            hierarchyL0Name : hierarchy.L0 ? hierarchy.L0.fullName : '',
                            hierarchyL1Name : hierarchy.L1 ? hierarchy.L1.fullName : '',
                            hierarchyL2Name : hierarchy.L2 ? hierarchy.L2.fullName : ''
                        });
                    }
                }

                function linkL0(cell, row) {
                    if (row.hierarchy.L0)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.hierarchy.L0.ID + '" target="_blank">' + cell + '</a>';
                }

                function linkL1(cell, row) {
                    if (row.hierarchy.L1)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.hierarchy.L1.ID + '" target="_blank">' + cell + '</a>';
                }

                function linkL2(cell, row) {
                    if (row.hierarchy.L2)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.hierarchy.L2.ID + '" target="_blank">' + cell + '</a>';
                }

                function trClassFormat(rowData,rIndex){
                    return 'tr-level-' + rowData.level;
                }

                var levels = [];

                for (var z = 0; z < that.maxLevel; z++) {
                    levels.push(z + 1);
                }

                ReactDOM.render(
                    <div className="report-hierarchy">
                        <h3>{that.title ? that.title : 'Domain Definitions'}</h3>
                        <BootstrapTable data={output} striped={false} hover={false} search={true} exportCSV={true} trClassName={trClassFormat}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="level" width="150" dataAlign="left" dataSort={false} filter={{type: "NumberFilter", options: levels, numberComparators: ['<='], defaultValue: {comparator: '<='}}}>Level</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL0Name" width="200" dataAlign="left" dataSort={false} dataFormat={linkL0}>L1 Domain</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL1Name" width="200" dataAlign="left" dataSort={false} dataFormat={linkL1}>L2 Domain</TableHeaderColumn>
                            <TableHeaderColumn dataField="hierarchyL2Name" width="200" dataAlign="left" dataSort={false} dataFormat={linkL2}>L3 Domain</TableHeaderColumn>
                            <TableHeaderColumn dataField="description">Domain Definition</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportHierarchy;
})();