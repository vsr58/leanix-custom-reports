# Bubbles report

The bubbles report shows parent-child related Fact Sheets from leanIX in form of a a hierarchical bubbles. Each bubble clusters Fact Sheets which have the same parent and the user is able to drilldown into each bubble to see the child Fact Sheets.

The report is parameterized via url query parameters:

* baseUrl: The base url to the instance (e.g. app.leanix.net)
* ws: The workspace name (e.g. demo)
* apiKey: The apiKey to access the leanIX API
* (optional) fsType: The type of Fact Sheet to be shown (e.g. businessCapabilities)