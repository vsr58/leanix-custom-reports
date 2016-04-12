var ReportDataQualityServices = (function() {
    function ReportDataQuality(reportSetup, tagFilter) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
    }

    ReportDataQuality.prototype.render = function() {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true&types[]=10&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(factSheetPromise)
            .then(function (data) {
                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('services');

                var output = [];
                function getGreenToRed(percent){
                    var r = percent<50 ? 255 : Math.floor(255-(percent*2-100)*255/100);
                    var g = percent>50 ? 255 : Math.floor((percent*2)*255/100);
                    return 'rgb('+r+','+g+',0)';
                }

                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1)  {

                        var item = {
                            name : list[i].fullName,
                            type : 'App',
                            id : list[i].ID,
                            completion : Math.floor(list[i].completion * 100),
                            count : ''
                        };

                        output.push(item);
                    }
                }

                function link(cell, row) {
                    if (row.type != 'Market')
                        return '<a href="' + that.reportSetup.baseUrl + '/services/' + row.id + '" target="_blank">' + cell + '</a>';
                    else
                        return '<b>' + cell + '</b>';
                }

                function percentage(cell, row) {
                    return  '<div class="percentage" style="background-color: ' + getGreenToRed(cell) + ';">' + cell + ' %</div>';
                }

                function trClassFormat(rowData,rIndex){
                    return 'tr-type-' + rowData.type.toLowerCase();
                }

                ReactDOM.render(
                    <div className="report-data-quality">
                        <BootstrapTable data={output} striped={true} hover={true} search={true} condensed={true} exportCSV={true} trClassName={trClassFormat}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" dataAlign="left" dataSort={true} dataFormat={link} filter={{type: "TextFilter", placeholder: "Please enter a value"}}>Application Name</TableHeaderColumn>
                            <TableHeaderColumn dataField="completion" dataAlign="left" dataSort={true} dataFormat={percentage} filter={{type: "NumberFilter", defaultValue: {comparator: '<='}}}>Completion</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportDataQuality;
})();
