# Burndown report

The report shows the lifecyle of LeanIX factsheets in a burndown chart.

The report is parameterized via url query parameters:

* baseUrl: Base url to the instance properly encoded to be used as query parameter (e.g. https%3A%2F%2Fapp.leanix.net)
* ws: workspace name (e.g. demo)
* apiKey: apiKey to access the leanIX API
* (optional) fsType: The type of Fact Sheet as used in the REST API to be shown (e.g. businessCapabilities)
* (optional) tagFilter: The type of tag to be shown 

### Example:
https://leanix.github.io/leanix-custom-reports/master/burndown/index.html?baseUrl=https%3A%2F%2Ftest-app.leanix.net&ws=demo&apiKey=yourApiKey&type=services
