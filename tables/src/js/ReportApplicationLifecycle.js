var ReportApplicationLifecycle = (function() {
    function ReportApplicationLifecycle(reportSetup, tagFilter, title) {
        this.reportSetup = reportSetup;
        this.tagFilter = tagFilter;
        this.title = title;
    }

    ReportApplicationLifecycle.prototype.render = function() {
        var that = this;

        var factSheetPromise = $.get(this.reportSetup.apiBaseUrl + '/factsheets?relations=true&types[]=10&types[]=16&pageSize=-1')
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

                var getCurrentLifecycle = function(item) {
                    item.factSheetHasLifecycles = item.factSheetHasLifecycles.sort(function(a, b) {
                        return a.lifecycleStateID > b.lifecycleStateID;
                    });

                    var current = null;

                    for (var i = 0; i < item.factSheetHasLifecycles.length; i++) {
                        var curDate = Date.parse(item.factSheetHasLifecycles[i].startDate);
                        if (curDate <= Date.now()) {
                            current = {
                                phase : lifecycles[item.factSheetHasLifecycles[i].lifecycleStateID],
                                startDate : formattedDate(curDate)
                            };
                        }
                    }

                    return current;
                };

                var getTagFromGroup = function(object, validTags) {
                    var cc = object.tags.filter(function(x) {
                        if (validTags.indexOf(x) >= 0)
                            return true;
                        else
                            return false;
                    });

                    if (cc.length)
                        return cc[0];

                    return '';
                };

                var getLookup = function(data) {
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
                for (var i = 0; i < list.length; i++) {
                    if (!that.tagFilter || list[i].tags.indexOf(that.tagFilter) != -1)  {

                        var currentLifecycle = getCurrentLifecycle(list[i]);

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

                                    projects.push({
                                        id: tmp.projectID,
                                        name: fsIndex.index.projects[tmp.projectID].fullName,
                                        effect: tmp.comment,
                                        type: getTagFromGroup(fsIndex.index.projects[tmp.projectID], ['Transformation', 'Legacy'])
                                    })
                                }
                            }
                        }

                        output.push({
                            name : list[i].fullName,
                            id : list[i].ID,
                            costCentre : getTagFromGroup(list[i], costCentres),
                            appType : getTagFromGroup(list[i], appTypes),
                            market : market,
                            projectId : projects.length ? projects[0].id : '',
                            projectName : projects.length ? projects[0].name : '',
                            projectEffect : projects.length ? projects[0].effect : '',
                            projectType : projects.length ? projects[0].type : '',
                            lifecyclePhase : currentLifecycle ? currentLifecycle.phase : '',
                            lifecycleStart : currentLifecycle ? currentLifecycle.startDate : ''
                        });

                        if (projects.length) {
                            if (projects[0].effect)
                                projectEffects[projects[0].effect] = projects[0].effect;

                            if (projects[0].type)
                                projectTypes[projects[0].type] = projects[0].type;
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
                        <BootstrapTable data={output} striped={true} hover={true} search={true} exportCSV={true}>
                            <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn dataField="market" width="80" dataAlign="left" dataSort={true} filter={{type: "SelectFilter", options: markets}}>Market</TableHeaderColumn>
                            <TableHeaderColumn dataField="name" dataAlign="left" dataSort={true} dataFormat={link} filter={{type: "TextFilter", placeholder: "Please enter a value"}}>Application Name</TableHeaderColumn>
                            <TableHeaderColumn dataField="costCentre" width="120" dataAlign="left" dataSort={true} filter={{type: "SelectFilter", options: getLookup(costCentres)}}>Cost Centre</TableHeaderColumn>
                            <TableHeaderColumn dataField="appType" width="100" dataAlign="left" dataSort={true} filter={{type: "SelectFilter", options: getLookup(appTypes)}}>App Type</TableHeaderColumn>
                            <TableHeaderColumn dataField="lifecyclePhase" width="100" dataAlign="left" dataSort={true} filter={{type: "SelectFilter", options: getLookup(lifecycleArray)}}>Phase</TableHeaderColumn>
                            <TableHeaderColumn dataField="lifecycleStart" width="100" dataAlign="left" dataSort={true} filter={{type: "TextFilter", placeholder: "Please enter a value"}}>Phase Start</TableHeaderColumn>
                            <TableHeaderColumn dataField="projectName" dataAlign="left" dataSort={true} dataFormat={linkProject} filter={{type: "TextFilter", placeholder: "Please enter a value"}}>Project Name</TableHeaderColumn>
                            <TableHeaderColumn dataField="projectEffect" width="100" dataAlign="left" dataSort={true} filter={{type: "SelectFilter", options: projectEffects}}>Project Effect</TableHeaderColumn>
                            <TableHeaderColumn dataField="projectType" width="100" dataAlign="left" dataSort={true} filter={{type: "SelectFilter", options: projectTypes}}>Project Type</TableHeaderColumn>
                        </BootstrapTable>
                    </div>,
                    document.getElementById("app")
                );
            });
    };

    return ReportApplicationLifecycle;
})();