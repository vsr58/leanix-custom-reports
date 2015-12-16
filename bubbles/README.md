# Bubbles report

The bubbles report shows parent-child related Fact Sheets from leanIX in form of a a hierarchical bubbles. Each bubble clusters Fact Sheets which have the same parent and the user is able to drilldown into each bubble to see the child Fact Sheets.

The report is parameterized via url query parameters:

* baseUrl: Base url to the instance properly encoded to be used as query parameter (e.g. https%3A%2F%2Fapp.leanix.net)
* ws: workspace name (e.g. demo)
* apiKey: apiKey to access the leanIX API
* (optional) fsType: The type of Fact Sheet as used in the REST API to be shown (e.g. businessCapabilities)

### Example:
https://leanix.github.io/leanix-custom-reports/master/bubbles/index.html?baseUrl=https%3A%2F%2Ftest-app.leanix.net&ws=demo&apiKey=yourApiKey&fsType=businessCapabilities
