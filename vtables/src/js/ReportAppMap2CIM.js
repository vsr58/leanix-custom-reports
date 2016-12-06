var ReportAppMap2CIM = (function () {
    function ReportAppMap2CIM(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportAppMap2CIM.prototype.render = function () {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true'
            + '&types[]=17&&types[]=18&pageSize=-1'
            + '&filterRelations[]=factSheetHasRequires'
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
                        for (var z = 0; z < list[i].factSheetHasRequires.length; z++) {
                            var factSheetHasRequires = list[i].factSheetHasRequires[z];
                            if (factSheetHasRequires && factSheetHasRequires.factSheetRefID) {
                                var refBO = fsIndex.index.businessObjects[factSheetHasRequires.factSheetRefID];
                                if (refBO) {

                                    output.push({
                                        name: list[i].fullName,
                                        id: list[i].ID,
                                        refName: refBO.fullName,
                                        refId: refBO.ID
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
                        return '<a href="' + that.reportSetup.baseUrl + '/businessObjects/' + row.refId + '" target="_blank">' + cell + '</a>';
                }

                ReactDOM.render(
                    <div>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} pagination={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Application Map</TableHeaderColumn>
                            <TableHeaderColumn dataField="refName" dataAlign="left" dataSort={true} dataFormat={linkRef} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>CIM</TableHeaderColumn>   
                         </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportAppMap2CIM;
})();