var ReportApplicationFunctionalFit = (function() {
    function ReportApplicationFunctionalFit(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportApplicationFunctionalFit.prototype.render = function() {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true&types[]=10&types[]=18&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(factSheetPromise)
            .then(function (data) {

                var fsIndex = new FactSheetIndex(data);

                var list = fsIndex.getSortedList('services');

                var output = [];
                var weights = {};
                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1)  {

                        var bcs = [];
                        for (var z = 0; z < list[i].serviceHasBusinessCapabilities.length; z++) {
                            var tmp = list[i].serviceHasBusinessCapabilities[z];
                            if (tmp) {
                                if (tmp.businessCapabilityID && fsIndex.index.businessCapabilities[tmp.businessCapabilityID]) {

                                    bcs.push({
                                        id: tmp.businessCapabilityID,
                                        name: fsIndex.index.businessCapabilities[tmp.businessCapabilityID].displayName,
                                        weight: tmp.functionalSuitabilityID,
                                    })
                                }
                            }
                        }

                        for (var z = 0; z < bcs.length; z++) {
                            output.push({
                                name : list[i].fullName,
                                id : list[i].ID,
                                businessCapability : bcs.length ? bcs[z].name : '',
                                businessCapabilityID : bcs.length ? bcs[z].id : '',
                                weight : bcs.length ? bcs[z].weight : '',
                            });
                        }
                    }
                }


                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/services/' + row.id + '" target="_blank">' + cell + '</a>';
                }

                function linkBusinessCapability(cell, row) {
                    if (row.businessCapabilityID)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.businessCapabilityID + '" target="_blank">' + cell + '</a>';
                }

                ReactDOM.render(
                    <div>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="businessCapability" dataAlign="left" dataSort={true} dataFormat={linkBusinessCapability} filter={{type: "TextFilter", placeholder: "Please enter a value"}}>Business Capability</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" dataAlign="left" dataSort={true} dataFormat={link} filter={{type: "TextFilter", placeholder: "Please enter a value"}}>Use Case</TableHeaderColumn>
                            <TableHeaderColumn dataField="weight" dataAlign="left" dataSort={true} filter={{type: "NumberFilter", defaultValue: {comparator: '<='}}}>Weight</TableHeaderColumn>
                           </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportApplicationFunctionalFit;
})();
