var ReportDataQuality = (function () {
    function ReportDataQuality(reportSetup, tagFilter) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
    }

    ReportDataQuality.prototype.render = function () {
        var that = this;

        var tagGroupPromise = $.get(this.reportSetup.apiBaseUrl + '/tagGroups')
            .then(function (response) {
                var tagGroups = {};
                for (var i = 0; i < response.length; i++) {
                    tagGroups[response[i]['name']] = [];
                    for (var j = 0; j < response[i]['tags'].length; j++) {
                        tagGroups[response[i]['name']].push(response[i]['tags'][j]['name']);
                    }
                }

                var tagIDs = {};
                for (var i = 0; i < response.length; i++) {
                    for (var j = 0; j < response[i]['tags'].length; j++) {
                        var tag = response[i]['tags'][j];
                        tagIDs[tag['name']] = tag['ID'];
                    }
                }
                return { ids: tagIDs, groups: tagGroups };
            });

        var rolePromise = $.get(this.reportSetup.apiBaseUrl + '/userRoleDetails')
            .then(function (response) {
                var roleIDs = {};
                for (var i = 0; i < response.length; i++) {
                    roleIDs[response[i]['name']] = response[i]['ID'];
                }
                return roleIDs;
            });

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true'
            + '&types[]=10&types[]=12&types[]=16&types[]=18&types[]=19'
            + '&filterRelations[]=factSheetHasLifecycles'
            + '&filterRelations[]=serviceHasConsumers'
            + '&filterRelations[]=serviceHasProjects'
            + '&filterRelations[]=serviceHasBusinessCapabilities'
            + '&filterRelations[]=serviceHasResources'
            + '&filterRelations[]=userSubscriptions'
            + '&filterAttributes[]=description'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=functionalSuitabilityID'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=objectCategoryID'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'
            + '&filterAttributes[]=technicalSuitabilityID'


            + '&pageSize=-1')
            .then(function (response) {
                return response.data;
            });

        $.when(tagGroupPromise, rolePromise, factSheetPromise)
            .then(function (tagGroupData, roleIDs, data) {

                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('services');
                var reportUtils = new ReportUtils();
                var tagIDs = tagGroupData.ids;
                var tagGroups = tagGroupData.groups;

                var getLookup = function (data) {
                    var ret = {};
                    for (var i = 0; i < data.length; i++) {
                        ret[data[i]] = data[i];
                    }

                    return ret;
                };

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


                var output = [];
                var markets = {};

                var groupedByMarket = {};

                function getGreenToRed(percent) {
                    var r = percent < 50 ? 255 : Math.floor(255 - (percent * 2 - 100) * 255 / 100);
                    var g = percent > 50 ? 255 : Math.floor((percent * 2) * 255 / 100);
                    return 'rgb(' + r + ',' + g + ',0)';
                }

                for (var i = 0; i < list.length; i++) {
                    var service = list[i];
                    if (service.tags.indexOf('Application') != -1 && service.tags.indexOf('IT') != -1) {
                        
                        for (var z = 0; z < service.serviceHasConsumers.length; z++) {
                            var tmp = service.serviceHasConsumers[z];
                            if (tmp) {
                                if (tmp.consumerID && fsIndex.index.consumers[tmp.consumerID]) {

                                    if (!(tmp.consumerID in groupedByMarket)) {
                                        groupedByMarket[tmp.consumerID] = [];
                                        var market = fsIndex.index.consumers[tmp.consumerID].displayName;
                                        markets[market] = market;
                                    }

                                    groupedByMarket[tmp.consumerID].push(service);
                                }
                            }
                        }
                    }
                }

                for (var key in groupedByMarket) {
                    var compliant = [];
                    var noncompliant = [];
                    
                    rule = 'Adding applications, but no project';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var service = groupedByMarket[key][i];

                        if (hasActiveLifecycle(service)) {
                            var c = false;
                            for (var j = 0; j < service.serviceHasProjects.length; j++) {
                                var serviceHasProject = service.serviceHasProjects[j];
                                if (serviceHasProject && serviceHasProject.projectID) {
                                    var proj = fsIndex.index.projects[serviceHasProject.projectID];
                                    if (proj) {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=2&lifecycle[]=3&serviceHasProjects[]=na'
                    );

                    rule = 'Adding applications, but project impact != adding';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var service = groupedByMarket[key][i];

                        if (hasActiveLifecycle(service)) {
                            var c = false;
                            for (var j = 0; j < service.serviceHasProjects.length; j++) {
                                var serviceHasProject = service.serviceHasProjects[j];
                                if (serviceHasProject && serviceHasProject.projectID) {
                                    var proj = fsIndex.index.projects[serviceHasProject.projectID];
                                    if (proj && serviceHasProject.projectImpactID == "1") {
                                        c = true;
                                    }
                                    if (c) compliant[rule]++; else noncompliant[rule]++;
                                    break;
                                }
                            }
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=2&lifecycle[]=3&serviceHasProjects[]=na&serviceHasProjects_op=NOR'
                    );


                    rule = 'Retiring applications, but no project';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var service = groupedByMarket[key][i];

                        if (isRetired(service)) {
                            var c = false;
                            for (var j = 0; j < service.serviceHasProjects.length; j++) {
                                var serviceHasProject = service.serviceHasProjects[j];
                                if (serviceHasProject && serviceHasProject.projectID) {
                                    var proj = fsIndex.index.projects[serviceHasProject.projectID];
                                    if (proj) {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=5&lifecycle_data=1995-01-01_to_2022-11-01&serviceHasProjects[]=na'
                    );

                    rule = 'Retiring applications, but project impact != retired';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var service = groupedByMarket[key][i];

                        if (isRetired(service)) {
                            var c = false;
                            for (var j = 0; j < service.serviceHasProjects.length; j++) {
                                var serviceHasProject = service.serviceHasProjects[j];
                                if (serviceHasProject && serviceHasProject.projectID) {
                                    var proj = fsIndex.index.projects[serviceHasProject.projectID];
                                    if (proj && serviceHasProject.projectImpactID == "3") {
                                        c = true;
                                    }
                                    if (c) compliant[rule]++; else noncompliant[rule]++;
                                    break;
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=5&lifecycle_data=1995-01-01_to_2022-11-01&serviceHasProjects[]=na&serviceHasProjects_op=NOR'
                    );

                    rule = 'has COBRA';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            var c = false;
                            for (var z = 0; z < groupedByMarket[key][i].serviceHasBusinessCapabilities.length; z++) {
                                var tmp = groupedByMarket[key][i].serviceHasBusinessCapabilities[z];
                                if (tmp && tmp.businessCapabilityID) {
                                    var bc = fsIndex.index.businessCapabilities[tmp.businessCapabilityID];
                                    if (bc && bc.tags.indexOf('AppMap') != -1) {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&serviceHasBusinessCapabilities[]=tag-' + tagIDs['AppMap'] + '&serviceHasBusinessCapabilities_op=NOR&tags_service_type[]=Application');

                    rule = 'has COTS Package';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            if (reportUtils.getTagFromGroup(groupedByMarket[key][i], 'COTS Package')) 
                                compliant[rule]++; 
                            else 
                                noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&tags_cots_package[]=COTS+Package&tags_cots_package_op=NOR&serviceHasBusinessCapabilities_op=NOR&tags_service_type[]=Application');

                    rule = 'has Software Product';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            var c = false;
                            for (var z = 0; z < groupedByMarket[key][i].serviceHasResources.length; z++) {
                                var tmp = groupedByMarket[key][i].serviceHasResources[z];
                                if (tmp && tmp.resourceID) {
                                    var resource = fsIndex.index.resources[tmp.resourceID];
                                    if (resource && resource.objectCategoryID == 1) {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&serviceHasSoftware[]=na');

                    rule = 'has Description';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            if (groupedByMarket[key][i].description) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant, 'lifecycle[]=3&lifecycle_data=today&quality[]=4');

                    rule = 'has Lifecycle';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i])) compliant[rule]++; else noncompliant[rule]++;
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant, 'quality[]=5');


                    rule = 'has IT Owner';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            var c = false;
                            for (var j = 0; j < groupedByMarket[key][i].userSubscriptions.length; j++) {
                                var subscription = groupedByMarket[key][i].userSubscriptions[j];
                                for (var k = 0; k < subscription.roleDetails.length; k++) {
                                    if (subscription.roleDetails[k] == 'IT Owner') {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }

                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&subscriptions[]=na&subscriptions_data=r_' + roleIDs['IT Owner'] + '&type_op=OR&lifecycle_op=OR&subscriptions_op=OR&serviceHasConsumers_op=OR');

                    rule = 'has SPOC';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            var c = false;
                            for (var j = 0; j < groupedByMarket[key][i].userSubscriptions.length; j++) {
                                var subscription = groupedByMarket[key][i].userSubscriptions[j];
                                for (var k = 0; k < subscription.roleDetails.length; k++) {
                                    if (subscription.roleDetails[k] == 'SPOC') {
                                        c = true;
                                        break;
                                    }
                                }
                            }
                            if (c) compliant[rule]++; else noncompliant[rule]++;
                        }
                    }

                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&subscriptions[]=na&subscriptions_data=r_' + roleIDs['SPOC'] + '&type_op=OR&lifecycle_op=OR&subscriptions_op=OR&serviceHasConsumers_op=OR');

                    rule = 'has Business Value';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var lifecycle = reportUtils.getCurrentLifecycle(groupedByMarket[key][i]);
                        if (lifecycle && lifecycle.phaseID == 3) {
                            if (groupedByMarket[key][i].functionalSuitabilityID)
                                compliant[rule]++; else noncompliant[rule]++;
                        }

                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&serviceHasFunctionalSuitability[]=na&serviceHasFunctionalSuitability_op=OR');

                    rule = 'has Technical Condition';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        var lifecycle = reportUtils.getCurrentLifecycle(groupedByMarket[key][i]);
                        if (lifecycle && lifecycle.phaseID == 3) {
                            if (groupedByMarket[key][i].technicalSuitabilityID)
                                compliant[rule]++; else noncompliant[rule]++;
                        }

                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&serviceHasTechnicalSuitability[]=na&serviceHasTechnicalSuitability_op=OR');

                    rule = 'has Cost Centre';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var i = 0; i < groupedByMarket[key].length; i++) {
                        if (reportUtils.getCurrentLifecycle(groupedByMarket[key][i]) && reportUtils.getCurrentLifecycle(groupedByMarket[key][i]).phaseID == 3) {
                            if (reportUtils.getTagFromGroup(groupedByMarket[key][i], tagGroups['CostCentre'])) 
                                compliant[rule]++; 
                            else 
                                noncompliant[rule]++;
                        }
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant,
                        'lifecycle[]=3&lifecycle_data=today&tags_cotscentre[]=na&serviceHasBusinessCapabilities_op=NOR&tags_service_type[]=Application');

                    rule = 'Overall Quality';
                    compliant[rule] = 0;
                    noncompliant[rule] = 0;
                    for (var c in compliant) {
                        if (c != rule) compliant[rule] += compliant[c];
                    }
                    for (var n in noncompliant) {
                        if (n != rule) noncompliant[rule] += noncompliant[n];
                    }
                    pushToOutput(output, key, rule, compliant, noncompliant);

                }

                function hasActiveLifecycle(service) {
                    var hasActiveLifecycle = false;

                    var current = reportUtils.getCurrentLifecycle(service);
                    if (current && current.phaseID > 1 && current.phaseID < 4) {
                        hasActiveLifecycle = true;
                    }
                    return hasActiveLifecycle;
                }

                function isRetired(service) {
                    var isRetired = false;
                    for (var j = 0; j < service.factSheetHasLifecycles.length; j++) {
                        if (service.factSheetHasLifecycles[j].lifecycleStateID == 5) {
                            isRetired = true;
                            break;
                        }
                    }
                    return isRetired;
                }

                function pushToOutput(output, key, rule, compliant, noncompliant, url) {
                    output.push({
                        rule: rule,
                        id: key,
                        market: fsIndex.index.consumers[key] ? fsIndex.index.consumers[key].displayName : '',
                        compliant: compliant[rule],
                        noncompliant: noncompliant[rule],
                        percentage: 100 - Math.floor(noncompliant[rule] / (compliant[rule] + noncompliant[rule]) * 100),
                        url: url ? 'type=10&serviceHasConsumers[]=' + key + '&tags_costcentre[]=IT&' + url : ''
                    });

                }

                function link(cell, row) {
                    if (row.url)
                        return '<a href="' + that.reportSetup.baseUrl + '/inventory?' + row.url + '" target="_blank">' + cell + '</a>';
                    else return cell;
                }


                function percentage(cell, row) {
                    return '<div class="percentage" style="background-color: ' + getGreenToRed(cell) + ';">' + cell + ' %</div>';
                }

                function enumFormatter(cell, row, enumObject) {
                    return enumObject[cell];
                }

                ReactDOM.render(
                    <div className="report-data-quality">
                        <BootstrapTable data={output} striped={false} hover={true} search={true} condensed={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="market" width="80" dataAlign="left" dataSort={false} filterFormatted dataFormat={enumFormatter} formatExtraData={markets} filter={{ type: "SelectFilter", options: markets }}>Market</TableHeaderColumn>
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