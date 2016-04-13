var ReportCapabilitySpend = (function() {
    function ReportCapabilitySpend(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportCapabilitySpend.prototype.render = function() {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true&types[]=10&types[]=18&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(factSheetPromise)
            .then(function (data) {

                var fsIndex = new FactSheetIndex(data);

                for (var id in fsIndex.index.businessCapabilities) {
                    var item = fsIndex.index.businessCapabilities[id];
                    item['stats'] = {
                        'services' : [],
                        'serviceCost' : 0
                    };
                    item['serviceCost'] = 0;
                }

                for (var id in fsIndex.index.services) {
                    var ids = [];
                    var service = fsIndex.index.services[id];
                    if (service.serviceHasBusinessCapabilities && service.serviceHasBusinessCapabilities.length) {
                        ids = service.serviceHasBusinessCapabilities.map(function(item) {
                            return item.businessCapabilityID;
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
                        if (fsIndex.index.businessCapabilities[id]) {
                            fsIndex.index.businessCapabilities[id].stats.services.push(service.ID);
                            fsIndex.index.businessCapabilities[id].stats.serviceCost = serviceCost;
                        } else {
                            console.warn('Unable to find item with id = ' + id);
                        }
                    });

                }

                // products will be presented by react-bootstrap-table

                var list = fsIndex.getSortedList('businessCapabilities');

                var output = [];
                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1)  {
                        output.push({
                            name : list[i].fullName,
                            id : list[i].ID,
                            cost : list[i].stats.serviceCost,
                            count : list[i].stats.services.length,
                            avgCost : list[i].stats.services.length ? list[i].stats.serviceCost / list[i].stats.services.length : 0
                        });
                    }
                }

                function moneyFormatter(cell, row) {
                    return '&pound' + accounting.formatMoney(cell, "", 0, ",", ".");
                }

                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.id + '" target="_blank">' + cell + '</a>';
                }

                var options = {
                    sortName : 'cost',
                    sortOrder : 'desc'
                };

                var options = $.extend({}, BootstrapTable.defaultProps.options, options);

                ReactDOM.render(
                    <div>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} exportCSV={true} options={options}>
                            <TableHeaderColumn dataField="name" isKey={true} dataAlign="left" dataSort={true} dataFormat={link}>Business Capability</TableHeaderColumn>
                            <TableHeaderColumn dataField="count" width="200" dataSort={true}># of apps</TableHeaderColumn>
                            <TableHeaderColumn dataField="avgCost" width="200" dataSort={true} dataFormat={moneyFormatter}>Avg cost per app</TableHeaderColumn>
                            <TableHeaderColumn dataField="cost" width="200" dataSort={true} dataFormat={moneyFormatter}>Total cost all apps</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportCapabilitySpend;
})();