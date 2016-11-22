var ReportApplicationLifecycle = (function () {
    function ReportApplicationLifecycle(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportApplicationLifecycle.prototype.render = function () {
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
                return tagGroups;
            });

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true'
            + '&types[]=10&types[]=16&pageSize=-1'
            + '&filterRelations[]=serviceHasProjects&filterRelations[]=factSheetHasLifecycles'
            + '&filterAttributes[]=displayName'
            + '&filterAttributes[]=ID'
            + '&filterAttributes[]=fullName'
            + '&filterAttributes[]=resourceType'
            + '&filterAttributes[]=tags'
            )
            .then(function (response) {
                return response.data;
            });



        $.when(tagGroupPromise, factSheetPromise)
            .then(function (tagGroups, data) {
                var fsIndex = new FactSheetIndex(data);
                var list = fsIndex.getSortedList('services');

                var reportUtils = new ReportUtils();
              

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
           
                var projectTypes = tagGroups['Project Type'];
                var costCentres = tagGroups['Cost Centre'];
                var appTypes = tagGroups['Application Type'];
                var lifecycleArray = reportUtils.lifecycleArray();
                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1) {

                        var currentLifecycle = reportUtils.getCurrentLifecycle(list[i]);

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

                        var projects = [];
                        // Projects
                        for (var z = 0; z < list[i].serviceHasProjects.length; z++) {
                            var tmp = list[i].serviceHasProjects[z];
                            if (tmp) {
                                if (tmp.projectID && fsIndex.index.projects[tmp.projectID]) {

                                    var projectType = getTagFromGroup(fsIndex.index.projects[tmp.projectID], projectTypes)

                                    output.push({
                                        name: list[i].fullName,
                                        id: list[i].ID,
                                        costCentre: getTagFromGroup(list[i], costCentres),
                                        appType: getTagFromGroup(list[i], appTypes),
                                        market: market,
                                        projectId: tmp.projectID,
                                        projectName: fsIndex.index.projects[tmp.projectID].fullName,
                                        projectEffect: tmp.comment,
                                        projectType: projectType,
                                        lifecyclePhase: currentLifecycle ? currentLifecycle.phase : '',
                                        lifecycleStart: currentLifecycle ? currentLifecycle.startDate : ''
                                    });

                                    if (tmp.comment)
                                        projectEffects[tmp.comment] = tmp.comment;
                                }
                            }
                        }

                        if (list[i].serviceHasProjects.length == 0) {
                            output.push({
                                name: list[i].fullName,
                                id: list[i].ID,
                                costCentre: getTagFromGroup(list[i], costCentres),
                                appType: getTagFromGroup(list[i], appTypes),
                                market: market,
                                projectId: '',
                                projectName: '',
                                projectEffect: '',
                                projectType: '',
                                lifecyclePhase: currentLifecycle ? currentLifecycle.phase : '',
                                lifecycleStart: currentLifecycle ? currentLifecycle.startDate : ''
                            });
                        }


                    }
                }


                function link(cell, row) {
                    return '<a href="' + that.reportSetup.baseUrl + '/services/' + row.id + '" target="_blank">' + cell + '</a>';
                }

                function linkProject(cell, row) {
                    if (row.projectId)
                        return '<a href="' + that.reportSetup.baseUrl + '/projects/' + row.projectId + '" target="_blank">' + cell + '</a>';
                }

                ReactDOM.render(
                    <div>
                        <BootstrapTable data={output} striped={true} hover={true} search={true} pagination={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="market" width="80" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: markets }}>Market</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" dataAlign="left" dataSort={true} dataFormat={link} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Application Name</TableHeaderColumn>
                            <TableHeaderColumn dataField="costCentre" width="120" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(costCentres) }}>Cost Centre</TableHeaderColumn>
                            <TableHeaderColumn dataField="appType" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(appTypes) }}>App Type</TableHeaderColumn>
                            <TableHeaderColumn dataField="lifecyclePhase" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(lifecycleArray) }}>Phase</TableHeaderColumn>
                            <TableHeaderColumn dataField="lifecycleStart" width="100" dataAlign="left" dataSort={true} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Phase Start</TableHeaderColumn>
                            <TableHeaderColumn dataField="projectName" dataAlign="left" dataSort={true} dataFormat={linkProject} filter={{ type: "TextFilter", placeholder: "Please enter a value" }}>Project Name</TableHeaderColumn>
                            <TableHeaderColumn dataField="projectEffect" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(projectEffects) }}>Project Effect</TableHeaderColumn>
                            <TableHeaderColumn dataField="projectType" width="100" dataAlign="left" dataSort={true} filter={{ type: "SelectFilter", options: getLookup(projectTypes) }}>Project Type</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportApplicationLifecycle;
})();