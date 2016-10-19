var ReportDataQuality = (function () {
    function ReportDataQuality(reportSetup, tagFilter) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
    }

    ReportDataQuality.prototype.render = function () {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true&'
            + 'types[]=10&types[]=12&types[]=18&filterRelations[]=serviceHasConsumers&filterRelations[]=serviceHasBusinessCapabilities&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(factSheetPromise)
            .then(function (data) {

                var fsIndex = new FactSheetIndex(data);

                var list = fsIndex.getSortedList('services');


                var getLookup = function (data) {
                    var ret = {};
                    for (var i = 0; i < data.length; i++) {
                        ret[data[i]] = data[i];
                    }

                    return ret;
                };

                var output = [];
                var markets = {};

                var groupedByMarket = {};

                function getGreenToRed(percent) {
                    var r = percent < 50 ? 255 : Math.floor(255 - (percent * 2 - 100) * 255 / 100);
                    var g = percent > 50 ? 255 : Math.floor((percent * 2) * 255 / 100);
                    return 'rgb(' + r + ',' + g + ',0)';
                }

                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1) {

                        for (var z = 0; z < list[i].serviceHasConsumers.length; z++) {
                            var tmp = list[i].serviceHasConsumers[z];
                            if (tmp) {
                                if (tmp.consumerID && fsIndex.index.consumers[tmp.consumerID]) {

                                    if (!(tmp.consumerID in groupedByMarket))
                                        groupedByMarket[tmp.consumerID] = [];

                                    groupedByMarket[tmp.consumerID].push(list[i]);
                                }
                            }
                        }
                    }
                }

                for (var key in groupedByMarket) {
                    var compliant = [];
                    var noncompliant = [];

                    var sum = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (groupedByMarket[key][i].completion)
                            sum += groupedByMarket[key][i].completion;
                    }

                    pushToOutput(output, key, 'Adding applications', 14, 2);
                    pushToOutput(output, key, 'Retiring applications', 8, 0);

                    rule = 'has COBRA'; // done
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var c = false;
                        for (var z = 0; z < groupedByMarket[key][i].serviceHasBusinessCapabilities.length; z++) {
                            var tmp = groupedByMarket[key][i].serviceHasBusinessCapabilities[z];
                            if (tmp && tmp.businessCapabilityID) {
                                var bc = fsIndex.index.businessCapabilities[tmp.businessCapabilityID];
                                if (bc && bc.tags.indexOf('Cobra') != -1) {
                                    c = true;
                                    break;
                                } 
                            }
                        }
                        if (c) compliant[rule]++; else noncompliant[rule]++;
                    }
                    pushToOutput(output, key, 'has COBRA', compliant, noncompliant, 
'type=10&serviceHasConsumers[]=' + key + '&serviceHasBusinessCapabilities[]=tag-150000019&serviceHasBusinessCapabilities_op=NOR&tags_service_type[]=Application');
                    
                    pushToOutput(output, key, 'has COTS Package', 63, 0);
                    pushToOutput(output, key, 'has COTS Supplier', 63, 0);
                    pushToOutput(output, key, 'has Cost Centre', 14, 2); // todo tag
                    pushToOutput(output, key, 'has Deployment Lifecycle', 14, 2);

                    rule = 'has Description'; // done
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (groupedByMarket[key][i].description) compliant[rule]++; else noncompliant[rule]++;
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant, 'type=10&serviceHasConsumers[]=' + key + '&quality[]=4');

                    pushToOutput(output, key, 'has IT Owner', 14, 2);
                    pushToOutput(output, key, 'has SPOC', 14, 2);
                    pushToOutput(output, key, 'has Software Product', 14, 2);

                }

                function pushToOutput(output, key, rule, compliant, noncompliant, url) {
                    output.push({
                        rule: rule,
                        id: key,
                        market: fsIndex.index.consumers[key] ? fsIndex.index.consumers[key].name : '',
                        compliant: compliant[rule],
                        noncompliant: noncompliant[rule],
                        percentage: 100 - Math.floor(noncompliant[rule] / (compliant[rule] + noncompliant[rule]) * 100),
                        url: url
                    });

                }


                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/inventory?' + row.url + '" target="_blank">' + cell + '</a>';
                }


                function percentage(cell, row) {
                    return '<div class="percentage" style="background-color: ' + getGreenToRed(cell) + ';">' + cell + ' %</div>';
                }

                ReactDOM.render(
                    <div className="report-data-quality">
                        <BootstrapTable data={output} striped={false} hover={true} search={true} condensed={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="market" width="80" dataAlign="left" dataSort={false} filter={{ type: "SelectFilter", options: markets }}>Market</TableHeaderColumn>
                            <TableHeaderColumn dataField="rule" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Rule</TableHeaderColumn>
                            <TableHeaderColumn dataField="compliant" dataAlign="left" dataSort={true} filter={{ type: "NumberFilter", defaultValue: { comparator: '<=' } }}>Compliant</TableHeaderColumn>
                            <TableHeaderColumn dataField="noncompliant" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "NumberFilter", defaultValue: { comparator: '<=' } }}>Non-Compliant</TableHeaderColumn>
                            <TableHeaderColumn dataField="percentage" dataAlign="left" dataSort={true} dataFormat={percentage} filter={{ type: "NumberFilter", defaultValue: { comparator: '<=' } }}>% Compliant</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportDataQuality;
})();