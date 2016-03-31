var ReportProcessSpend = (function() {
    function ReportProcessSpend(reportSetup) {
        this.reportSetup = reportSetup;
    }

    ReportProcessSpend.prototype.render = function() {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true&types[]=10&types[]=22&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(factSheetPromise)
            .then(function (data) {

                var fsIndex = new FactSheetIndex(data);

                for (var id in fsIndex.index.processes) {
                    var item = fsIndex.index.processes[id];
                    item['stats'] = {
                        'services' : [],
                        'serviceCost' : 0
                    };
                    item['serviceCost'] = 0;
                }

                for (var id in fsIndex.index.services) {
                    var ids = [];
                    var service = fsIndex.index.services[id];
                    if (service.serviceHasProcesses && service.serviceHasProcesses.length) {
                        ids = service.serviceHasProcesses.map(function(item) {
                            return item.processID;
                        });
                    }

                    var serviceCost = 0;
                    if (service.serviceHasResources) {
                        service.serviceHasResources.forEach(function(item) {
                            if (item.costTotalAnnual)
                                serviceCost += item.costTotalAnnual;
                        });
                    }

                    ids.forEach(function(id) {
                        if (fsIndex.index.processes[id]) {
                            fsIndex.index.processes[id].stats.services.push(service.ID);
                            fsIndex.index.processes[id].stats.serviceCost = serviceCost;
                        } else {
                            console.warn('Unable to find item with id = ' + id);
                        }
                    });

                }

                // products will be presented by react-bootstrap-table

                var list = fsIndex.getSortedList('processes');

                var output = [];
                for (var i = 0; i < list.length; i++) {
                    output.push({
                        name : list[i].displayName,
                        id : list[i].ID,
                        cost : list[i].stats.serviceCost,
                        count : list[i].stats.services.length,
                        avgCost : list[i].stats.services.length ? list[i].stats.serviceCost / list[i].stats.services.length : 0
                    });
                }

                function moneyFormatter(cell, row) {
                    return '&pound' + accounting.formatMoney(cell, "", 0, ",", ".");
                }

                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/processes/' + row.id + '" target="_blank">' + cell + '</a>';
                }

                var options = {
                    sortName : 'cost',
                    sortOrder : 'desc'
                };

                ReactDOM.render(
                    <div>
                        <h3>Application Spend by Process</h3>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} exportCSV={true} options={options}>
                            <TableHeaderColumn dataField="name" isKey={true} dataAlign="left" dataSort={true} dataFormat={link}>Process</TableHeaderColumn>
                            <TableHeaderColumn dataField="count" dataSort={true}>Number of supported apps</TableHeaderColumn>
                            <TableHeaderColumn dataField="avgCost" dataSort={true} dataFormat={moneyFormatter}>Avg total cost per app</TableHeaderColumn>
                            <TableHeaderColumn dataField="cost" dataSort={true} dataFormat={moneyFormatter}>Total cost of all supporting apps</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportProcessSpend;
})();