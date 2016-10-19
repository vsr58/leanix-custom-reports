var ReportApplicationPortfolio = (function () {
    function ReportApplicationPortfolio(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportApplicationPortfolio.prototype.render = function () {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl +
            '/factsheets?relations=true&types[]=10&types[]=18&types[]=19' +
            '&filterRelations[]=serviceHasBusinessCapabilities' +
            '&filterRelations[]=factSheetHasLifecycles&' +
            '&filterRelations[]=serviceHasResources&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(factSheetPromise)
            .then(function (data) {

                var fsIndex = new FactSheetIndex(data);

                var list = fsIndex.getSortedList('services');

                var lifecycles = {
                    1: "Plan",
                    2: "Phase In",
                    3: "Active",
                    4: "Phase Out",
                    5: "End of Life"
                };

                var lifecycleArray = [];
                for (var key in lifecycles) {
                    lifecycleArray.push(lifecycles[key]);
                }

                function formattedDate(date) {
                    var d = new Date(date || Date.now()),
                        month = '' + (d.getMonth() + 1),
                        day = '' + d.getDate(),
                        year = d.getFullYear();

                    if (month.length < 2) month = '0' + month;
                    if (day.length < 2) day = '0' + day;

                    return [month, day, year].join('/');
                }

                var getCurrentLifecycle = function (item) {
                    item.factSheetHasLifecycles = item.factSheetHasLifecycles.sort(function (a, b) {
                        return a.lifecycleStateID > b.lifecycleStateID;
                    });

                    var current = null;

                    for (var i = 0; i < item.factSheetHasLifecycles.length; i++) {
                        var curDate = Date.parse(item.factSheetHasLifecycles[i].startDate);
                        if (curDate <= Date.now()) {
                            current = {
                                phase: lifecycles[item.factSheetHasLifecycles[i].lifecycleStateID],
                                startDate: formattedDate(curDate)
                            };
                        }
                    }

                    return current;
                };

                var getTagFromGroup = function (object, validTags) {
                    var cc = object.tags.filter(function (x) {
                        if (validTags.indexOf(x) >= 0)
                            return true;
                        else
                            return false;
                    });

                    if (cc.length)
                        return cc[0];

                    return '';
                };

                var getLookup = function (data) {
                    var ret = {};
                    for (var i = 0; i < data.length; i++) {
                        ret[data[i]] = data[i];
                    }

                    return ret;
                };

                var output = [];
                var markets = {};
                var projectEffects = {};
                var projectTypes = {};

                var costCentres = ['IT', 'Network', 'Remedy', 'Marketing'];
                var appTypes = ['Group owned - locally used', 'Locally owned'];
                var appTypes = ['Group owned - locally used', 'Locally owned'];

                var businessValue = {
                    4: "4-High",
                    3: "3-Med/High",
                    2: "2-Low/Med",
                    1: "1-Low"
                };
                var businessValueOptions = [];
                for (var key in businessValue) {
                    businessValueOptions.push(businessValue[key]);
                }

                var technicalCondition = {
                    4: "4-High",
                    3: "3-Med/High",
                    2: "2-Low/Med",
                    1: "1-Low"
                };
                var technicalConditionOptions = [];
                for (var key in technicalCondition) {
                    technicalConditionOptions.push(technicalCondition[key]);
                }



                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1) {

                        var currentLifecycle = getCurrentLifecycle(list[i]);



                        var lifecycleArray = [];
                        for (var key in lifecycles) {
                            lifecycleArray.push(lifecycles[key]);
                        }



                        // Extract market
                        var re = /^([A-Z]{2,3})_/;
                        var market = '';

                        if ((m = re.exec(list[i].fullName)) !== null) {
                            if (m.index === re.lastIndex) {
                                re.lastIndex++;
                            }
                            // View your result using the m-variable.
                            market = m[1];
                            if (market)
                                markets[market] = market;
                        }

                        var resources = [];
                        var remedy = [];
                        var support = [];
                        for (var z = 0; z < list[i].serviceHasResources.length; z++) {
                            var tmp = list[i].serviceHasResources[z];
                            if (tmp) {
                                if (tmp.resourceID && fsIndex.index.resources[tmp.resourceID]) {

                                    if (fsIndex.index.resources[tmp.resourceID].tags.indexOf('Remedy Business Service') != -1) {
                                        remedy.push({
                                            id: tmp.resourceID,
                                            name: fsIndex.index.resources[tmp.resourceID].fullName,
                                        });
                                    } else if (fsIndex.index.resources[tmp.resourceID].objectCategoryID == 3) {
                                        support.push({
                                            id: tmp.resourceID,
                                            name: fsIndex.index.resources[tmp.resourceID].fullName,
                                        });
                                    } else {
                                        resources.push({
                                            id: tmp.resourceID,
                                            name: fsIndex.index.resources[tmp.resourceID].fullName,
                                        });
                                    }
                                }
                            }
                        }

                        var cobras = [];
                        for (var z = 0; z < list[i].serviceHasBusinessCapabilities.length; z++) {
                            var tmp = list[i].serviceHasBusinessCapabilities[z];
                            if (tmp) {
                                if (tmp.businessCapabilityID && fsIndex.index.businessCapabilities[tmp.businessCapabilityID] &&
                                    fsIndex.index.businessCapabilities[tmp.businessCapabilityID].tags.indexOf('Cobra') != -1) {

                                    cobras.push({
                                        id: tmp.businessCapabilityID,
                                        name: fsIndex.index.businessCapabilities[tmp.businessCapabilityID].fullName,
                                    })
                                }
                            }
                        }


                        output.push({
                            name: list[i].fullName,
                            description: list[i].description,
                            cobraId: cobras.length ? cobras[0].id : '',
                            cobraName: cobras.length ? cobras[0].name : '',
                            id: list[i].ID,
                            costCentre: getTagFromGroup(list[i], costCentres),
                            market: market,
                            admScope: getTagFromGroup(list[i], 'AD&M Scope') ? 'Yes' : 'No',
                            cotsPackage: getTagFromGroup(list[i], 'COTS Package') ? 'Yes' : 'No',
                            resourceId: resources.length ? resources[0].id : '',
                            resourceName: resources.length ? resources[0].name : '',
                            remedyID: remedy.length ? remedy[0].id : '',
                            remedyName: remedy.length ? remedy[0].name : '',
                            supportID: support.length ? support[0].id : '',
                            supportName: support.length ? support[0].name : '',

                            // TODO
                            customisation: 'TBD',
                            businessValue: list[i].functionalSuitabilityID ? businessValue[list[i].functionalSuitabilityID] : '',
                            technicalCondition: list[i].technicalSuitabilityID ? technicalCondition[list[i].technicalSuitabilityID] : '',

                            // TODO
                            complexity: 'TBD',


                            appType: getTagFromGroup(list[i], appTypes),

                            lifecyclePhase: currentLifecycle ? currentLifecycle.phase : '',
                            lifecycleStart: currentLifecycle ? currentLifecycle.startDate : ''
                        });


                    }
                }


                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/services/' + row.id + '" target="_blank">' + cell + '</a>';
                }

                function linkResource(cell, row) {
                    if (row.resourceId)
                        return '<a href="' + that.reportSetup.baseUrl + '/resources/' + row.resourceId + '" target="_blank">' + cell + '</a>';
                }

                function linkRemedy(cell, row) {
                    if (row.remedyID)
                        return '<a href="' + that.reportSetup.baseUrl + '/resources/' + row.remedyID + '" target="_blank">' + cell + '</a>';
                }

                function linkSupport(cell, row) {
                    if (row.supportID)
                        return '<a href="' + that.reportSetup.baseUrl + '/resources/' + row.supportID + '" target="_blank">' + cell + '</a>';
                }

                function linkBC(cell, row) {
                    if (row.cobraId)
                        return '<a href="' + that.reportSetup.baseUrl + '/businessCapabilities/' + row.cobraId + '" target="_blank">' + cell + '</a>';
                }

                ReactDOM.render(
                    <div>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} pagination={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" width="150" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Application Name</TableHeaderColumn>
                            <TableHeaderColumn dataField="description" width="150" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Description</TableHeaderColumn>
                            <TableHeaderColumn dataField="cobraName" width="150" dataAlign="left" dataSort={true} dataFormat={linkBC} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>COBRA</TableHeaderColumn>
                            <TableHeaderColumn dataField="lifecyclePhase" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(lifecycleArray) }}>Phase</TableHeaderColumn>
                            <TableHeaderColumn dataField="market" width="80" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: markets }}>Market</TableHeaderColumn>
                            <TableHeaderColumn dataField="costCentre" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(costCentres) }}>Cost Centre</TableHeaderColumn>
                            <TableHeaderColumn dataField="admScope" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(['Yes', 'No']) }}>In AD&M Scope</TableHeaderColumn>
                            <TableHeaderColumn dataField="cotsPackage" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(['Yes', 'No']) }}>COTS Package</TableHeaderColumn>
                            <TableHeaderColumn dataField="resourceName" width="150" dataAlign="left" dataSort={true} dataFormat={linkResource} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>COTS Software</TableHeaderColumn>
                            <TableHeaderColumn dataField="remedyName" width="150" dataAlign="left" dataSort={true} dataFormat={linkRemedy} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Remedy Business Service</TableHeaderColumn>
                            <TableHeaderColumn dataField="supportName" width="150" dataAlign="left" dataSort={true} dataFormat={linkSupport} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Supported By</TableHeaderColumn>
                            <TableHeaderColumn dataField="customisation" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(['Yes', 'No']) }}>Level of Customisation</TableHeaderColumn>
                            <TableHeaderColumn dataField="businessValue" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(businessValueOptions) }}>Business Value</TableHeaderColumn>
                            <TableHeaderColumn dataField="technicalCondition" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(technicalConditionOptions) }}>Technical Condition</TableHeaderColumn>
                            <TableHeaderColumn dataField="complexity" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(technicalConditionOptions) }}>Application Complexity</TableHeaderColumn>


                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportApplicationPortfolio;
})();