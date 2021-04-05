//Global Variables
var map;
var catLatitude;
var catLongitude;
var riskValue = null; // Highest level assessed for the location
var areasWithin1200 = []; // List of wildlife areas within 1200 m at risk due to cats location
var areasWithin400 = []; // List of wildlife areas within 400 m at risk due to cats location
var catLocation = null; // Location of cat on map
var catAreaMax = null; // Visual Feature of max cat home range
var catAreaMaxPoly = null; // Polygon of max cat home range
var catAreaAvg = null; // Visual Feature of avg cat home range
var catAreaAvgPoly = null; // Polygon of avg cat home range
var allowLoc = false;  // Allow cat location to be put on map, false allows clicking of wildlife areas
var resultsVisible = false; // If the results tab is visible on the screen
var pastCatLocations;
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
    'catLocStyle' : {
        radius: 5,
        fillColor: "green",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    },
    'ibaStyle' : {
        fillColor: "blue",
        weight: 2,
        opacity: 1,
        color: 'blue',
        fillOpacity: 0.1
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
    var mapboxColor = L.tileLayer('https://api.mapbox.com/styles/v1/jseibel55/ckjvkh5o70q9y1aukajmy8pwx/tiles/256/{z}/{x}/{y}@2x?access_token={accessToken}', {
        attribution: '<a href="https://www.mapbox.com/">Mapbox</a>',
        accessToken: 'pk.eyJ1IjoianNlaWJlbDU1IiwiYSI6ImNrNmpxc3pzYTAwZXIzanZ4Nm5scHAzam0ifQ.5NLBHlevG0PL-E13Yax9NA'
    });
    var openStreetsGrayBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    // var mapboxGray = L.tileLayer('https://api.mapbox.com/styles/v1/jseibel55/ckmp4sj560qfq17o1bbt4sglv/tiles/256/{z}/{x}/{y}@2x?access_token={accessToken}', {
    //     attribution: '<a href="https://www.mapbox.com/">Mapbox</a>',
    //     accessToken: 'pk.eyJ1IjoianNlaWJlbDU1IiwiYSI6ImNrNmpxc3pzYTAwZXIzanZ4Nm5scHAzam0ifQ.5NLBHlevG0PL-E13Yax9NA'
    // }).addTo(map);
    var satelliteBasemap =  L.tileLayer('https://api.mapbox.com/styles/v1/jseibel55/ckmqrltte1dsx17p96o9gwkgs/tiles/256/{z}/{x}/{y}@2x?access_token={accessToken}', {
        attribution: '<a href="https://www.mapbox.com/">Mapbox</a>',
        accessToken: 'pk.eyJ1IjoianNlaWJlbDU1IiwiYSI6ImNrNmpxc3pzYTAwZXIzanZ4Nm5scHAzam0ifQ.5NLBHlevG0PL-E13Yax9NA'
    });

    // //Create basemap group for control panel
	var basemaps = {
        'Streets Color': mapboxColor,
        'Streets Gray': openStreetsGrayBasemap,
        // 'Streets Gray': mapboxGray,
        'Satellite': satelliteBasemap,
    }
    var overlays = {};
    L.control.layers(basemaps, overlays, {position: 'bottomright'}).addTo(map);

    // Add Sidebar to map
    var sidebar = L.control({position: 'topleft'});
	sidebar.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'main-sidebar');
        this._div.innerHTML = '<div class="sidebar"> <p id="instruction-title"><b>Assess potential risk to wildlife<br></p> \
            <p id="instuction">Click "Add Cat" to be begin. Then click on the map or search by address to add a cat\'s location to the map.</p> \
            <button type="button" id="addCatBtn" class="btn btn-secondary addCatBtn">Add Cat</button> \
            <button type="button" class="btn btn-secondary removeCatBtn" disabled>Remove Cat</button><br> \
            <div id="geocoder" class="geocoder"></div> \
            <p id="instuction">Once a cat\'s location is on the map, click "Assess Cat" to bring up a wildlife risk assessment at the location.</p> \
            <button type="button" class="btn btn-success assessCatBtn" disabled>Assess Cat</button>\
            <button type="button" class="btn btn-info saveCatBtn" disabled>Save Cat</button> </div>';
        this._div.innerHTML += '<div class="dataSidebar"><p id="instruction-title"><b>Extra Data Layers<br></p> \
                <p id="">\
                    <label class="switch">\
                        <input type="checkbox" id="IBAToggle">\
                        <span class="slider round"></span>\
                    </label> Important Bird Areas\
                </p>\
            </div>';

		return this._div;
	};
    sidebar.addTo(map);

    // Add Legend to map
    var legend = L.control({position: 'topright'});
	legend.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'legend');
        this._div.innerHTML = '<button id="legend" type="button" class="btn btn-primary" data-toggle="collapse" data-target="#legend-collapse" aria-expanded="false" aria-controls="#legend-collapse"><i class="fa fa-list fa-lg"></i></button> \
        <div class="row">\
            <div class="col">\
                <div class="collapse" id="legend-collapse">\
                    <div id="card">\
                        <div id="legend-title"><p><b>Wildlife Habitat Sensitivity</b></p></div>\
                        <div id="info"><img id ="pic" src="img/high-area.PNG" style="width:50px"/><span>High Sensitivity</span></div>\
                        <div id="info"><img id ="pic" src="img/medium-area.PNG" style="width:50px"/><span>Medium Sensitivity</span></div>\
                        <div id="info"><img id ="pic" src="img/low-area.PNG" style="width:50px"/><span>Low Sensitivity</span></div>\
                    </div>\
                </div>\
            </div>\
        </div>';

		return this._div;
	};
    legend.addTo(map);

    // Add Geocoder to the sidebar
    mapboxgl.accessToken = 'pk.eyJ1IjoianNlaWJlbDU1IiwiYSI6ImNrNmpxc3pzYTAwZXIzanZ4Nm5scHAzam0ifQ.5NLBHlevG0PL-E13Yax9NA';
    var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        countries: 'us',
        bbox: [-94, 41.5, -85, 45],
        mapboxgl: mapboxgl,
        placeholder: 'Search Address',
    });
    geocoder.addTo('#geocoder'); 
    geocoder.on('result', function(ev) {
        geocode(ev);
    });

    // Add data layers to the map
    addWildlifeAreas(map);

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
            onEachFeature: onEachWildlifeFeature
        }).addTo(map);
    });
}

// Add important bird areas
function addIBA(map){
    // load GeoJSON file
    $.getJSON("data/Important_Bird_Areas.json", function(response){
        IBALayer = L.geoJson(response, {
            style: style.ibaStyle,
            onEachFeature: onEachIBAFeature
        }).addTo(map);
    });
}

// Add historical cat surrender locations
function addPastCatLocations(map){
    // load GeoJSON file
    // $.getJSON("data/Cat_Locations.json", function(response){
        
        catLayer = L.geoJson(pastCatLocations, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, style.catLocStyle);
            }
            // style: style.catLocStyle,
            // onEachFeature: onEachCatFeature
        }).addTo(map);
    // });
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

//Event listeners for highlighing the wildlife area polygon features
function onEachWildlifeFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: wildlifePolyPopup
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
// Creates and activates a popup for the wildlife area polygon feature
function wildlifePolyPopup(e) {
    if (allowLoc == false) {
        var poly = e.target.feature;

        //Create the popup content for the combined dataset layer
        var popupContent = createwildlifePopupContent(poly.properties);

        //bind the popup to the polygon
        e.target.bindPopup(popupContent, {
            offset: new L.Point(0,0)
        }).openPopup();
    }
}
// Creates text for the popups in the wildlife area prop symbols
function createwildlifePopupContent(properties){
    //add name to popup content string
    var popupContent = "<p class='popup-wildlife-feature-name'><b>" + properties.NAME + "</b></p>";

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

//Event listeners for highlighing the IBA polygon features
function onEachIBAFeature(feature, layer) {
    layer.on({
        click: IBApolyPopup
    });
}
// Creates and activates a popup for the IBA feature
function IBApolyPopup(e) {
    if (allowLoc == false) {
        var poly = e.target.feature;

        //Create the popup content for the combined dataset layer
        var popupContent = createIBAPopupContent(poly.properties);

        //bind the popup to the polygon
        e.target.bindPopup(popupContent, {
            offset: new L.Point(0,0)
        }).openPopup();
    }
}
// Creates text for the IBA popups in the prop symbols
function createIBAPopupContent(properties){
    //add name to popup content string
    var popupContent = "<p class='popup-iba-feature-name'><b>" + properties.IBA_NAME + "</b></p>";

    return popupContent;
}

// Add marker to map at click location
function addMarker(e){
    if (catLocation != null) {
        map.removeLayer(catLocation);
    }
    $('.removeCatBtn').prop("disabled", false);
    $('.assessCatBtn').prop("disabled", false);
    $('.saveCatBtn').prop("disabled", false);

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
            <div id="wrapper-top"> \
                <div><p id="results-title"><b>This location is a <span style="color:#800026">HIGH RISK</span> to wildlife</b></p></div> \
                <div class="closebtn" onclick="toggleResults()">&times;</div> \
            </div> \
            <div id="wrapper-bottom"> \
                <div class="results-table"></div> \
            </div> \
        </div>');
    } else if (riskValue == 2) {
        $('body').append('<div class="results"> \
            <div id="wrapper-top"> \
                <div><p id="results-title"><b>This location is a <span style="color:#FD8D3C">MEDIUM RISK</span> to wildlife</b></p></div> \
                <div class="closebtn" onclick="toggleResults()">&times;</div> \
            </div> \
            <div id="wrapper-bottom"> \
                <div class="results-table"></div> \
            </div> \
        </div>');
    } else {
        $('body').append('<div class="results"> \
            <div id="wrapper-top"> \
                <div><p id="results-title"><b>This location is a <span style="color:#e3d288">LOW RISK</span> to wildlife</b></p></div> \
                <div class="closebtn" onclick="toggleResults()">&times;</div> \
            </div> \
            <div id="wrapper-bottom"> \
                <div class="results-table"></div> \
            </div> \
        </div>');
    }

    $('body').append('<div class="results-collapsed" onclick="toggleResults()">Show Assessment</div>')
    
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

// Overrides the Mapbox Geocoder to add a cat icon, buffer, and zoom to location
function geocode(ev) {
    if (catLocation != null) {
        map.removeLayer(catLocation);
        map.removeLayer(catAreaMax);
        map.removeLayer(catAreaAvg);
    }
    if (allowLoc == true) {
        var center = [ev.result.center[1],ev.result.center[0]]

        $('.removeCatBtn').prop("disabled", false);
        $('.assessCatBtn').prop("disabled", false);
        $('.saveCatBtn').prop("disabled", false);

        var overlayCenter = L.latLng(center);
        var mapZoom = 14;
        var pixWidth = 200;
        var pixOffsetX = pixWidth / 2;
        var pixOffsetY = pixOffsetX * 9 / 16;
        var centerPoint = map.project(overlayCenter, mapZoom);
        var latLng1 = map.unproject(L.point([centerPoint.x - pixOffsetX, centerPoint.y + pixOffsetY]), mapZoom);
        var latLng2 = map.unproject(L.point([centerPoint.x + pixOffsetX, centerPoint.y - pixOffsetY]), mapZoom);
        var bbox = L.latLngBounds(latLng1, latLng2);
        map.fitBounds(bbox);

        catLocation = new L.marker(center, {icon: catIcon}).addTo(map);
        eventLngLat = [ev.result.center[0], ev.result.center[1]];
        catLongitude = ev.result.center[0];
        catLatitude = ev.result.center[1];

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
    } else {
        var center = [ev.result.center[1],ev.result.center[0]]

        var overlayCenter = L.latLng(center);
        var mapZoom = 15;
        var pixWidth = 200;
        var pixOffsetX = pixWidth / 2;
        var pixOffsetY = pixOffsetX * 9 / 16;
        var centerPoint = map.project(overlayCenter, mapZoom);
        var latLng1 = map.unproject(L.point([centerPoint.x - pixOffsetX, centerPoint.y + pixOffsetY]), mapZoom);
        var latLng2 = map.unproject(L.point([centerPoint.x + pixOffsetX, centerPoint.y - pixOffsetY]), mapZoom);
        var bbox = L.latLngBounds(latLng1, latLng2);
        map.fitBounds(bbox);
    }
}

// Collect the data on the cat submission form before appending to Google Sheet
function gatherData () {
    var dateAssessed = "",
    intakeType = "",
    riskLevel = "",
    streetAddress = "",
    city = "",
    zipCode = "",
    state = "",
    county ="";

    var currentdate = new Date(); 
    dateAssessed = (currentdate.getMonth()+1) + "/"
                  + currentdate.getDate() + "/" 
                  + currentdate.getFullYear() + " "  
                  + currentdate.getHours() + ":"  
                  + currentdate.getMinutes() + ":" 
                  + currentdate.getSeconds();
  
    intakeType = $("#intake-form").val();
    riskLevel = $("#risk-form").val();
    streetAddress = $("#street-form").val();
    city = $("#city-form").val();
    zipCode = $("#zip-form").val();
    state = $("#state-form").val();
    county = $("#county-form").val();
    
    var counter = $("#how-many").val();
    if (!(counter > 0)) {
      counter = 1;
    }
    for (i = 0; i < counter; i++) {
      append(dateAssessed, intakeType, riskLevel, streetAddress, city, zipCode, state, county);
    }  
}

//javascript create JSON object from two dimensional Array
function arrayToJSONObject(arr){
    //header
    var keys = arr[0];
 
    //vacate keys from main array
    var newArr = arr.slice(1, arr.length);
 
    var formatted = [],
    data = newArr,
    cols = keys,
    l = cols.length;
    for (var i=0; i<data.length; i++) {
        var d = data[i];
        console.log(d[i]["Latitude"])
        var prop = {};
        var record = {"type":"Feature","geometry":{"type":"Point","coordinates":[parseFloat(d[8]),parseFloat(d[9])]},"properties":prop};
        for (var j=0; j<l; j++)
                prop[cols[j]] = d[j];
        formatted.push(record);
    }
    formatted = {"type":"FeatureCollection", "features": formatted}
    console.log(formatted);
    pastCatLocations = {"type":"FeatureCollection", "features": formatted};
}

// Toggle hide/display the Results window
function toggleResults() {
    if (resultsVisible == true) {
        $('.results').hide();
        resultsVisible = false;
    }
    else if (resultsVisible == false) {
        $('.results').show();
        resultsVisible = true;
    }
}


/// Create Map
$(document).ready(createMap());

// Click Events for Buttons in sidebar
$('.addCatBtn').on('click', function(){
    $("#addCatBtn").toggleClass('btn-primary btn-secondary');
    $( ".results" ).remove();
    $( ".results-collapsed" ).remove();
    resultsVisible = false;
    allowLoc = true;
});
$('.removeCatBtn').on('click', function(){
    $("#addCatBtn").toggleClass('btn-secondary btn-primary');
    $('.removeCatBtn').prop("disabled", true);
    $('.assessCatBtn').prop("disabled", true);
    $('.saveCatBtn').prop("disabled", true);
    allowLoc = false;

    map.removeLayer(catLocation);
    map.removeLayer(catAreaMax);
    map.removeLayer(catAreaAvg);
    catLocation = null;

    $( ".results" ).remove();
    $( ".results-collapsed" ).remove();
});
$('.assessCatBtn').on('click', function(){
    $( ".results" ).remove();
    $( ".results-collapsed" ).remove();
    allowLoc = false;
    $('.assessCatBtn').prop("disabled", true);
    $('.addCatBtn').prop("disabled", false);

    checkIntersection();
    reportAssessment();
    resultsVisible = true;
});
$('.saveCatBtn').on('click', function(){
    $('#save-cat-form').modal('show');
});

// Detect data toggle active
$('#catLocToggle').click(function(){
    if($(this).is(":checked")){
        addPastCatLocations(map);
    }
    else if($(this).is(":not(:checked)")){
        map.removeLayer(catLayer)
    }
});
$('#IBAToggle').click(function(){
    if($(this).is(":checked")){
        addIBA(map);
    }
    else if($(this).is(":not(:checked)")){
        map.removeLayer(IBALayer)
    }
});

// Prevent click through the sidebar
$('div.sidebar').click(function(e){
    e.stopPropagation();
});

// Map click
map.on('click', function(e) {
    if(allowLoc == true){
        catLongitude = e.latlng.lng;
        catLatitude = e.latlng.lat;
        addMarker(e);
        showBuffer(e);
    }
});

// Legend
$('#legend').on('mouseover',function(){
    $('#legend').hide();
    $('#legend-collapse').show();
})
$('#legend-collapse').on('mouseout',function(){
    $('#legend-collapse').hide();
    $('#legend').show();
})

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