//Global Variables
var map;
var wildlifeAreaFeatures;
var catLocation = null; // Location of cat on map
var catAreaMax = null; // Max cat home range
var catAreaAvg = null; // Avg cat home range
var allowCat = false;  // Allow cat location to be put on map, false allows clicking of wildlife areas
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
    L.control.layers(basemaps, overlays, {position: 'bottomright'}).addTo(map);

    // Sidebar
    var sidebar = L.control({position: 'topleft'});
	sidebar.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'sidebar');
        this._div.innerHTML = '<p id="instruction"><b>Add a cat to the map to assess risk to sensitive wildlife areas<br></p>'; 
        this._div.innerHTML += '<button type="button" class="btn btn-primary addCat">Add Cat</button>';
        this._div.innerHTML += '<button type="button" class="btn btn-primary removeCat" disabled>Remove Cat</button><br>';
        this._div.innerHTML += '<button type="button" class="btn btn-success assessCat" disabled>Assess Cat</button>';
       

		return this._div;
	};
    sidebar.addTo(map);

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
    if (allowCat == false) {
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
    if (allowCat == false) {
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
    popupContent += "<p class='popup-detail'>More Info: <b><a href="+ properties.WEBSITE +" target='_blank'> Website </a></b></p>";

    return popupContent;
}

// Add marker to map at click location
function addMarker(e){
    if (catLocation != null) {
        map.removeLayer(catLocation);
        $('.removeCat').prop("disabled", false);
        $('.assessCat').prop("disabled", false);
    }

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

    catAreaMax = L.geoJson(makeRadius(eventLngLat, 1200), {
        style: style.catAreaMaxStyle
    }).addTo(map);
    catAreaAvg = L.geoJson(makeRadius(eventLngLat, 400), {
        style: style.catAreaAvgStyle
    }).addTo(map);
}


//Create Map
$(document).ready(createMap());

// Click Events for Buttons
$('.addCat').on('click', function(){
    allowCat = true;
});
$('.removeCat').on('click', function(){
    allowCat = false;
    $('.removeCat').prop("disabled", true);
    $('.assessCat').prop("disabled", true);

    map.removeLayer(catLocation);
    map.removeLayer(catAreaMax);
    map.removeLayer(catAreaAvg);
    catLocation = null;
});
$('.assessCat').on('click', function(){
    allowCat = false;
    $('.addCat').prop("disabled", false);
});

// Map click
map.on('click', function(e) {
    if(allowCat == true){
        addMarker(e);
        showBuffer(e);
    }
});