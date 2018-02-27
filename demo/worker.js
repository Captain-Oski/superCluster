'use strict';

/*global importScripts supercluster */

importScripts('../dist/supercluster.js');

var now = Date.now();

var index;

//getJSON('../test/fixtures/places.json', function (geojson) {
getJSON('smarthalo.geojson', function (geojson) {
    var myArray = [{"teamId":'0',"status":''}];
    console.log('loaded ' + geojson.length + ' points JSON in ' + ((Date.now() - now) / 1000) + 's');

    index = supercluster({
        log: true,
        radius: 90,
        extent: 256,
        maxZoom: 17
    }).load(geojson.features);


    console.log(index.getTile(0, 0, 0));


    var jsonStr = '{"theTeam":[{"teamId":"1","status":"pending"},{"teamId":"2","status":"member"},{"teamId":"3","status":"member"}]}';
    var obj = JSON.parse(jsonStr);
    jsonStr = JSON.stringify(obj);

    function rankNumpoints(){

        for (var i = 0; i < index.trees[15].points.length;i++){
            obj['theTeam'].push({"teamId":index.trees[15].points[i].id,"status":index.trees[15].points[i].numPoints});
        }
        console.log(obj);
        //console.log(myArray.sort(function(a, b){return b-a}));
    } rankNumpoints()

    postMessage({ready: true});
});




self.onmessage = function (e) {
    if (e.data.getClusterExpansionZoom) {
        postMessage({
            expansionZoom: index.getClusterExpansionZoom(e.data.getClusterExpansionZoom),
            center: e.data.center
        });
    } else if (e.data) {
        postMessage(index.getClusters(e.data.bbox, e.data.zoom));
    }
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

