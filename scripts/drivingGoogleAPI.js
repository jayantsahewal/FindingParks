$(document).ready(function($) {
    $.getScript("https://maps.googleapis.com/maps/api/js?libraries=places,geometry,drawing&key=AIzaSyDhnnBsuBzWtuzpUdmve0r3kL6d7NXuK84&v=3&callback=initMap",
        function() {});
});
// Create a blank map
var map;
// Create a new blank array for all the listing markers.
var markers = [];
// Create placemarkers array to use in multiple functions to have control
// over the number of places that show.
var placeMarkers = [];
// Placeholder for current address
var currAddress;
// Placeholder for directions
var directionsDisplay;
// Placeholder for infowindow
var placeInfoWindow;
// Placeholder for duration
var maxDuration;
// Placeholder for driving mode
var mode;
// API URL for determining location from IP address
var ipURL = "http://ipinfo.io";

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

    // This autocomplete is for use in the geocoder entry box.
    var zoomAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('zoom-to-area-text'));

    // Bias the boundaries within the map for the zoom to area text.
    zoomAutocomplete.bindTo('bounds', map);

    document.getElementById('zoom-to-area').addEventListener('click', function() {
        zoomToArea();
        clearFilterText();
    });
    document.getElementById('search-within-time').addEventListener('click', function() {
        searchWithinTime();
        setFilterText();
    });
    document.getElementById('clear-within-time').addEventListener('click', function() {
        zoomToArea();
        clearFilterText();
    });
}

// Set map center to current address
function setMapCenter() {
    console.log("setting center to: ", currAddress);
    // Initialize the geocoder.
    var geocoder = new google.maps.Geocoder();
    // Geocode the address/area entered to get the center. Then, center the map
    // on it and zoom in
    geocoder.geocode({
        address: currAddress,
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            map.setZoom(13);
        } else {
            window.alert('We could not find that location - try entering a more specific place.');
        }
    });
}

// This function will loop through the places and hide them all.
function hideMarkers(markers) {
    if (directionsDisplay) {
        directionsDisplay.setMap(null);
    }
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

// This function takes the input value in the find nearby area text input
// locates it, and then zooms into that area. This is so that the user can
// show all listings, then decide to focus on one area of the map.
function zoomToArea() {

    if (directionsDisplay) {
        directionsDisplay.setMap(null);
    }
    if (placeInfoWindow) {
        placeInfoWindow.close();
    }
    // Initialize the geocoder.
    var geocoder = new google.maps.Geocoder();
    // Get the address or place that the user entered.
    currAddress = document.getElementById('zoom-to-area-text').value;
    // Make sure the address isn't blank.
    if (currAddress == '') {
        window.alert('You must enter an area, or address.');
    } else {
        // Geocode the address/area entered to get the center. Then, center the map
        // on it and zoom in
        geocoder.geocode({
            address: currAddress,
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(13);
                displayParks();
            } else {
                window.alert('We could not find that location - try entering a more specific place.');
            }
        });
    }
}
// This function allows the user to input a desired travel time, in
// minutes, and a travel mode, and a location - and only show the listings
// that are within that travel time (via that travel mode) of the location
function searchWithinTime() {
    setMapCenter();
    if (directionsDisplay) {
        directionsDisplay.setMap(null);
    }
    if (placeInfoWindow) {
        placeInfoWindow.close();
    }
    // Initialize the distance matrix service.
    var distanceMatrixService = new google.maps.DistanceMatrixService;
    // Check to make sure the place entered isn't blank.
    if (currAddress == '') {
        window.alert('You must enter an address.');
    } else {
        hideMarkers(placeMarkers);
        // Use the distance matrix service to calculate the duration of the
        // routes between all our markers, and the destination address entered
        // by the user. Then put all the origins into an origin matrix.
        var origins = [];
        if (i > 24) {
            console.log("more than 25 parks. Picked first 25 only");
        }
        for (var i = 0; i < placeMarkers.length; i++) {
            if (i <= 24) {
                origins[i] = placeMarkers[i].position;
            }
        }
        var destination = currAddress;

        mode = document.getElementById('mode').value;
        // Now that both the origins and destination are defined, get all the
        // info for the distances between them.
        distanceMatrixService.getDistanceMatrix({
            origins: origins,
            destinations: [destination],
            travelMode: google.maps.TravelMode[mode],
            unitSystem: google.maps.UnitSystem.IMPERIAL,
        }, function(response, status) {
            if (status !== google.maps.DistanceMatrixStatus.OK) {
                window.alert('Error was: ' + status);
            } else {
                displayMarkersWithinTime(response);
            }
        });
    }
}
// This function will go through each of the results, and,
// if the distance is LESS than the value in the picker, show it on the map.
function displayMarkersWithinTime(response) {
    var bounds = new google.maps.LatLngBounds();
    maxDuration = document.getElementById('max-duration').value;
    var origins = response.originAddresses;
    var destinations = response.destinationAddresses;
    // Parse through the results, and get the distance and duration of each.
    // Because there might be  multiple origins and destinations we have a nested loop
    // Then, make sure at least 1 result was found.
    var atLeastOne = false;
    for (var i = 0; i < origins.length; i++) {
        var results = response.rows[i].elements;
        for (var j = 0; j < results.length; j++) {
            var element = results[j];
            if (element.status === "OK") {
                // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
                // the function to show markers within a user-entered DISTANCE, we would need the
                // value for distance, but for now we only need the text.
                var distanceText = element.distance.text;
                // Duration value is given in seconds so we make it MINUTES. We need both the value
                // and the text.
                var duration = element.duration.value / 60;
                var durationText = element.duration.text;
                if (duration <= maxDuration) {
                    //the origin [i] should = the markers[i]
                    placeMarkers[i].setMap(map);
                    atLeastOne = true;
                    bounds.extend(placeMarkers[i].getPosition());
                }
            }
        }
    }
    map.fitBounds(bounds);
    if (!atLeastOne) {
        window.alert('We could not find any locations within that distance!');
        zoomToArea();
        clearFilterText();
    }
}
// This function is in response to the user selecting "show route" on one
// of the markers within the calculated distance. This will display the route
// on the map.
function displayDirections(destination) {
    mode = document.getElementById('mode').value;
    hideMarkers(placeMarkers);
    var directionsService = new google.maps.DirectionsService;
    directionsService.route({
        // The origin is the passed in marker's position.
        origin: currAddress,
        // The destination is user entered address.
        destination: destination,
        travelMode: google.maps.TravelMode[mode]
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay = new google.maps.DirectionsRenderer({
                map: map,
                directions: response,
                draggable: true,
                polylineOptions: {
                    strokeColor: 'green'
                }
            });
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

// This function creates markers for each place found in either places search.
function createMarkersForPlaces(places) {
    hideMarkers(placeMarkers);
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
        var place = places[i];
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        // Create a marker for each place.
        var marker = new google.maps.Marker({
            map: map,
            //icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id,
            animation: google.maps.Animation.DROP
        });
        // Create a single infowindow to be used with the place details information
        // so that only one is open at once.
        placeInfoWindow = new google.maps.InfoWindow();
        // If a marker is clicked, do a place details search on it in the next function.
        marker.addListener('click', function() {
            if (placeInfoWindow.marker == this) {
                console.log("This infowindow already is on this marker!");
            } else {
                getPlacesDetails(this, placeInfoWindow);
            }
        });
        placeMarkers.push(marker);
        if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
}
// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
function getPlacesDetails(marker, infowindow) {
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.id
    }, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Set the marker property on this infowindow so it isn't created again.
            infowindow.marker = marker;
            var innerHTML = '<div>';
            if (place.name) {
                innerHTML += '<strong>' + place.name + '</strong>';
            }
            if (place.formatted_address) {
                innerHTML += '<br>' + place.formatted_address;
            }
            if (place.formatted_phone_number) {
                innerHTML += '<br>' + place.formatted_phone_number;
            }
            if (place.formatted_address) {
                innerHTML += '<br>' + '<div><input type=\"button\" value=\"View Route\" onclick =' +
                    '\"displayDirections(&quot;' + place.formatted_address + '&quot;);\"></input></div>';
            }
            if (place.opening_hours) {
                innerHTML += '<br><br><strong>Hours:</strong><br>' +
                    place.opening_hours.weekday_text[0] + '<br>' +
                    place.opening_hours.weekday_text[1] + '<br>' +
                    place.opening_hours.weekday_text[2] + '<br>' +
                    place.opening_hours.weekday_text[3] + '<br>' +
                    place.opening_hours.weekday_text[4] + '<br>' +
                    place.opening_hours.weekday_text[5] + '<br>' +
                    place.opening_hours.weekday_text[6];
            }
            if (place.photos) {
                innerHTML += '<br><br><img height="100" width="100" src="' + place.photos[0].getUrl({
                    maxHeight: 100,
                    maxWidth: 100
                }) + '">';
            }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
        }
    });
}

function displayParks() {
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
            console.log("setting center to: ", currAddress);
            map.setCenter(results[0].geometry.location);
            map.setZoom(13);
            service.nearbySearch({
                location: {
                    "lat": results[0].geometry.location.lat(),
                    "lng": results[0].geometry.location.lng()
                },
                radius: 50000,
                type: ['park']
            }, function(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    createMarkersForPlaces(results);
                    getWeatherInfo(lat, lng);
                } else {
                    window.alert("Error in displayParks() - nearbySearch!");
                }
            });
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

            // set the address to current Address.
            document.getElementById('zoom-to-area-text').value = currAddress;

            // Display parks based on current user location
            displayParks();
        },
        error: function() {
            window.alert("Error in getUserLocation()!");
        }
    });
}

function setFilterText() {
    document.getElementById("filter").innerHTML = "<small>Applied Filter: " + document.getElementById('max-duration').value + " min " + document.getElementById('mode').value.toLowerCase() + "</small>";
}

function clearFilterText() {
    document.getElementById("filter").innerHTML = "<small>Applied Filter: None</small>";
}

function getWeatherInfo(lat, lng) {
    var weatherURL = "http://api.wunderground.com/api/6959a5275080e706/forecast/q/" + lat + "," + lng + ".json";
    var weatherHTML = "<h2>Weather</h2>";
    $.ajax({
        url: weatherURL,
        dataType: "jsonp",
        success: function(parsed_json) {
            console.log("success");
            var forecasts = parsed_json['forecast']['simpleforecast']['forecastday'];
            for (var i = 0; i < forecasts.length; i++) {
                var dayString = forecasts[i]['date']['month'] + '/' + forecasts[i]['date']['day'] + '/' + forecasts[i]['date']['year'];
                weatherHTML += "<p>" + dayString + " (" + forecasts[i]['date']['weekday_short'] + ") : ";
                weatherHTML += " High:" + forecasts[i]['high']['fahrenheit'] + "\xB0F ";
                weatherHTML += " Low:" + forecasts[i]['low']['fahrenheit'] + "\xB0F ";
                weatherHTML += "<img src='" + forecasts[i]['icon_url'] + "'></p>";
            }
            document.getElementById("weather").innerHTML = weatherHTML;
        }
    });

}
