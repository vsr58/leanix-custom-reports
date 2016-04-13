var ReportDataQuality = (function() {
    function ReportDataQuality(reportSetup, tagFilter) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
    }

    ReportDataQuality.prototype.render = function() {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true&types[]=10&types[]=16&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(factSheetPromise)
            .then(function (data) {

                var fsIndex = new FactSheetIndex(data);

                var list = fsIndex.getSortedList('services');


                var getLookup = function(data) {
                    var ret = {};
                    for (var i = 0; i < data.length; i++) {
                        ret[data[i]] = data[i];
                    }

                    return ret;
                };

                var output = [];
                var markets = {};

                var groupedByMarket = {};

                function getGreenToRed(percent){
                    var r = percent<50 ? 255 : Math.floor(255-(percent*2-100)*255/100);
                    var g = percent>50 ? 255 : Math.floor((percent*2)*255/100);
                    return 'rgb('+r+','+g+',0)';
                }

                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1)  {


                        // Extract market
                        var re = /^([A-Z]{2,3})_/;
                        var market = '';

                        if ((m = re.exec(list[i].fullName)) !== null) {
                            if (m.index === re.lastIndex) {
                                re.lastIndex++;
                            }
                            // View your result using the m-variable.
                            market = m[1];
                        }

                        if (!market)
                            market = "n/a";

                        if (market)
                            markets[market] = market;

                        var item = {
                            name : list[i].fullName,
                            type : 'App',
                            id : list[i].ID,
                            market : market,
                            completion : Math.floor(list[i].completion * 100),
                            count : ''
                        };

                        if (!(market in groupedByMarket))
                            groupedByMarket[market] = [];

                        groupedByMarket[market].push(item);
                    }
                }

                for (var key in groupedByMarket) {

                    var sum = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (groupedByMarket[key][i].completion)
                            sum += groupedByMarket[key][i].completion;
                    }

                    groupedByMarket[key].sort(function(a, b) {
                        return a.completion - b.completion;
                    });

                    var avg = sum / groupedByMarket[key].length;

                    output.push({
                        name : key + ' (' + groupedByMarket[key].length + ' Applications)',
                        type : 'Market',
                        id : key,
                        market : key,
                        completion : Math.floor(avg)
                    });

                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        output.push(groupedByMarket[key][i]);
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
                        <BootstrapTable data={output} striped={false} hover={true} search={true} condensed={true} exportCSV={true} trClassName={trClassFormat}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="type" width="80" filter={{type: "SelectFilter", options: {Market: 'Market'}}}>Type</TableHeaderColumn>
                            <TableHeaderColumn dataField="market" width="80" dataAlign="left" dataSort={false} filter={{type: "SelectFilter", options: markets}}>Market</TableHeaderColumn>
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