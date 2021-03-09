//Global Variables
var map;
var wildlifeAreaFeatures;
var riskValue = null; // Highest level assessed for the location
var areasWithin1200 = []; // List of wildlife areas within 1200 m at risk due to cats location
var areasWithin400 = []; // List of wildlife areas within 400 m at risk due to cats location
var catLocation = null; // Location of cat on map
var catAreaMax = null; // Visual Feature of max cat home range
var catAreaMaxPoly = null; // Polygon of max cat home range
var catAreaAvg = null; // Visual Feature of avg cat home range
var catAreaAvgPoly = null; // Polygon of avg cat home range
var allowLoc = false;  // Allow cat location to be put on map, false allows clicking of wildlife areas
var catIcon = L.icon({
    iconUrl: 'img/cat.png',
    iconSize:     [35, 40], // size of the icon
    iconAnchor:   [20, 30], // point of the icon which will correspond to marker's location
});
// Styles for Features
var style = {
    'countyStyle' : {
        fillColor: "none",
        weight: 2,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.7
    },
    'catAreaMaxStyle' : {
        fillColor: 'gray',
        weight: 1,
        opacity: 1,
        dashArray: '5, 6',
        color: 'black',
        fillOpacity: .2
    },
    'catAreaAvgStyle' : {
        fillColor: 'gray',
        weight: 1,
        opacity: 1,
        color: 'red',
        fillOpacity: .2
    }
}

//Declare API key and other options for OpenCageData geocoder
var searchOptions = {
    key: '536425ab5de04e479897f4577a628553',
    limit: 5, // number of results to be displayed
    position: 'topright',
    placeholder: 'Search', // the text in the empty search box
    errorMessage: 'Nothing found.',
    showResultIcons: true,
    collapsed: false,
    expand: 'click',
    addResultToMap: false, // if a map marker should be added after the user clicks a result
    onResultClick: undefined, // callback with result as first parameter
};


///// Functions for Map /////
//Function to instantiate the Leaflet map
function createMap(){
    //create the map
    var southWest = L.latLng(41.5, -94);  
    var northEast = L.latLng(45, -85);	
    var bounds = L.latLngBounds(southWest, northEast);
    map = L.map('map', {
        center: [43.05,-89.4],
        zoom: 10,
        minZoom: 8,
        maxZoom: 18,
        maxBounds:bounds,
        zoomControl: false,
        tap:false,
        doubleClickZoom:false,
    })
    
    // Add zoom control (but in top right)
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    // Add Home button
    L.easyButton('<img src="img/home.svg">', function(){
        map.setView([43.05,-89.4], 10);
    },'zoom to original extent',{ position: 'topright' }).addTo(map);
    // Add scale bar
    L.control.scale().addTo(map);

    // Basemaps
    var mapboxBasemap = L.tileLayer('https://api.mapbox.com/styles/v1/jseibel55/ckjvkh5o70q9y1aukajmy8pwx/tiles/256/{z}/{x}/{y}@2x?access_token={accessToken}', {
        attribution: '<a href="https://www.mapbox.com/">Mapbox</a>',
        accessToken: 'pk.eyJ1IjoianNlaWJlbDU1IiwiYSI6ImNrNmpxc3pzYTAwZXIzanZ4Nm5scHAzam0ifQ.5NLBHlevG0PL-E13Yax9NA'
    });
    var openStreetsGrayBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    var satelliteBasemap =  L.tileLayer('https://api.mapbox.com/styles/v1/jseibel55/ckl4a4rhl36yk17nqd4wgl8fk/tiles/256/{z}/{x}/{y}@2x?access_token={accessToken}', {
        attribution: '<a href="https://www.mapbox.com/">Mapbox</a>',
        accessToken: 'pk.eyJ1IjoianNlaWJlbDU1IiwiYSI6ImNrNmpxc3pzYTAwZXIzanZ4Nm5scHAzam0ifQ.5NLBHlevG0PL-E13Yax9NA'
    });

    // //Create basemap group for control panel
	var basemaps = {
        'Streets Color': mapboxBasemap,
        'Streets Gray': openStreetsGrayBasemap,
        'Satellite': satelliteBasemap,
    }
    var overlays = {};
    L.control.layers(basemaps, overlays, {position: 'bottomright'}).addTo(map);

    // Add Sidebar to map
    var sidebar = L.control({position: 'topleft'});
	sidebar.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'sidebar');
        this._div.innerHTML = '<p id="instruction-title"><b>Assess potential risk to wildlife<br></p>';
        // this._div.innerHTML += '<div id="geocoder" class="form-group has-search">\
        //                             <span class="fa fa-search form-control-feedback"></span>\
        //                             <input type="text" class="form-control" placeholder="Search">\
        //                         </div>'
        this._div.innerHTML += '<p id="instuction">Click Add Cat to be begin. Then click on the map or search by address.</p>';
        this._div.innerHTML += '<button type="button" class="btn btn-primary addCat">Add Cat</button>';
        this._div.innerHTML += '<button type="button" class="btn btn-primary removeCat" disabled>Remove Cat</button><br>';
        this._div.innerHTML += '<div id="geocoder"></div><br>';
        this._div.innerHTML += '<button type="button" class="btn btn-success assessCat" disabled>Assess Cat</button>';

		return this._div;
	};
    sidebar.addTo(map);

    // Add place searchbar to map
    var searchControl = L.Control.openCageSearch(searchOptions).addTo(map);
    searchControl.markGeocode = function(result) {
        if (catLocation != null) {
            map.removeLayer(catLocation);
            map.removeLayer(catAreaMax);
            map.removeLayer(catAreaAvg);
        }
        if (allowLoc == true) {
            $('.removeCat').prop("disabled", false);
            $('.assessCat').prop("disabled", false);
            var center = result.center;
            var bounds = result.bounds;
            var poly = L.polygon([
                bounds.getSouthEast(),
                bounds.getNorthEast(),
                bounds.getNorthWest(),
                bounds.getSouthWest()
            ]);//.addTo(map);
            map.fitBounds(poly.getBounds());

            catLocation = new L.marker(center, {icon: catIcon}).addTo(map);
            eventLngLat = [center.lng, center.lat];

            if (catAreaMax != null) {
                map.removeLayer(catAreaMax);
                map.removeLayer(catAreaAvg);
            }

            catAreaMaxPoly = makeRadius(eventLngLat, 1200);
            catAreaMax = L.geoJson(catAreaMaxPoly, {
                style: style.catAreaMaxStyle
            }).addTo(map);
            catAreaAvgPoly = makeRadius(eventLngLat, 400);
            catAreaAvg = L.geoJson(catAreaAvgPoly, {
                style: style.catAreaAvgStyle
            }).addTo(map);
        }
    };

    // mapboxgl.accessToken = 'pk.eyJ1IjoianNlaWJlbDU1IiwiYSI6ImNrNmpxc3pzYTAwZXIzanZ4Nm5scHAzam0ifQ.5NLBHlevG0PL-E13Yax9NA';
    // var geocoder = new MapboxGeocoder({
    //     accessToken: mapboxgl.accessToken,
    //     mapboxgl: mapboxgl,
    //     marker: false
    // });


    // Call the getContainer routine.
    var htmlObject = searchControl.getContainer();
    // Get the desired parent node.
    var newControlLocation = document.getElementById('geocoder');

    // Finally append that node to the new parent, recursively searching out and re-parenting nodes.
    function setParent(el, newParent) {
        newParent.appendChild(el);
    }
    setParent(htmlObject, newControlLocation);

    // Add data layers to the map
    // addCounties(map);
    addWildlifeAreas(map);
    addIBA(map);
    // addHistoricalCats(map);

};

// Add counties
function addCounties(map){
    //Create the county boundaries
    $.getJSON("data/County_Boundaries.json", function(response){
        mapFeatures = L.geoJson(response, {
            style: style.countyStyle,
        }).addTo(map);
    });
}

// Add wildlife areas
function addWildlifeAreas(map){
    //Create the county boundaries
    $.getJSON("data/Wildlife_Areas.json", function(response){
        wildlifeData = response;
        wildlifeAreaFeatures = L.geoJson(response, {
            style: wildlife_area_style,
            onEachFeature: onEachFeature
        }).addTo(map);
    });
}

// Add important bird areas
function addIBA(map){
    // load GeoJSON file
    $.getJSON("data/Important_Bird_Areas.json",function(data){
        // add GeoJSON layer to the map once the file is loaded
        L.geoJson(data);
    });
}

// Add historical cat surrender locations
function addHistoricalCats(map){
    // load GeoJSON file
    
}

//Set style for Wildlife Areas
function wildlife_area_style(feature) {
    return {
        fillColor: getRiskColor(feature.properties.WILD_LVL),
        weight: 1,
        opacity: 1,
        color: 'darkgray',
        fillOpacity: 0.7
    }
};
// Set color gradient for Wildlife Areas
function getRiskColor(lvl) {
    return lvl == 3 ? '#800026' :
           lvl == 2 ? '#FD8D3C' :
                      '#FFEDA0' ;
}

//Event listeners for highlighing the polygon features
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: polyPopup
    });
}
//Highlight polygon feature
function highlightFeature(e) {
    if (allowLoc == false) {
        var layer = e.target;

        layer.setStyle({
            weight: 3,
            color: 'black',
            dashArray: '',
            fillOpacity: .8
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }
}
//Remove polygon feature highlight
function resetHighlight(e) {
    wildlifeAreaFeatures.resetStyle(e.target);
}
// Creates and activates a popup for the polygon feature
function polyPopup(e) {
    if (allowLoc == false) {
        var poly = e.target.feature;

        //Create the popup content for the combined dataset layer
        var popupContent = createPopupContent(poly.properties);

        //bind the popup to the polygon
        e.target.bindPopup(popupContent, {
            offset: new L.Point(0,0)
        }).openPopup();
    }
}
// Creates text for the popups in the prop symbols
function createPopupContent(properties, attribute){
    //add name to popup content string
    var popupContent = "<p class='popup-feature-name'><b>" + properties.NAME + "</b></p>";

    //add formatted attribute to panel content string
    popupContent += "<p class='popup-detail'>Owner: <b><span id=''>" + properties.OWNER + "</span></b></p>";
    popupContent += "<p class='popup-detail'>Organization Type: <b>" + properties.ORG_TYPE + "</b></p>";
    popupContent += "<p class='popup-detail'>Use Type: <b>" + properties.USE_TYPE + "</b></p>";
    popupContent += "<p class='popup-detail'>Wildlife Sensitivity Level: <b>"+ properties.RISK_LVL + "</b></p>";
    if (properties.WEBSITE.length > 0) {
        popupContent += "<p class='popup-detail'>More Info: <b><a href="+ properties.WEBSITE +" target='_blank'> Website </a></b></p>";
    }
    

    return popupContent;
}

// Add marker to map at click location
function addMarker(e){
    if (catLocation != null) {
        map.removeLayer(catLocation);
    }
    $('.removeCat').prop("disabled", false);
    $('.assessCat').prop("disabled", false);

    catLocation = new L.marker(e.latlng, {icon: catIcon}).addTo(map);
}

// Calculate buffer around cat location
function makeRadius(lngLatArray, radiusInMeters){
    var point = turf.point(lngLatArray)
    var buffered = turf.buffer(point, radiusInMeters, { units: 'meters' });
    return buffered;
}
// Show and style the buffer around a cat location
function showBuffer(e) {
    eventLngLat = [e.latlng.lng, e.latlng.lat];

    if (catAreaMax != null) {
        map.removeLayer(catAreaMax);
        map.removeLayer(catAreaAvg);
    }

    catAreaMaxPoly = makeRadius(eventLngLat, 1200);
    catAreaMax = L.geoJson(catAreaMaxPoly, {
        style: style.catAreaMaxStyle
    }).addTo(map);
    catAreaAvgPoly = makeRadius(eventLngLat, 400);
    catAreaAvg = L.geoJson(catAreaAvgPoly, {
        style: style.catAreaAvgStyle
    }).addTo(map);
}

// Store highest risk value assessment after comparing to current saved
function storeRisk(current) {
    if (riskValue == null || riskValue < current) {
        riskValue = current;
    }
}
// Store each wildlife area that is within a certain distance to corresponding list if that area does not already exist in the list
function addToRiskList(area, distance) {
    if (distance == 400) {
        if (areasWithin400.indexOf(area) === -1) {
            areasWithin400.push(area)
        }
    }
    else {
        if (areasWithin400.indexOf(area) === -1 && areasWithin1200.indexOf(area) === -1) {
            areasWithin1200.push(area)
        }
    }
}

// Check if buffer and wildlife areas intersect, if they do assess the area
function checkIntersection() {
    // Loop through every wildlife area
    for (each in wildlifeAreas.features) {
        var wildlifeArea = wildlifeAreas.features[each].geometry

        // Check if within 400 meters of High Sensitive Area (lvl 3)
        if (turf.booleanIntersects(catAreaAvgPoly, wildlifeArea) == true && wildlifeAreas.features[each].properties.RISK_LVL == "High") {
            storeRisk(3)
            addToRiskList(wildlifeAreas.features[each].properties, 400);
        }
        // Check if within 1200 meters of High Sensitive Area (lvl 3)
        else if (turf.booleanIntersects(catAreaMaxPoly, wildlifeArea) == true && wildlifeAreas.features[each].properties.RISK_LVL == "High") {
            storeRisk(3)
            addToRiskList(wildlifeAreas.features[each].properties, 1200);
        }
        // Check if within 400 meters of Medium Sensitive Area (lvl 2)
        else if (turf.booleanIntersects(catAreaAvgPoly, wildlifeArea) == true && wildlifeAreas.features[each].properties.RISK_LVL == "Medium") {
            storeRisk(3)
            addToRiskList(wildlifeAreas.features[each].properties, 400);
        }
        // Check if within 1200 meters of Medium Sensitive Area (lvl 2)
        else if (turf.booleanIntersects(catAreaMaxPoly, wildlifeArea) == true && wildlifeAreas.features[each].properties.RISK_LVL == "Medium") {
            storeRisk(2)
            addToRiskList(wildlifeAreas.features[each].properties, 1200);
        }
        // Check if within 400 meters of Low Sensitive Area (lvl 1)
        else if (turf.booleanIntersects(catAreaAvgPoly, wildlifeArea) == true && wildlifeAreas.features[each].properties.RISK_LVL == "Low") {
            storeRisk(2)
            addToRiskList(wildlifeAreas.features[each].properties, 400);
        }
        // Check if within 1200 meters of Low Sensitive Area (lvl 1)
        else if (turf.booleanIntersects(catAreaMaxPoly, wildlifeArea) == true && wildlifeAreas.features[each].properties.RISK_LVL == "Low") {
            storeRisk(1)
            addToRiskList(wildlifeAreas.features[each].properties, 1200);
        }
        else {
            storeRisk(1)
        }
    }
}

// Create window to display the risk assessment and the nearby wildlife areas
function reportAssessment() {
    if (riskValue == 3) {
        $('body').append('<div class="results"> \
            <div><p id="results-title"><b>This location is a <span style="color:#800026">HIGH RISK</span> to wildlife</b></p><div> \
            <div class="results-table"></div></div>');
    } else if (riskValue == 2) {
        $('body').append('<div class="results"> \
            <div><p id="results-title"><b>This location is a <span style="color:#FD8D3C">MEDIUM RISK</span> to wildlife</b></p><div> \
            <div class="results-table"></div></div>');
    } else {
        $('body').append('<div class="results"> \
            <div><p id="results-title"><b>This location is a <span style="color:#FFEDA0">LOW RISK</span> to wildlife</b></p><div> \
            <div class="results-table"></div></div>');
    }
    
    if (areasWithin400.length > 0) {
        $('.results-table').append('<span style="text-decoration: underline">Areas within 400 meters (~0.25 miles):</span><br>');
        createResultsTable(areasWithin400);
    }
    if (areasWithin1200.length > 0) {
        $('.results-table').append('<br><span style="text-decoration: underline">Areas within 1200 meters (~0.75 miles):</span><br>');
        createResultsTable(areasWithin1200);
    }

    riskValue = null;
    areasWithin1200 = [];
    areasWithin400 = [];
}
// Creates the table of the nearby wildlife areas
function createResultsTable(withinList, location) {
    var tableH = ["Name", "Owner", "Organization Type", "Use Type", "Wildlife Sensitivity Level", "Website"]
    var table = document.createElement("table");

    var tr = table.insertRow(-1);
    for (var i = 0; i < tableH.length; i++) {
        var th = document.createElement("th");      // TABLE HEADER.
        th.innerHTML = tableH[i];
        tr.appendChild(th);
    }
    for (each in withinList) {
        tr = table.insertRow(-1);
        var tabCell = tr.insertCell(-1);
        tabCell.innerHTML = withinList[each].NAME;
        tabCell = tr.insertCell(-1);
        tabCell.innerHTML = withinList[each].OWNER;
        tabCell = tr.insertCell(-1);
        tabCell.innerHTML = withinList[each].ORG_TYPE;
        tabCell = tr.insertCell(-1);
        tabCell.innerHTML = withinList[each].USE_TYPE;
        tabCell = tr.insertCell(-1);
        tabCell.innerHTML = withinList[each].RISK_LVL;
        tabCell = tr.insertCell(-1);
        tabCell.innerHTML = withinList[each].WEBSITE
        if (withinList[each].WEBSITE.length > 0) {
            tabCell.innerHTML = '<a href='+ withinList[each].WEBSITE +' target=_blank> More Info </a></b></p>';
        }
    }

    $('.results-table').append(table);
    $('.results-table').append('<br>');
}

//Create Map
$(document).ready(createMap());

// Click Events for Buttons in sidebar
$('.addCat').on('click', function(){
    $( ".results" ).remove();
    allowLoc = true;
});
$('.removeCat').on('click', function(){
    allowLoc = false;
    $('.removeCat').prop("disabled", true);
    $('.assessCat').prop("disabled", true);

    map.removeLayer(catLocation);
    map.removeLayer(catAreaMax);
    map.removeLayer(catAreaAvg);
    catLocation = null;

    $( ".results" ).remove();
});
$('.assessCat').on('click', function(){
    $( ".results" ).remove();
    allowLoc = false;
    $('.assessCat').prop("disabled", true);
    $('.addCat').prop("disabled", false);

    checkIntersection();
    reportAssessment();
});

// Prevent click through the sidebar
$('div.sidebar').click(function(e){
    e.stopPropagation();
});

// Map click
map.on('click', function(e) {
    if(allowLoc == true){
        addMarker(e);
        showBuffer(e);
    }
});

// Open About Modal when clicked
$('#activate-about').on('click', function(e) {
    $('#about-screen').modal('show');
});

// Open popup warning to view on desktop if user opens in mobile
// Otherwise Splash Screen when start
$(window).on("resize load", function () {
    if ($( window ).width() <= 600) {
        $('#mobile-screen').modal('show');
        $('#splash-screen').modal('hide');
    } else if ($( window ).width() > 600){
        $('#mobile-screen').modal('hide');
        $('#splash-screen').modal('show');
    }
});