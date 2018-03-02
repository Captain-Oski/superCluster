'use strict';

/*global L */


var map = L.map('map').setView([0, 0], 2),
    geocoder = L.Control.Geocoder.nominatim(),
    control = L.Control.geocoder({
        geocoder: geocoder
    }).addTo(map),
    marker;

L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.control.scale().addTo(map);

map.on('click', function (e) {
    console.log(e.latlng);
    geocoder.reverse(e.latlng, map.options.crs.scale(map.getZoom()), function (results) {
        var r = results[0];
        console.log(r);
    });
});



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
        $.when().then(test());
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



function reverser(layer,k){
    var r;
    geocoder.reverse({lat: layer.feature.geometry.coordinates[0], lng: layer.feature.geometry.coordinates[1]}, map.options.crs.scale(map.getZoom()), function (results) {
        r = results[0].name;
        k.html('<div id="choo" href="#" class="text_info"><span id="listItem" class="">' + 'r' + '</span></div>')
        console.log(r);
});
}

function test() {

    $('#arraySelectors').empty();
    markers.eachLayer(function (layer) {
        //console.log(layer.feature.geometry.coordinates)


        $(function() {
            if (layer.feature.properties.point_count === undefined) {
                return;
            } else {
                var liContainers = $('<li id="test" class="list-group-item"><b>' + layer.feature.properties.point_count + '</b></li>');
                var aContainers = $('');
                reverser(layer,aContainers)
                liContainers.append(aContainers);
                $('#arraySelectors').append(liContainers);
                //console.log(layer.feature.properties.cluster_id);

                var li = $('#arraySelectors li');
                li.sort(function (a, b) {
                    if (parseInt($(b).text()) > parseInt($(a).text()))
                        return 1;
                    else return -1;
                });
                $('#arraySelectors').empty().html(li);
            }
        })
    });

}
