'use strict';

/*global L */


var map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var markers = L.geoJson(null, {
    pointToLayer: createClusterIcon
}).addTo(map);


var worker = new Worker('worker.js');
var ready = false;

worker.onmessage = function (e) {
    if (e.data.ready) {
        ready = true;
        update();
    } else if (e.data.expansionZoom) {
        map.flyTo(e.data.center, e.data.expansionZoom);

    } else {
        markers.clearLayers();
        markers.addData(e.data);
        console.log(e.data)
        test()
    }
};

function update() {
    if (!ready) return;
    var bounds = map.getBounds();
    worker.postMessage({
        bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom: map.getZoom()
    });

}




map.on('moveend', update);

function createClusterIcon(feature, latlng) {
    if (!feature.properties.cluster) return L.marker(latlng);

    var count = feature.properties.point_count;
    var size =
        count < 100 ? 'small' :
        count < 1000 ? 'medium' : 'large';
    var icon = L.divIcon({
        html: '<div><span>' + feature.properties.point_count_abbreviated + '</span></div>',
        className: 'marker-cluster marker-cluster-' + size,
        iconSize: L.point(40, 40)
    });

    return L.marker(latlng, {icon: icon});

}

markers.on('click', function (e) {
    if (e.layer.feature.properties.cluster_id) {
        worker.postMessage({
            getClusterExpansionZoom: e.layer.feature.properties.cluster_id,
            center: e.latlng
        });
    }
});


/**
 * function that push the unique values into a new <a></a>
 * @returns {*[array]}
 */
// sort alphabetically


function test() {
    $('#arraySelectors').empty()
    markers.eachLayer(function (layer) {
        if(layer.feature.properties.point_count === undefined ){return}
        else {
        var liContainers = $('<li id="test" class="list-group-item ">'+ layer.feature.properties.point_count + '</li>')
        //var aContainers = $('<a id="choo" href="#" class="text_info"><span id="listItem" class="">' +layer.feature.geometry.coordinates + '</span></a>')
        //liContainers.append(aContainers)
        $('#arraySelectors').append(liContainers);
        //console.log(layer.feature.properties.cluster_id);

        var li = $('#arraySelectors li');
        li.sort(function(a, b) {
            if(parseInt($(b).text()) > parseInt($(a).text()))
                return 1;
            else return -1;
        });
            $('#arraySelectors').empty().html(li);
          }
        })

}

/*
for (var i = 0; i < obj.length; i++) {
    var liContainers = $('<li id="test" class="list-group-item col-sm-12"></li>')
    var aContainers = $('<a id="choo" href="#" class="text_info"><span id="listItem" class="">'+ obj.features[i] + '</span></a>')
    liContainers.append(aContainers)
    $('#arraySelectors').append(liContainers);
}*/
