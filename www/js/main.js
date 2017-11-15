$(document).ready(() => {
  let leadsMap = new LeadsMap();
  leadsMap.Init();
});

class LeadsMap {
  constructor() {
    this.APIService = new APIService();
    this.Places = [];

    this.SearchInput = $('#searchInput');
    this.SearchButton = $('#searchBtn');
    this.PlacesResultsList = $('#placesResultsList');
    this.MapSpinner = $('#mapSpinner');
    this.PlaceDetailsOverlaySelector = '#placeDetailsOverlay';
    this.PlaceDetailsOverlayElement = $(this.PlaceDetailsOverlaySelector);
    this.PlaceContactsButtonSelector = '#placeGetContactsBtn';
    this.PlaceContactsContentSelector = '#placeContactsContent';
    this.ContactDetailsButtonSelector = '.place-contact-details-button';
    this.ContactDetailsOverlaySelector = '#contactDetailsOverlay';
    this.ContactDetailsOverlayElement = $(this.ContactDetailsOverlaySelector);

    this.MarkerLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.MarkerLabelIndex = 0;
  }

  Init() {
    this.InitPlaceDetailsOverlay();
    this.InitContactDetailsOverlay();
    this.DisableSearch();
    this.AddSearchHandler();
    this.ShowMapSpinner();
    var defaultLocation = new google.maps.LatLng(39.491965, -97.034354);
    this.Map = new google.maps.Map(document.getElementById('map'), {
      zoom: 4,
      center: defaultLocation,
      gestureHandling: 'cooperative'
    });
    var icon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10
    }

    this.UserMarker = new google.maps.Marker({
      position: defaultLocation,
      map: this.Map,
      icon: icon
    });

    this.PlacesService = new google.maps.places.PlacesService(this.Map);

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
        this.MapFitBounds();
        console.log(results);
        this.DisplayResultsList();
      }
    });
  }

  AddNearbyPlaceMarker(place) {
    let icon = {
      url: '../assets/pin-small.png',
      size: new google.maps.Size(35, 50),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17.5, 50),
      labelOrigin: new google.maps.Point(17.5, 17)
    }

    let labelText = this.MarkerLabels[this.MarkerLabelIndex++ % this.MarkerLabels.length];
    
    let marker = new google.maps.Marker({
      map: this.Map,
      position: place.geometry.location,
      icon: icon,
      label: {text: labelText, color: "white"}
    });

    let infoWindow = new SnazzyInfoWindow({
        marker: marker,
        content: place.name,
        backgroundColor: '#666',
        fontColor: '#FFF',
        shadow: false,
        border: false,
        borderRadius: '0',
        offset: {
          top: '-55px',
          left: '0px'
        },
        closeWhenOthersOpen: true
    });
    
    this.Places.push({ 
      information: { place: place }, 
      mapsInfo: { marker: marker, label: labelText } 
    });
  }

  MapFitBounds() {
    let bounds = new google.maps.LatLngBounds();
    for (let place of this.Places) {
      bounds.extend(place.mapsInfo.marker.getPosition());
    }

    this.Map.fitBounds(bounds);
  }

  DisplayResultsList() {
    for (let place of this.Places) {
      this.AddResultToResultsList(place);
    }
    this.AddPlaceDetailsHandlers();
  }

  AddResultToResultsList(place) {
    let html = '<div id="place-' + place.information.place.place_id + '" class="place-item uk-card uk-card-small uk-card-default uk-card-hover">' +
                '<div class="uk-card-body">' +
                  '<div class="place-item-marker"><img src="assets/pin-small.png"><span>' + place.mapsInfo.label + '</span></div>' +
                  '<div class="place-item-information">' +
                    '<div class="place-item-title uk-text-bold">' + place.information.place.name + '</div>' +
                    '<div class="uk-text-meta">' + place.information.place.vicinity + '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="uk-card-footer">' +
                  '<button id="place-details-button-' + place.information.place.place_id + '" class="uk-button uk-button-primary uk-button-small uk-align-center">Get Details</button>' +
                '</div>' +
              '</div>';
    $(this.PlacesResultsList).append(html);
  }

  AddPlaceDetailsHandlers() {
    $(this.PlacesResultsList).click(e => {
      let target = e.target;
      if (target.id.includes('place-details-button')) {
        e.preventDefault();
        let placeId = target.id.split('place-details-button-').pop();
        this.GetPlaceDetails(placeId);
      } else if (target.classList.contains('place-item-title')) {
        e.preventDefault();
        let placeId = target.parentElement.parentElement.parentElement.id.split('place-').pop();
        this.OpenInfoWindow(placeId);
      }
    });
  }

  OpenInfoWindow(placeId) {
    let placeIndex = this.Places.findIndex(el => {
      return el.information.place.place_id === placeId;
    });
    google.maps.event.trigger(this.Places[placeIndex].mapsInfo.marker, 'click');
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

        if (this.Places[placeIndex].placeDetails && this.Places[placeIndex].placeDetails.website) {
          this.AddPlaceContactsButtonHandler(this.Places[placeIndex].placeDetails.website);
        } else {
          this.DisableElement(this.PlaceContactsButtonSelector);
        }
        
        this.ShowPlaceDetailsOverlay();
      }
    });
  }

  AddPlaceDetails(place) {
    let html = '<div class="uk-offcanvas-bar">' +
                  '<div class="place-details">' +
                    '<h1 class="uk-heading-divider">' + place.information.place.name + '</h1>';

    if (typeof place.placeDetails.formatted_phone_number !== 'undefined') {
      html += '<div><span class="uk-text-bold uk-margin-right">Phone</span><a class="uk-link-text" href="tel:' + place.placeDetails.formatted_phone_number + '"><span class="uk-text-meta">' + place.placeDetails.formatted_phone_number + '</span></a></div>';
    }

    if (typeof place.placeDetails.website !== 'undefined') {
      html += '<div><span class="uk-text-bold uk-margin-right">Website</span><a class="uk-link-text" href="' + place.placeDetails.website + '" target="_blank"><span class="uk-text-meta">' + place.placeDetails.website + '</span></a></div>';
    }

    if (typeof place.placeDetails.formatted_address !== 'undefined') {
      html += '<div><span class="uk-text-bold uk-margin-right">Address</span><span class="uk-text-meta">' + place.placeDetails.formatted_address + '</span></div>';
    }
    
    html += '</div>' +
            '<hr class="uk-divider-icon">' +
            '<div class="place-contacts">' +
              '<div class="place-contacts-header uk-flex uk-flex-row uk-flex-between uk-margin">' +
                '<span class="uk-text-lead">Contacts</span>' +
                '<button id="placeGetContactsBtn" class="uk-button uk-button-primary uk-button-small">Get Contacts</button>' +
              '</div>' +
              '<div id="placeContactsContent" class="place-contacts-content uk-flex uk-flex-row uk-flex-around uk-flex-wrap"></div>' +
            '</div>' +
            '<button class="uk-offcanvas-close" type="button" uk-close></button>' +
          '</div>';

    $(this.PlaceDetailsOverlayElement).empty();
    $(this.PlaceDetailsOverlayElement).append(html);
  }

  AddPlaceContactsButtonHandler(businessURL) {
    $(this.PlaceContactsButtonSelector).click(e => {
      e.preventDefault();
      $(this.PlaceContactsContentSelector).empty();
      this.GetHunterDetails(businessURL);
      this.GetAnyMailDetails(businessURL);
    });
  }

  GetHunterDetails(businessURL) {
    this.APIService.GetHunterDetails(businessURL)
      .then(hunterData => {
        console.log(hunterData);
        this.AddHunterContactsDetails(hunterData.data.emails);

        this.AddContactDetailsButtonHandler();
      })
      .catch(error => {
        console.log(error);
      })
  }

  GetAnyMailDetails(businessURL) {
    this.APIService.GetAnyMailDetails(businessURL)
      .then(anymailData => {
        console.log(anymailData);
        this.AddAnyMailContactsDetails(anymailData.emails);
      })
      .catch(error => {
        console.log(error);
      })
  }

  AddHunterContactsDetails(contacts) {
    for (let contact of contacts) {
      let html = '<div class="place-contact uk-card uk-card-small uk-card-default uk-card-hover">' +
                  '<div class="uk-card-body">';

      if (contact.first_name && contact.last_name) {
        html +=       '<div class="uk-text-bold"><a href="mailto:' + contact.value + '">' + contact.value + '</a></div>' +
                      '<div class="uk-text-meta">' + contact.first_name + ' ' + contact.last_name + '</div>';
      } else {
        html +=       '<div class="uk-text-bold"><a href="mailto:' + contact.value + '">' + contact.value + '</a></div>';
      }

      html +=     '</div>' +
                  '<div class="uk-card-footer">' +
                    '<span class="uk-badge">' + contact.confidence + '% Confidence</span>' +
                    '<span class="uk-label">' + contact.type + '</span>' +
                    '<button class="place-contact-details-button uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom">Get Details</button>' +
                  '</div>' +
                '</div>';

      $(this.PlaceContactsContentSelector).append(html);
    }
  }

  AddAnyMailContactsDetails(contacts) {
    for (let contact of contacts) {
      let html = '<div class="place-contact uk-card uk-card-small uk-card-default uk-card-hover">' +
                  '<div class="uk-card-body">' +
                    '<div class="uk-text-bold"><a href="mailto:' + contact.email + '">' + contact.email + '</a></div>' +
                  '</div>' +
                  '<div class="uk-card-footer">' +
                    '<span class="uk-label">' + contact.email_class + '</span>' +
                    '<button id="contactDetailsButton" class="place-contact-details-button uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom">Get Details</button>' +
                  '</div>' +
                '</div>';

      $(this.PlaceContactsContentSelector).append(html);
    }
  }

  AddContactDetailsButtonHandler() {
    $(this.ContactDetailsButtonSelector).click(e => {
      e.preventDefault();
      let target = e.target;

      let email = $(target.parentElement.parentElement).find('.uk-text-bold').text();
      let firstName = $(target.parentElement.parentElement).find('.uk-text-meta').text().split(' ')[0];
      let lastName = $(target.parentElement.parentElement).find('.uk-text-meta').text().split(' ')[1];
      
      this.GetPiplDetails(email, firstName, lastName);
    });
  }

  GetPiplDetails(email, firstName, lastName) {
    this.APIService.GetPiplDetails(email, firstName, lastName)
      .then(piplData => {
        console.log(piplData);
        this.AddPiplContactDetails(piplData.person);
        this.ShowContactDetailsOverlay();
      })
      .catch(error => {
        console.log(error);
      })
  }

  AddPiplContactDetails(person) {
    let html = '<div class="uk-offcanvas-bar">' +
                  '<div class="contact-details">' +
                    '<div class="contact-details-images">';

    if (typeof person.images !== 'undefined') {
      for (let image of person.images) {
        html +=       '<div class="contact-details-image" style="background-image: url(' + image.url + ')"></div>';
      }
    }

    html +=         '</div>' +
                    '<hr class="uk-divider-icon">' +
                    '<div class="contact-details-names">' +
                      '<h4>Names</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    if (typeof person.names !== 'undefined') {
      for (let name of person.names) {
        html +=       '<li class="contact-details-name">' + name.display + '</li>';
      }
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-usernames">' +
                      '<h4>Usernames</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    if (typeof person.usernames !== 'undefined') {
      for (let userName of person.usernames) {
        html +=       '<li class="contact-details-username">' + userName.content + '</li>';
      }
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-phones">' +
                      '<h4>Phone Numbers</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    if (typeof person.phones !== 'undefined') {
      for (let phone of person.phones) {
        html +=       '<li class="contact-details-phone"><a href="tel:' + phone.number + '" target="_blank">' + phone.display + ' <span uk-icon="icon: forward"></span></a></li>';
      }
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-addresses">' +
                      '<h4>Addresses</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    if (typeof person.addresses !== 'undefined') {
      for (let address of person.addresses) {
        html +=       '<li class="contact-details-address"><a href="https://www.google.com/maps/place/' + encodeURIComponent(address.display) + '" target="_blank">' + address.display + ' <span uk-icon="icon: forward"></span></a></li>';
      }
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-jobs">' +
                      '<h4>Jobs</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    if (typeof person.jobs !== 'undefined') {
      for (let job of person.jobs) {
        html +=       '<li class="contact-details-job">' + job.display + '</li>';
      }
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-educations">' +
                      '<h4>Educations</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    if (typeof person.educations !== 'undefined') {
      for (let education of person.educations) {
        html +=       '<li class="contact-details-education">' + education.display + '</li>';
      }
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-urls">' +
                      '<h4>URLs</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    if (typeof person.urls !== 'undefined') {
      for (let url of person.urls) {
        html +=       '<li class="contact-details-url"><a href="' + url.url + '" target="_blank">' + url.url + ' <span uk-icon="icon: forward"></span></a></li>';
      }
    }

    html +=           '</ul>' +
                    '</div>';
    
    html +=       '</div>' +
                  '<button class="uk-offcanvas-close" type="button" uk-close></button>' +
                '</div>';

    $(this.ContactDetailsOverlayElement).empty();
    $(this.ContactDetailsOverlayElement).append(html);
  }

  // GetFullContactsDetails(businessURL) {
  //   this.APIService.GetFullContactDetails(businessURL)
  //     .then(data => {
  //       console.log(data);
  //     })
  //     .catch(error => {
  //       console.log(error);
  //     })
  // }

  InitPlaceDetailsOverlay() {
    UIkit.offcanvas(this.PlaceDetailsOverlaySelector, {
      mode: 'slide',
      flip: true,
      overlay: true
    });
  }

  InitContactDetailsOverlay() {
    UIkit.offcanvas(this.ContactDetailsOverlaySelector, {
      mode: 'slide',
      flip: true,
      overlay: true
    });
  }

  ShowPlaceDetailsOverlay() {
    UIkit.offcanvas(this.PlaceDetailsOverlaySelector).show();
  }

  HidePlaceDetailsOverlay() {
    UIkit.offcanvas(this.PlaceDetailsOverlaySelector).hide();
  }

  ShowContactDetailsOverlay() {
    UIkit.offcanvas(this.ContactDetailsOverlaySelector).show();
  }

  HideContactDetailsOverlay() {
    UIkit.offcanvas(this.ContactDetailsOverlaySelector).hide();
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

class APIService {
  constructor() {
    // this.FullContactEndpoint = 'http://localhost:3090/api/fullcontact/domain';
    // this.HunterEndpoint = 'http://localhost:3090/api/hunter/domain';
    // this.AnyMailEndpoint = 'http://localhost:3090/api/anymail/domain';
    // this.PiplEndpoint = 'http://localhost:3090/api/pipl';
    this.FullContactEndpoint = 'https://leads-app-dev.herokuapp.com/api/fullcontact/domain';
    this.HunterEndpoint = 'https://leads-app-dev.herokuapp.com/api/hunter/domain';
    this.AnyMailEndpoint = 'https://leads-app-dev.herokuapp.com/api/anymail/domain';
    this.PiplEndpoint = 'https://leads-app-dev.herokuapp.com/api/pipl';
  }

  // GetFullContactDetails(businessURL) {
  //   return new Promise((resolve, reject) => {
  //     $.ajax({
  //       method: 'POST',
  //       url: this.FullContactEndpoint,
  //       data: {
  //         businessURL: businessURL
  //       },
  //       success: result => {
  //         resolve(result);
  //       },
  //       error: error => {
  //         reject(error);
  //       }
  //     })
  //   });
  // }

  GetHunterDetails(businessURL) {
    return new Promise((resolve, reject) => {
      $.ajax({
        method: 'POST',
        url: this.HunterEndpoint,
        data: {
          businessURL: businessURL
        },
        success: result => {
          resolve(JSON.parse(result));
        },
        error: error => {
          reject(JSON.parse(error));
        }
      })
    });
  }

  GetAnyMailDetails(businessURL) {
    return new Promise((resolve, reject) => {
      $.ajax({
        method: 'POST',
        url: this.AnyMailEndpoint,
        data: {
          businessURL: businessURL
        },
        success: result => {
          resolve(JSON.parse(result));
        },
        error: error => {
          reject(JSON.parse(error));
        }
      })
    });
  }

  GetPiplDetails(emailAddress, firstName, lastName) {
    return new Promise((resolve, reject) => {
      $.ajax({
        method: 'POST',
        url: this.PiplEndpoint,
        data: {
          emailAddress: emailAddress,
          firstName: firstName,
          lastName: lastName
        },
        success: result => {
          resolve(JSON.parse(result));
        },
        error: error => {
          reject(JSON.parse(error));
        }
      })
    });
  }
}