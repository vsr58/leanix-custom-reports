$(function () {
  'use strict';

  var args = _.reduce(window.location.search.substring(1).split('&'), function (accu, kvp) {
    var splitted = kvp.split('=');
    accu[splitted[0]] = splitted[1];
    return accu;
  }, {});

  if (!args.baseUrl || !args.apiBaseUrl || !(args.token || args.apiKey)) {
    toastr.error('Not enough parameters provided!');
    return;
  }

  var baseUrl = decodeURIComponent(args.baseUrl);
  var apiBaseUrl = decodeURIComponent(args.apiBaseUrl);

  if (args.token) {
    var token = args.token;
  }
  else if (args.apiKey) {
    var apiKey = args.apiKey;
  }

  var type = 'services';
  if (args.type) {
    type = args.type;
  }

  $.ajaxSetup({
    beforeSend: function (xhr) {
      if (token) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      } else if (apiKey) {
        xhr.setRequestHeader('X-Api-Key', apiKey);
      }
    }
  });

  var configPromise = $.get(apiBaseUrl + '/config')
    .then(function (response) {
      var typeMap = Object.getOwnPropertyNames(response.objectTypes).reduce(function (accu, type) {
        var id = response.objectTypes[type].restResource;
        accu[id] = response.objectTypes[type];
        return accu;
      }, {});

      return typeMap;
    });

  var dataPromise = configPromise.then(function (typeMap) {
    var factSheetType = typeMap[type].ID;
    var url = apiBaseUrl + '/factsheets?relations=true&filterRelations[]=factSheetHasLifecycles&type=' + factSheetType + '&pageSize=-1';

    return $.get(url)
      .then(function (response) {
        return response.data;
        ;
      });
  });

  $.when(configPromise, dataPromise)
    .then(function (objectTypes, data) {
      var categories = ['2014-01-01', '2014-04-01', '2014-07-01', '2014-10-01',
        '2015-01-01', '2015-04-01', '2015-07-01', '2015-10-01',
        '2016-01-01', '2016-04-01', '2016-07-01', '2016-10-01',
        '2017-01-01', '2017-04-01', '2017-07-01', '2017-10-01',
        '2018-01-01', '2018-04-01', '2018-07-01', '2018-10-01'];

      var totalApps = [];
      var addedApps = [];
      var retiredApps = [];

      for (var i = 0; i < categories.length; i++) {

        var total = 0;
        var added = 0;
        var retired = 0;
        for (var j = 0; j < data.length; j++) {
          if (data[j].tags.indexOf('Application') != -1) {
            var nextLc = getLifecycleAt(data[j], categories[i + 1]);
            var lc = getLifecycleAt(data[j], categories[i]);
            if (lc) {
              if (lc.phase == 'Phase In' || lc.phase == 'Active' || lc.phase == 'Phase Out') {
                total++;
                if (nextLc && nextLc.phase == 'End of Life') {
                  retired++;
                }
              } else if (lc.phase == 'Plan' && nextLc && nextLc.phase != 'Plan') {
                added++;
              }
            } else if (nextLc) {
              if (nextLc.phase == 'End of Life') {
                retired++;
              } else if (nextLc.phase != 'Plan') {
                added++;
              }
            }
          }
        }
        totalApps.push(total);
        addedApps.push(added);
        retiredApps.push(-1 * retired);
      }

      display(categories, addedApps, retiredApps, totalApps);
    });

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

  var getLifecycleAt = function (item, date) {
    item.factSheetHasLifecycles = item.factSheetHasLifecycles.sort(function (a, b) {
      return a.lifecycleStateID > b.lifecycleStateID;
    });

    var current = null;

    for (var i = 0; i < item.factSheetHasLifecycles.length; i++) {
      var curDate = Date.parse(item.factSheetHasLifecycles[i].startDate);
      if (curDate <= Date.parse(date)) {
        current = {
          phase: lifecycles[item.factSheetHasLifecycles[i].lifecycleStateID],
          startDate: formattedDate(curDate)
        };
      }
    }

    return current;
  };




  function display(categories, newApps, retiredApps, totalApps) {

    var myChart = Highcharts.chart('container', {
        chart: {
          zoomType: 'xy'
        },
        title: {
          text: 'IT Application Burndown - Count'
        },
        xAxis: [{
          categories: categories,
          crosshair: true
        }],
        yAxis: [{ // Primary yAxis
          labels: {
            format: '{value}',
            style: {
              color: Highcharts.getOptions().colors[1]
            }
          },
          title: {
            text: 'Count of IT Application Transitions',
            style: {
              color: Highcharts.getOptions().colors[1]
            }
          }
        }, { // Secondary yAxis
            title: {
              text: 'Count of IT Applications in Production',
              style: {
                color: Highcharts.getOptions().colors[0]
              }
            },
            labels: {
              format: '{value}',
              style: {
                color: Highcharts.getOptions().colors[0]
              }
            },
            opposite: true
          }],
        tooltip: {
          shared: true
        },
        legend: {
          layout: 'vertical',
          align: 'right',
          x: -120,
          verticalAlign: 'top',
          y: 50,
          floating: true,
          backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
        },
        series: [{
          name: 'Total Production',
          type: 'spline',
          yAxis: 1,
          data: totalApps,
        },
          {
            name: 'Retired Applications',
            type: 'column',
            data: retiredApps,
            color: 'green'
          },

          {
            name: 'New Applications',
            type: 'column',
            data: newApps,
            color: 'red'
          }]
      });
    }
});
