'use strict';

var args = _.reduce(window.location.search.substring(1).split('&'), function (accu, kvp) {
  var splitted = kvp.split('=');
  accu[splitted[0]] = splitted[1];
  return accu;
}, {});

var baseUrl = decodeURIComponent(args.baseUrl);
var apiKey = args.apiKey;
var workspace = args.ws;
var fsType = 'businessCapabilities';

if (args.fsType) {
  fsType = args.fsType;
} 

var margin = 20,
    diameter = 700;

var color = d3.scale.linear()
    .domain([-1, 5])
    .range(["hsl(360, 0%, 90%)", "hsl(360, 0%, 10%)"])
    .interpolate(d3.interpolateHcl);

var pack = d3.layout.pack()
    .padding(2)
    .size([diameter - margin, diameter - margin])
    .value(function(d) { return d.size; })

var svg = d3.select("#container")
  .append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
  .append("g")
    .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

var apiBaseUrl = baseUrl + '/' + workspace + '/api/v1';

var configPromise = $.get(apiBaseUrl + '/config?apiKey=' + apiKey)
  .then(function (response) {
    var typeMap = Object.getOwnPropertyNames(response.objectTypes).reduce(function (accu, type) {
      var id = response.objectTypes[type].restResource;
      accu[id] = response.objectTypes[type];
      return accu;
    }, {});

    return typeMap;
  });

var treeDataPromise = configPromise.then(function (typeMap) {
  var factSheetType = typeMap[fsType].ID;
  var url = apiBaseUrl + '/factsheets?relations=true&apiKey=' + apiKey + '&type=' + factSheetType + '&pageSize=-1';

  return $.get(url)
  .then(function (response) {
    var data = response.data;
    var idMap = {};
    for (var i = 0; i < data.length; i++) {
        idMap[data[i].ID] = data[i];
    };

    var treeData = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i].level === 0) 
      treeData.push(buildTree(idMap, data[i].ID));
    };

    return treeData;
  });
});

$.when(configPromise, treeDataPromise)
.then(function (objectTypes, treeData) {
  var typeConfig = objectTypes[fsType];
  $('#headline').text(typeConfig.name);
  display({ name: fsType, children: treeData }, typeConfig);
});

function buildTree (map, id) {
  var obj = map[id];
  if (!obj) { 
    return { name: id + ' not found', children: [] }; 
  }
  var children = [];
  if (obj.factSheetHasChildren) {
    for (var i = 0; i < obj.factSheetHasChildren.length; i++) {
      var childId = obj.factSheetHasChildren[i].factSheetID;
      var child = buildTree(map, childId);
      children.push(child);
    };
  }

  var size = 1;
  if (obj.serviceHasBusinessCapabilities) {
    //size = obj.serviceHasBusinessCapabilities.length;
  }

  return {
    ID: obj.ID,
    name: obj.name,
    children: children,
    size: size
  };
}

function display (root, typeConfig) {
  var focus = root,
      nodes = pack.nodes(root),
      view;

  var circle = svg.selectAll("circle")
      .data(nodes)
    .enter().append("circle")
      .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
      .attr('testid', function (d) { return d.ID; })
      .style("fill", function(d) { return d.children ? color(d.depth) : typeConfig.color; })
      .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); })
      .on("mouseover", function(d) { d3.event.stopPropagation(); });

  var text = svg.selectAll("text")
      .data(nodes)
    .enter().append("text")
      .attr("class", "label")
      .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
      .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
      .text(function(d) { return d.name; });

  var node = svg.selectAll("circle,text");

  d3.select("body")
    .on("click", function() { zoom(root); });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    var focus0 = focus; focus = d;

    var transition = d3.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", function(d) {
          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
          return function(t) { zoomTo(i(t)); };
        });

    transition.selectAll("text")
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
        .each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
        .each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }

  function zoomTo(v) {
    var k = diameter / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
  }
}

d3.select(self.frameElement).style("height", diameter + "px");
