$(document).ready(() => {
  let leadsMap = new LeadsMap();
  leadsMap.Init();
});

class LeadsMap {
  constructor() {
    this.Places = [];
    this.SearchInput = $('#searchInput');
    this.SearchButton = $('#searchBtn');
    this.PlacesResultsList = $('#placesResultsList');
    this.MapSpinner = $('#mapSpinner');
  }

  Init() {
    this.DisableSearch();
    this.AddSearchHandler();
    this.ShowMapSpinner();
    var defaultLocation = new google.maps.LatLng(39.491965, -97.034354);
    this.Map = new google.maps.Map(document.getElementById('map'), {
      zoom: 4,
      center: defaultLocation,
      gestureHandling: 'cooperative'
    });
    this.UserMarker = new google.maps.Marker({
      position: defaultLocation,
      map: this.Map
    });

    this.PlacesService = new google.maps.places.PlacesService(this.Map);
    this.InfoWindow = new google.maps.InfoWindow();

    this.GetUserLocation()
      .then(() => {
        var location = new google.maps.LatLng(this.CurrentLocation.coords.latitude, this.CurrentLocation.coords.longitude);
        this.Map.setCenter(location);
        this.Map.setZoom(13);
        this.UserMarker.setPosition(location);
        this.HideMapSpinner();
        this.EnableSearch();
        this.SetSearchFocus();
      })
      .catch(error => {
        //
      })
    
  }

  GetUserLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(position => {
        this.CurrentLocation = position;
        resolve();
      }, error => {
        console.log(error);
        reject();
      });
    })
  }

  SearchPlaces(searchTerm) {
    this.GetNearbyPlaces(searchTerm);
  }

  GetNearbyPlaces(searchTerm) {
    var location = new google.maps.LatLng(this.CurrentLocation.coords.latitude, this.CurrentLocation.coords.longitude);
    var request = {
      location: location,
      radius: '5000',
      keyword: searchTerm
    };
    this.PlacesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (let result of results) {
          this.AddNearbyPlaceMarker(result);
        }
        console.log(results);
        this.DisplayResultsList();
      }
    });
  }

  AddNearbyPlaceMarker(place) {
    var marker = new google.maps.Marker({
      map: this.Map,
      position: place.geometry.location
    });

    var _this = this;
    google.maps.event.addListener(marker, 'click', function() {
      _this.InfoWindow.setContent(place.name);
      _this.InfoWindow.open(_this.Map, this);
    });
    
    this.Places.push({ information: { place: place }, marker: marker });
  }

  DisplayResultsList() {
    for (let place of this.Places) {
      this.AddResultToResultsList(place);
    }
    this.AddPlaceDetailsHandler();
  }

  AddResultToResultsList(place) {
    let html = '<li id="place-' + place.information.place.place_id + '"><span class="uk-text-bold uk-margin-right">' + place.information.place.name + '</span>' +
      '<span class="uk-text-meta">' + place.information.place.vicinity + '</span>' +
      '<button id="place-details-button-' + place.information.place.place_id + '" class="uk-button uk-button-primary uk-button-small" style="float: right;">Get Details</button></li>';
    $(this.PlacesResultsList).append(html);
  }

  AddPlaceDetailsHandler() {
    $(this.PlacesResultsList).click(e => {
      let target = e.target;
      if (target.id.includes('place-details-button')) {
        e.preventDefault();
        let placeId = target.id.split('place-details-button-').pop();
        this.DisableElement(target);
        this.GetPlaceDetails(placeId);
      }
    });
  }

  GetPlaceDetails(placeId) {
    var request = {
      placeId: placeId
    };
    this.PlacesService.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        let placeIndex = this.Places.findIndex(el => {
          return el.information.place.place_id === placeId;
        });
        this.Places[placeIndex].placeDetails = place;
        this.AddPlaceDetails(this.Places[placeIndex]);
      }
    });
  }

  AddPlaceDetails(place) {
    let html = '<ul class="uk-list">';

    if (typeof place.placeDetails.website !== 'undefined') {
      html += '<li><span class="uk-text-bold uk-margin-right">Website</span><a class="uk-link-text" href="' + place.placeDetails.website + '" target="_blank"><span class="uk-text-meta">' + place.placeDetails.website + '</span></a></li>';
    }

    if (typeof place.placeDetails.formatted_address !== 'undefined') {
      html += '<li><span class="uk-text-bold uk-margin-right">Address</span><span class="uk-text-meta">' + place.placeDetails.formatted_address + '</span></li>';
    }

    if (typeof place.placeDetails.formatted_phone_number !== 'undefined') {
      html += '<li><span class="uk-text-bold uk-margin-right">Phone</span><a class="uk-link-text" href="tel:' + place.placeDetails.formatted_phone_number + '"><span class="uk-text-meta">' + place.placeDetails.formatted_phone_number + '</span></a></li>';
    }
    
    html += '</ul>';

    let placeEl = $(this.PlacesResultsList).find('#place-' + place.information.place.place_id);
    $(placeEl).append(html);
  }

  SetSearchFocus() {
    $(this.SearchInput).focus();
  }

  AddSearchHandler() {
    $(this.SearchButton).click(e => {
      e.preventDefault();
      let searchTerm = $(this.SearchInput).val();
      this.SearchPlaces(searchTerm);
    });
  }

  EnableSearch() {
    this.EnableElement(this.SearchInput);
    this.EnableElement(this.SearchButton);
  }

  DisableSearch() {
    this.DisableElement(this.SearchInput);
    this.DisableElement(this.SearchButton);
  }

  EnableElement(selector) {
    $(selector).prop('disabled', false);
  }

  DisableElement(selector) {
    $(selector).prop('disabled', true);
  }

  ShowMapSpinner() {
    $(this.MapSpinner).addClass('show');
  }

  HideMapSpinner() {
    $(this.MapSpinner).removeClass('show');
  }
}