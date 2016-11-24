$(document).ready(function($) {
    $.getScript("https://maps.googleapis.com/maps/api/js?libraries=places,geometry,drawing&key=AIzaSyDhnnBsuBzWtuzpUdmve0r3kL6d7NXuK84&v=3&callback=initMap",
        function() {});
});

// Create a blank map
var map;
// Placeholder for driving mode
var mode;
// Placeholder for origin
var currOrigin;
// Placeholder for destination
var currDestination;
// Placeholder for directions display
var directionsDisplay;
// Placeholder for initial user location
var currAddress;
// API URL for determining location from IP address
var ipURL = "https://ipinfo.io";

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 37.0902,
            lng: 95.7129
        },
        zoom: 13,
        mapTypeControl: false
    });

    // Set center to User location and display parks
    getUserLocation();

    // This autocomplete is for use in the origin entry box.
    var originAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('orig'));

    // This autocomplete is for use in the origin entry box.
    var destinationAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('dest'));

    // Register displayDirections() to show directions button
    document.getElementById('show-directions').addEventListener('click', function() {
        displayDirections();
    });
}

// Check if the URL has parameters or not
function getParameterValues() {
    if (getURLParameter('dest') && getURLParameter('orig') && getURLParameter('mod')) {
        document.getElementById('dest').value = getURLParameter('dest');
        document.getElementById('orig').value = getURLParameter('orig');
        var i;
        switch (getURLParameter('mod')) {
            case "DRIVING":
                i = 0;
                break;
            case "WALKING":
                i = 1;
                break;
            case "BICYCLING":
                i = 2;
                break;
            case "TRANSIT":
                i = 3;
                break;
            default:
                i = 0;
        }
        document.getElementById('mod').selectedIndex = i;
        console.log(getURLParameter('dest'));
        console.log(getURLParameter('orig'));
        console.log(getURLParameter('mod'));
        console.log("calling displayDirections");
        displayDirections();
    }
}

// This function is in response to the user selecting "show route" on one
// of the markers within the calculated distance. This will display the route
// on the map.
function displayDirections() {
    if (directionsDisplay != null) {
        directionsDisplay.setMap(null);
        directionsDisplay.setPanel(null);
        directionsDisplay = null;
    }
    currOrigin = document.getElementById('orig').value;
    currDestination = document.getElementById('dest').value;
    currMode = document.getElementById('mod').value;
    var directionsService = new google.maps.DirectionsService;
    directionsService.route({
        // The origin is the passed in marker's position.
        origin: currOrigin,
        // The destination is user entered address.
        destination: currDestination,
        travelMode: google.maps.TravelMode[currMode]
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay = new google.maps.DirectionsRenderer({
                map: map,
                directions: response,
                draggable: true,
                panel: document.getElementById('directions-panel')
            });
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

function displayMap() {
    var service = new google.maps.places.PlacesService(map);
    // Initialize the geocoder.
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({
        address: currAddress,
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            var lat = results[0].geometry.location.lat();
            var lng = results[0].geometry.location.lng();
            if (directionsDisplay) {
                directionsDisplay.setMap(null);
            }
            map.setCenter(results[0].geometry.location);
            map.setZoom(13);
            getParameterValues();
        } else {
            window.alert("Error in displayParks() - geocode!");
        }
    });
}

function getUserLocation() {
    $.ajax({
        async: false,
        url: ipURL,
        dataType: "jsonp",
        success: function(data) {
            var browserAddress = data.city + "," + data.postal + "," + data.region + "," + data.country;

            // check the browser address
            if (browserAddress == "") {
                currAddress = "US";
            } else {
                currAddress = browserAddress;
            }

            // Display parks based on current user location
            displayMap();
        },
        error: function() {
            window.alert("Error in getUserLocation()!");
        }
    });
}
