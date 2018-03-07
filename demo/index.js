'use strict';
/*global L */

var dbscan = require('../node_modules/dobbyscan')

var map = L.map('map').setView([45.5, -73.5], 12),
    geocoder = L.Control.Geocoder.nominatim(),
    control = L.Control.geocoder({
        geocoder: geocoder
    }).addTo(map),
    marker;

L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://mapbox.com">Mapbox</a> contributors'
}).addTo(map);

L.control.scale().addTo(map);

/*
map.on('click', function (e) {
    console.log(e.latlng);
    geocoder.reverse(e.latlng, map.options.crs.scale(map.getZoom()), function (results) {
        var r = results[0];
        console.log(r);
    });
});*/


var markers = L.geoJson(null, {
    filter: function (feature, layer) {
        for (var j = 0; j < 10000; j++) {
            if (feature.properties.point_count > slider.value) {
                //console.log(feature.properties.story['id'], myFilterLayer)
                return true;
            }
        }
    },
    pointToLayer: createClusterIcon
}).addTo(map);

function test(feature, layer, o) {
    for (var j = 0; j < 10000; j++) {
        if (feature.properties[o] === dropdown.value) {
            //console.log(feature.properties.story['id'], myFilterLayer)
            return true;
        }
    }
}


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

        // Update dynamicaly the reverse geocoding everytime you pan / zoom the map. (too consuming for nominatim switch to a button.
        //$.when().then(appendReverseGeoCodingResult());

        slider.oninput = function () {
            radius = this.value;
            output.innerHTML = slider.value;
            //$(".marker-cluster div").css('width',radius+'px')
            //$(".marker-cluster div").css('height',radius+'px')
            markers.clearLayers();
            markers.addData(e.data);
        };
        $('#th1').html(map.getZoom() - 1);
        $('#th2').html(map.getZoom());
        $('#th3').html(map.getZoom() + 1);

        $('#cell1').html((Math.PI * ((radius * pixelToMeters(map.getZoom() - 1)) * (radius / 2 * pixelToMeters(map.getZoom() - 1)))) / 1000000);
        $('#cell2').html((Math.PI * ((radius * pixelToMeters(map.getZoom())) * (radius / 2 * pixelToMeters(map.getZoom())))) / 1000000);
        $('#cell3').html((Math.PI * ((radius * pixelToMeters(map.getZoom() + 1)) * (radius / 2 * pixelToMeters(map.getZoom() + 1)))) / 1000000);
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



var radius = 40;
var slider = document.getElementById('myRange');
var dropdown = document.getElementById('dropdownProperties');
var output = document.getElementById('demo');
output.innerHTML = slider.value;

slider.oninput = function () {
    radius = this.value;
};



function createClusterIcon(feature, latlng) {


    if (!feature.properties.cluster) return L.marker(latlng);

    var count = feature.properties.point_count;
    var size =
        count < 5 ? 'extra-small' :
        count < 20 ? 'small' :
        count < 50 ? 'medium' :
        count < 150 ? 'large' : 'extra-large';
    var icon = L.divIcon({
        html: '<div><span>' + feature.properties.point_count_abbreviated + '</span></div>',
        className: 'marker-cluster marker-cluster-' + size,
        iconSize: L.point(40, 0)
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


$('#arraySelectorsBtn').bind('click', function () { appendReverseGeoCodingResult(); });

/**
 * function that push the unique values into a new <a></a>
 * @returns {*[array]}
 */


/**
 * invoke the leaflet.geocoder and return a result based on the passed lat/lng
 */

function reverser(layer, k) {
    var r;
    geocoder.reverse({lat: layer.feature.geometry.coordinates[1], lng: layer.feature.geometry.coordinates[0]}, map.options.crs.scale(map.getZoom()), function (results) {
        r = results[0];
        try {
            var div = document.getElementById(layer.feature.properties.cluster_id);
            div.innerHTML = '<span id="" class="">' + r.name + '</span>';
        } catch (e) {}

    });
}

/**
 * for eachLayer on map extent, append the "reverser" result
 */

function appendReverseGeoCodingResult() {

    $('#arraySelectors').empty();
    markers.eachLayer(function (layer) {
        $(function () {
            if (layer.feature.properties.point_count === undefined) {
                return;
            } else {


                var liContainers = $('<li id="myResultTable" class="list-group-item"><b>' + layer.feature.properties.point_count + '</b></li>');

                var aContainers = $('<div id=' + layer.feature.properties.cluster_id + ' href="#" class="text_info"></div>');

                liContainers.append(aContainers);
                $('#arraySelectors').append(liContainers);
                reverser(layer, aContainers);

                var li = $('#arraySelectors li');
                li.sort(function (a, b) {
                    if (parseInt($(b).text()) > parseInt($(a).text()))
                        return 1;
                    else return -1;
                });
                $('#arraySelectors').empty().html(li);
            }
        });
    });

}

/**
 * return the conversion factor for a given zoomlevel and a given latitude
 * @param z as zoomLevel
 * @returns {number}
 */
function pixelToMeters(z) {
    var metresPerPixel = 40075016.686 * Math.abs(Math.cos(map.getCenter().lat * 180 / Math.PI)) / Math.pow(2, z + 8);
    return metresPerPixel;
}
