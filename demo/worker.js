'use strict';

/*global importScripts supercluster */

importScripts('../dist/supercluster.js');

var now = Date.now();

var index;
var jsonStr = '{"features":[{"id":"","pt_count":"","lat":"","long":""}]}';
var objK = JSON.parse(jsonStr);
jsonStr = JSON.stringify(objK);

//getJSON('../test/fixtures/places.json', function (geojson) {
getJSON('smarthalo.geojson', function (geojson) {
    console.log('loaded ' + geojson.length + ' points JSON in ' + ((Date.now() - now) / 1000) + 's');

    index = supercluster({
        log: true,
        radius: 90,
        extent: 256,
        maxZoom: 17
    }).load(geojson.features);



    function getLatBounds(i) {
        var myLatArray = [];
        for (var j = 0; j < index.getLeaves(i).length; j++) {
            myLatArray.push(index.getLeaves(i)[j].geometry.coordinates[0]);
            //myLatArray += middaytemp[i];
        }
        var sum = myLatArray.reduce(function(a, b) { return a + b; });
        var avg = sum/index.getLeaves(i).length
        return avg
    }

    function getLongBounds(i) {
        var myLatArray = [];
        for (var j = 0; j < index.getLeaves(i).length; j++) {
            myLatArray.push(index.getLeaves(i)[j].geometry.coordinates[1]);
            //myLatArray += middaytemp[i];
        }
        var sum = myLatArray.reduce(function(a, b) { return a + b; });
        var avg = sum/index.getLeaves(i).length
        return avg
    }

    function rankNumpoints() {
        for (var i = 0; i < index.trees[12].points.length; i++) {
            if (index.trees[12].points[i].numPoints === undefined) {
                objK['features'].push({'id': index.trees[12].points[i].id, 'pt_count': 0, 'lat': 0, long: 0});
            } else {
                objK['features'].push({
                    'id': index.trees[12].points[i].id,
                    'pt_count': index.trees[12].points[i].numPoints,
                    'lat': getLatBounds(index.trees[12].points[i].id),
                    'long': getLongBounds(index.trees[12].points[i].id),
                });
            }
        }
    } rankNumpoints();

    postMessage({ready: true});

    // function for dynamic sorting
    function compareValues(key, order = 'asc') {
        return function (a, b) {
            if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
                // property doesn't exist on either object
                return 0;
            }

            const varA = (typeof a[key] === 'string') ?
                a[key].toUpperCase() : a[key];
            const varB = (typeof b[key] === 'string') ?
                b[key].toUpperCase() : b[key];

            let comparison = 0;
            if (varA > varB) {
                comparison = 1;
            } else if (varA < varB) {
                comparison = -1;
            }
            return (
                (order === 'desc') ? (comparison * -1) : comparison
            );
        };
    }

    objK.features.sort(compareValues('pt_count', 'desc'));
    console.log(index);
    console.log(objK);
    console.log(index.getLeaves(1));
});


self.onmessage = function (e) {
    if (e.data.getClusterExpansionZoom) {
        postMessage({
            expansionZoom: index.getClusterExpansionZoom(e.data.getClusterExpansionZoom),
            center: e.data.center
        });
    } else if (e.data) {
        postMessage(
            index.getClusters(e.data.bbox, e.data.zoom));
    }

    //postMessage(index.trees[8].points)

};




function getJSON(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onload = function () {
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            callback(xhr.response);
        }
    };
    xhr.send();
}
