(function () {
  'use strict';

  /* Split the incoming query string after the "#' */
  var args = _.reduce(window.location.hash.substring(1).split('&'), function (accu, kvp) {
    var splitted = kvp.split('=');
    accu[splitted[0]] = splitted[1];
    return accu;
  }, {});

  if (!args.baseUrl || !args.apiBaseUrl || !args.token) {
    alert('Missing baseUrl, apiBaseUrl or token.');
    return;
  }

  var baseUrl = decodeURIComponent(args.baseUrl);
  var apiBaseUrl = decodeURIComponent(args.apiBaseUrl);
  var token = args.token;

  /* Always include token into auth header */
  $.ajaxSetup({
    beforeSend : function(xhr) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    }
  });

  /* Print out the results as table */
  $.get(apiBaseUrl + '/services').then(function(response) {
    var content = "<table>";
    for(var i=0; i<response.length; i++){
      content += '<tr><td>' + response[i].displayName + '</td></tr>';
    }
    content += "</table>";

    $('#target').append(content);
  });

})();