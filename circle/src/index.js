(function () {
  'use strict';

  // Get external params from URL
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

  $.ajaxSetup({
    beforeSend : function(xhr) {
      if (token) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      } else if (apiKey) {
        xhr.setRequestHeader('Api-Key', apiKey);
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

  var treeDataPromise = configPromise.then(function (typeMap) {
    //var factSheetType = typeMap[type].ID;
    var url = apiBaseUrl + '/factsheets?relations=true&types[]=10&types[]=24&pageSize=-1';

    return $.get(url)
        .then(function (response) {
          var data = response.data;

            return data;
        });
  });

  $.when(configPromise, treeDataPromise)
      .then(function (objectTypes, data) {

          var idMap = {};
          for (var i = 0; i < data.length; i++) {
              idMap[data[i].ID] = data[i];
          };

        display(
            data.filter(function(i) {
            return i.resourceType == 'services';
            }),
            data.filter(function(i) {
                return i.resourceType == 'ifaces';
            }),
            idMap
        );
      });


function display(services, ifaces, idMap) {
    var diameter = 900,
        radius = diameter / 2,
        innerRadius = radius - 120;

    var cluster = d3.layout.cluster()
        .size([360, innerRadius])
        .sort(null)
        .value(function(d) { return d.size; });

    var bundle = d3.layout.bundle();

    var line = d3.svg.line.radial()
        .interpolate("bundle")
        .tension(.85)
        .radius(function(d) { return d.y; })
        .angle(function(d) { return d.x / 180 * Math.PI; });

    var svg = d3.select("body").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .append("g")
        .attr("transform", "translate(" + radius + "," + radius + ")");



    var link = svg.append("g").selectAll(".link"),
        node = svg.append("g").selectAll(".node");


    function buildTree (map, id, parent) {
        var obj = map[id];
        if (!obj) {
            return { name: id + ' not found', children: [] };
        }

        var node = {
            key: obj.ID,
            name: obj.name,
            children: [],
            parent: parent,
            data: obj
        };

        var children = [];
        if (obj.factSheetHasChildren) {
            for (var i = 0; i < obj.factSheetHasChildren.length; i++) {
                var childId = obj.factSheetHasChildren[i].factSheetID;
                var child = buildTree(map, childId, node);
                children.push(child);
            }
        }

        return node;
    }


    services = services.filter(function(item) {
        return (item.factSheetHasIfaceProviders && item.factSheetHasIfaceProviders.length) || (item.factSheetHasIfaceConsumers && item.factSheetHasIfaceConsumers.length);
    });

    var root = {name: "", children: []};
    var treeData = [];
    for (var i = 0; i < services.length; i++) {
        if (services[i].level === 0)
            treeData.push(buildTree(idMap, services[i].ID, null));
    }

    root.children = treeData;

    var nodes = cluster.nodes(root);
    var links = createLinks(nodes, idMap);


// Return a list of imports for the given array of nodes.
    function createLinks(nodes) {
        var map = {},
            links = [];

        // Compute a map from name to node.
        nodes.forEach(function(d) {
            map[d.key] = d;
        });

        // For each import, construct a link from the source to target node.
        nodes.forEach(function(d) {
            console.log(d);
            if (d.data && d.data.factSheetHasIfaceProviders) {
                d.data.factSheetHasIfaceProviders.forEach(function(item) {
                    var iface = idMap[item.ifaceID];
                    if (iface.factSheetHasIfaceConsumers) {
                        iface.factSheetHasIfaceConsumers.forEach(function(target) {
                            var target = map[target.factSheetID];
                            if (target && d)
                                links.push({source: d, target: target});
                        });
                    }
                });
            }
/*            if (d.imports) d.imports.forEach(function(i) {
                imports.push({source: map[d.name], target: map[i]});
            });*/
        });

        return links;
    }


    link = link
        .data(bundle(links))
        .enter().append("path")
        .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
        .attr("class", "link")
        .attr("d", line);

    node = node
        .data(nodes.filter(function(n) { return !n.children; }))
        .enter().append("text")
        .attr("class", "node")
        .attr("dy", ".31em")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
        .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .text(function(d) { return d.name; })
        .on("mouseover", mouseovered)
        .on("mouseout", mouseouted);

    function mouseovered(d) {
        node
            .each(function(n) { n.target = n.source = false; });

        link
            .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
            .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
            .filter(function(l) { return l.target === d || l.source === d; })
            .each(function() { this.parentNode.appendChild(this); });

        node
            .classed("node--target", function(n) { return n.target; })
            .classed("node--source", function(n) { return n.source; });
    }

    function mouseouted(d) {
        link
            .classed("link--target", false)
            .classed("link--source", false);

        node
            .classed("node--target", false)
            .classed("node--source", false);
    }

    d3.select(self.frameElement).style("height", diameter + "px");
}



  /*d3.json("readme-flare-imports.json", function(error, classes) {
    if (error) throw error;

    var nodes = cluster.nodes(packageHierarchy(classes)),
        links = packageImports(nodes);

    link = link
        .data(bundle(links))
        .enter().append("path")
        .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
        .attr("class", "link")
        .attr("d", line);

    node = node
        .data(nodes.filter(function(n) { return !n.children; }))
        .enter().append("text")
        .attr("class", "node")
        .attr("dy", ".31em")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
        .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .text(function(d) { return d.key; })
        .on("mouseover", mouseovered)
        .on("mouseout", mouseouted);
  });*/




    /*
// Lazily construct the package hierarchy from class names.
  function packageHierarchy(classes) {
    var map = {};

    function find(name, data) {
      var node = map[name], i;
      if (!node) {
        node = map[name] = data || {name: name, children: []};
        if (name.length) {
          node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
          node.parent.children.push(node);
          node.key = name.substring(i + 1);
        }
      }
      return node;
    }

    classes.forEach(function(d) {
      find(d.name, d);
    });

    return map[""];
  }

// Return a list of imports for the given array of nodes.
  function packageImports(nodes) {
    var map = {},
        imports = [];

    // Compute a map from name to node.
    nodes.forEach(function(d) {
      map[d.name] = d;
    });

    // For each import, construct a link from the source to target node.
    nodes.forEach(function(d) {
      if (d.imports) d.imports.forEach(function(i) {
        imports.push({source: map[d.name], target: map[i]});
      });
    });

    return imports;
  }
*/


})();
