var ReportAppMap2ETOM = (function () {
    function ReportAppMap2ETOM(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportAppMap2ETOM.prototype.render = function () {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true'
            + '&types[]=18&types[]=22&pageSize=-1'
            + '&filterRelations[]=processHasBusinessCapabilities'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=fullName'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'
        )
            .then(function (response) {
                return response.data;
            });



        $.when(factSheetPromise)
            .then(function (data) {
                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('businessCapabilities');

                var output = [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].tags.indexOf('AppMap') != -1) {
                        for (var z = 0; z < list[i].processHasBusinessCapabilities.length; z++) {
                            var processHasBusinessCapabilities = list[i].processHasBusinessCapabilities[z];
                            if (processHasBusinessCapabilities && processHasBusinessCapabilities.processID) {
                                var refProcess = fsIndex.index.processes[processHasBusinessCapabilities.processID];
                                if (refProcess) {

                                    output.push({
                                        name: list[i].fullName,
                                        id: list[i].ID,
                                        refName: refProcess.fullName,
                                        refId: refProcess.ID
                                    });
                                }
                            }
                        }    
                    }
                }


                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.id + '" target="_blank">' + cell + '</a>';
                }

                function linkRef(cell, row) {
                    if (row.refId)
                        return '<a href="' + that.reportSetup.baseUrl + '/processes/' + row.refId + '" target="_blank">' + cell + '</a>';
                }

                ReactDOM.render(
                    <div>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} pagination={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Application Map</TableHeaderColumn>
                            <TableHeaderColumn dataField="refName" dataAlign="left" dataSort={true} dataFormat={linkRef} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>eTOM</TableHeaderColumn>   
                         </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportAppMap2ETOM;
})();