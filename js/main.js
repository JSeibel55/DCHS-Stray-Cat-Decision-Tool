//Global Variables
var map;
var buttons = [
    L.easyButton('<img src="img/noun_Home_731233_blk.svg">', function(){
        map.setView([43.05,-89.4], 10);
    },'zoom to original extent',{ position: 'topleft' }),
];

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
        zoomControl: true,
        tap:false,
    })
    L.control.scale().addTo(map);
    L.easyBar(buttons).addTo(map);

    var mapboxBasemap = L.tileLayer('https://api.mapbox.com/styles/v1/jseibel55/ckjvkh5o70q9y1aukajmy8pwx/tiles/256/{z}/{x}/{y}@2x?access_token={accessToken}', {
        attribution: '<a href="https://www.mapbox.com/">Mapbox</a>',
        accessToken: 'pk.eyJ1IjoianNlaWJlbDU1IiwiYSI6ImNrNmpxc3pzYTAwZXIzanZ4Nm5scHAzam0ifQ.5NLBHlevG0PL-E13Yax9NA'
    });
    var openStreetsGrayBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
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
    L.control.layers(basemaps, overlays).addTo(map);

    // Add data layers to the map
    addCounties(map);
    addWildlifeAreas(map);
    addIBA(map);
    // addCatData(map);
};

// Add county areas layer
function addCounties(map){
    //Create the county boundaries
    $.getJSON("data/County_Boundaries.json", function(response){
        mapFeatures = L.geoJson(response, {
            style: county_style,
        }).addTo(map);
    });
}

// Add wildlife ares layer
function addWildlifeAreas(map){
    //Create the county boundaries
    $.getJSON("data/Wildlife_Areas.json", function(response){
        mapFeatures = L.geoJson(response, {
            style: wildlife_area_style,
            onEachFeature: onEachFeature
        }).addTo(map);
    });
}

// Add important bird ares layer
function addIBA(map){
    // load GeoJSON file
    $.getJSON("data/Important_Bird_Areas.json",function(data){
        // add GeoJSON layer to the map once the file is loaded
        L.geoJson(data);
    });
}

function county_style() {
    return {
        fillColor: "none",
        weight: 2,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.7
    }
};
function wildlife_area_style(feature) {
    return {
        fillColor: getRiskColor(feature.properties.WILD_LVL),
        weight: 1,
        opacity: 1,
        color: 'darkgray',
        fillOpacity: 0.7
    }
};
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
    var layer = e.target;

    layer.setStyle({
        weight: 1,
        color: 'black',
        dashArray: '',
        fillOpacity: 1
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}
//Remove polygon feature highlight
function resetHighlight(e) {
    mapFeatures.resetStyle(e.target);
}
// Creates and activates a popup for the polygon feature
function polyPopup(e) {
    var poly = e.target.feature;

    //Create the popup content for the combined dataset layer
    var popupContent = createPopupContent(poly.properties);

    //bind the popup to the polygon
    e.target.bindPopup(popupContent, {
        offset: new L.Point(0,0)
    }).openPopup();
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
    popupContent += "<p class='popup-detail'>More Info: <b><a href="+ properties.WEBSITE +" target='_blank'> Website </a></b></p>";

    return popupContent;
}

//Create Map
$(document).ready(createMap());