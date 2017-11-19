$(document).ready(() => {
  // let leadsMap = new LeadsMap();
  // leadsMap.Init();
});

class LeadsMap {
  constructor() {
    this.APIService = new APIService();
    this.Places = [];

    this.SearchInput = $('#searchInput');
    this.SearchButton = $('#searchBtn');
    this.PlacesResultsList = $('#placesResultsList');
    this.NoResultsSelector = '#noResults';
    this.MapSpinner = $('#mapSpinner');
    this.PlaceDetailsOverlaySelector = '#placeDetailsOverlay';
    this.PlaceDetailsOverlayElement = $(this.PlaceDetailsOverlaySelector);
    this.PlaceMoreDetailsButtonSelector = '#placeMoreDetailsBtn';
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
    this.ShowMapSpinner();
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
        this.HideMapSpinner();
      } else {
        this.DisplayNoResultsFound();
        this.HideMapSpinner();
      }
    });
  }

  DisplayNoResultsFound() {
    $(this.NoResultsSelector).addClass('visible');
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

    let newPlace = new Place({
      name : place.name,
      place_id : place.place_id,
      vicinity : place.vicinity,
      marker : marker,
      marker_label : labelText
    });

    this.Places.push(newPlace);
  }

  MapFitBounds() {
    let bounds = new google.maps.LatLngBounds();
    for (let place of this.Places) {
      bounds.extend(place.marker.getPosition());
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
    let html = '<div id="place-' + place.place_id + '" class="place-item uk-card uk-card-small uk-card-default uk-card-hover">' +
                '<div class="uk-card-body">' +
                  '<div class="place-item-marker"><img src="assets/pin-small.png"><span>' + place.marker_label + '</span></div>' +
                  '<div class="place-item-information">' +
                    '<div class="place-item-title uk-text-bold">' + place.name + '</div>' +
                    '<div class="uk-text-meta">' + place.vicinity + '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="uk-card-footer">' +
                  '<button id="place-details-button-' + place.place_id + '" class="uk-button uk-button-primary uk-button-small uk-align-center">Get Details</button>' +
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
      return el.place_id === placeId;
    });
    google.maps.event.trigger(this.Places[placeIndex].marker, 'click');
  }

  GetPlaceDetails(placeId) {
    var request = {
      placeId: placeId
    };
    this.PlacesService.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        let placeIndex = this.Places.findIndex(el => {
          return el.place_id === placeId;
        });

        this.MapAdditionalGmapsPlaceDetails(this.Places[placeIndex], place);

        this.AddPlaceDetails(this.Places[placeIndex]);

        if (this.Places[placeIndex].website !== '') {
          this.AddMoreDetailsButtonHandler(this.Places[placeIndex]);
          this.AddPlaceContactsButtonHandler(this.Places[placeIndex]);
        } else {
          this.DisableElement(this.PlaceContactsButtonSelector);
        }
        
        this.ShowPlaceDetailsOverlay();
      }
    });
  }

  MapAdditionalGmapsPlaceDetails(place, gMapsPlace) {
    place.address = new Address({
      house_number: gMapsPlace.address_components.find(el => {
        return el.types.includes('street_number');
      }).long_name,
      street: gMapsPlace.address_components.find(el => {
        return el.types.includes('route');
      }).long_name,
      city: gMapsPlace.address_components.find(el => {
        return el.types.includes('locality');
      }).long_name,
      state: gMapsPlace.address_components.find(el => {
        return el.types.includes('administrative_area_level_1');
      }).long_name,
      zip_code: gMapsPlace.address_components.find(el => {
        return el.types.includes('postal_code');
      }).long_name,
      country: gMapsPlace.address_components.find(el => {
        return el.types.includes('country');
      }).long_name,
    });

    place.location = new Location({
      latitude: gMapsPlace.geometry.location.lat(), 
      longitude: gMapsPlace.geometry.location.lng()
    });

    place.website = gMapsPlace.website || '';
    place.phone_number = gMapsPlace.formatted_phone_number || '';
  }

  AddPlaceDetails(place) {
    let html = '<div class="uk-offcanvas-bar">' +
                  '<div class="place-details">' +
                    '<h1 class="uk-heading-divider">' + place.name + '</h1>';

    if (typeof place.phone_number !== '') {
      html += '<div><span class="uk-text-bold uk-margin-right">Phone</span><a class="uk-link-text" href="tel:' + place.phone_number + '"><span class="uk-text-meta">' + place.phone_number + '</span></a></div>';
    }

    if (typeof place.website !== '') {
      html += '<div><span class="uk-text-bold uk-margin-right">Website</span><a class="uk-link-text" href="' + place.website + '" target="_blank"><span class="uk-text-meta">' + place.website + '</span></a></div>';
    }

    if (typeof place.address !== {}) {
      html += '<div><span class="uk-text-bold uk-margin-right">Address</span><span class="uk-text-meta">' + place.address.display + '</span></div>';
    }

    html += '<div><button id="placeMoreDetailsBtn" class="more-button uk-button uk-button-text uk-button-small"><span uk-icon="icon: plus-circle"></span><span uk-icon="icon: check"></span><span uk-icon="icon: check"></span> More Details</button></div>'
    
    html += '</div>' +
            '<hr class="uk-divider-icon">' +
            '<div class="place-contacts">' +
              '<div class="place-contacts-header uk-flex uk-flex-row uk-flex-between uk-margin">' +
                '<span class="uk-text-lead">Contacts</span>' +
                '<button id="placeGetContactsBtn" class="more-button uk-button uk-button-text uk-button-small"><span uk-icon="icon: plus-circle"></span><span uk-icon="icon: check"></span><span uk-icon="icon: question"></span> Get Contacts</button>' +
              '</div>' +
              '<div id="placeContactsContent" class="place-contacts-content uk-flex uk-flex-row uk-flex-around uk-flex-wrap"></div>' +
            '</div>' +
            '<button class="uk-offcanvas-close" type="button" uk-close></button>' +
          '</div>';

    $(this.PlaceDetailsOverlayElement).empty();
    $(this.PlaceDetailsOverlayElement).append(html);
  }

  AddMoreDetailsButtonHandler(businessURL) {
    $(this.PlaceMoreDetailsButtonSelector).click(e => {
      e.preventDefault();
      this.DisableElement(this.PlaceMoreDetailsButtonSelector);
      this.CompleteMoreButton(this.PlaceMoreDetailsButtonSelector);
      this.GetFullContactsDetails(businessURL);
    });
  }

  GetFullContactsDetails(businessURL) {
    this.APIService.GetFullContactDetails(businessURL)
      .then(fullContactData => {
        console.log(fullContactData);
        this.AddMorePlaceDetails(fullContactData);
      })
      .catch(error => {
        console.log(error);
      })
  }

  AddMorePlaceDetails(placeDetails) {
    let html = '';
    
    $(this.PlaceDetailsOverlayElement).append(html);
  }

  AddPlaceContactsButtonHandler(place) {
    $(this.PlaceContactsButtonSelector).click(e => {
      e.preventDefault();
      this.DisableElement(this.PlaceContactsButtonSelector);
      this.CompleteMoreButton(this.PlaceContactsButtonSelector);
      $(this.PlaceContactsContentSelector).empty();
      this.GetHunterDetails(place);
      this.GetAnyMailDetails(place);
    });
  }

  GetHunterDetails(place) {
    this.APIService.GetHunterDetails(place.website)
      .then(hunterData => {
        console.log(hunterData);
        this.MapHunterContacts(place, hunterData.data.emails);
        this.AddContactsDetails(place);

        this.AddContactDetailsButtonHandler(place);
      })
      .catch(error => {
        console.log(error);
      })
  }

  MapHunterContacts(place, hunterEmails) {
    for (let email of hunterEmails) {
      let newContact = new Contact({
        emails: [ new Email({
          email_address: email.value,
          confidence: email.confidence,
          type: email.type
        }) ]
      });

      if (email.first_name !== '' && email.last_name !== '') {
        newContact.names.push(new Name({
          first_name: email.first_name,
          last_name: email.last_name,
        }));
      }
      place.contacts.push(newContact);
    }
  }

  GetAnyMailDetails(businessURL) {
    this.APIService.GetAnyMailDetails(businessURL)
      .then(anymailData => {
        console.log(anymailData);
        this.MapAnyMailContacts(place, anymailData.emails);
        this.AddContactsDetails(place);
      })
      .catch(error => {
        console.log(error);
      })
  }

  MapAnyMailContacts(place, anymailEmails) {
    for (let email of anymailEmails) {
      place.contacts.push(new Contact({
        emails: [ new Email({
          email_address: email.value,
          type: email.email_class
        }) ]
      }));
    }
  }

  AddContactsDetails(place) {
    for (let contact of place.contacts) {

      let firstName = '';
      let lastName = '';
      if (contact.names.length > 0) {
        firstName = contact.names[0].first_name;
        lastName = contact.names[0].last_name;
      }
      
      let email = contact.emails[0].email_address;
      let confidence = contact.emails[0].confidence;
      let type = contact.emails[0].type;

      let html = '<div class="place-contact uk-card uk-card-small uk-card-default uk-card-hover">' +
                  '<div class="uk-card-body">';

      if (firstName !== '' && lastName !== '' && email !== '') {
        html +=       '<div class="uk-text-bold"><a href="mailto:' + email + '">' + email + '</a></div>' +
                      '<div class="uk-text-meta">' + firstName + ' ' + lastName + '</div>';
      } else {
        html +=       '<div class="uk-text-bold"><a href="mailto:' + email + '">' + email + '</a></div>';
      }

      html +=     '</div>' +
                  '<div class="uk-card-footer">';

      if (confidence !== '') {
        html +=     '<span class="uk-badge">' + confidence + '% Confidence</span>';
      }

      if (type !== '') {
        html +=     '<span class="uk-label">' + type + '</span>';
      }

      html +=       '<button class="place-contact-details-button uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom">Get Details</button>' +
                  '</div>' +
                '</div>';

      $(this.PlaceContactsContentSelector).append(html);
    }
  }

  AddContactDetailsButtonHandler(place) {
    $(this.ContactDetailsButtonSelector).click(e => {
      e.preventDefault();
      let target = e.target;

      let email = $(target.parentElement.parentElement).find('.uk-text-bold').text();

      let contactIndex = place.contacts.findIndex(el => {
        return el.emails[0].email_address == email;
      })
      
      this.GetPiplDetails(place.contacts[contactIndex]);
    });
  }

  GetPiplDetails(contact) {
    let email = contact.emails[0].email_address;
    let firstName = '';
    let lastName = '';
    if (contact.names.length > 0) {
      firstName = contact.names[0].first_name;
      lastName = contact.names[0].last_name;
    }

    this.APIService.GetPiplDetails(email, firstName, lastName)
      .then(piplData => {
        console.log(piplData);
        this.MapPiplContactDetails(contact, piplData.person);
        this.AddPiplContactDetails(contact);
        this.ShowContactDetailsOverlay();
      })
      .catch(error => {
        console.log(error);
      })
  }

  MapPiplContactDetails(contact, piplDetails) {

    if (typeof piplDetails.images !== 'undefined') {
      for (let image of piplDetails.images) {
        contact.images.push(new Image({
          url: image.url
        }));
      }
    }

    if (typeof piplDetails.names !== 'undefined') {
      for (let name of piplDetails.names) {
        contact.names.push(new Name({
          first_name: name.first,
          middle_name: name.middle,
          last_name: name.last
        }));
      }
    }

    if (typeof piplDetails.usernames !== 'undefined') {
      for (let username of piplDetails.usernames) {
        contact.usernames.push(new UserName({
          username: username.content
        }));
      }
    }

    if (typeof piplDetails.phones !== 'undefined') {
      for (let phone of piplDetails.phones) {
        contact.phone_numbers.push(new PhoneNumber({
          phone_number: phone.display
        }));
      }
    }

    if (typeof piplDetails.addresses !== 'undefined') {
      for (let address of piplDetails.addresses) {
        contact.addresses.push(new Address({
          house_number: address.house,
          street: address.street,
          city: address.city,
          state: address.state,
          zip_code: address.zip_code,
          country: address.country,
          display: address.display
        }));
      }
    }

    if (typeof piplDetails.jobs !== 'undefined') {
      for (let job of piplDetails.jobs) {
        contact.jobs.push(new Job({
          title: job.title || '',
          organization: job.organization || '',
          industry: job.industry || '',
          date_range: job.date_range || {
            start: '',
            end: ''
          },
          display: job.display
        }));
      }
    }

    if (typeof piplDetails.educations !== 'undefined') {
      for (let education of piplDetails.educations) {
        contact.educations.push(new Education({
          school: education.school,
          date_range: education.date_range || {
            start: '',
            end: ''
          },
          display: education.display
        }));
      }
    }

    if (typeof piplDetails.urls !== 'undefined') {
      for (let url of piplDetails.urls) {
        contact.links.push(new Link({
          url: url.url
        }));
      }
    }

  }

  AddPiplContactDetails(contact) {
    let html = '<div class="uk-offcanvas-bar">' +
                  '<div class="contact-details">' +
                    '<div class="contact-details-images">';

    for (let image of contact.images) {
      html +=         '<div class="contact-details-image" style="background-image: url(' + image.url + ')"></div>';
    }

    html +=         '</div>' +
                    '<hr class="uk-divider-icon">' +
                    '<div class="contact-details-names">' +
                      '<h4>Names</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    for (let name of contact.names) {
      html +=         '<li class="contact-details-name">' + name.first_name + ' ' + name.last_name + '</li>';
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-usernames">' +
                      '<h4>Usernames</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    for (let userName of contact.usernames) {
      html +=         '<li class="contact-details-username">' + userName.username + '</li>';
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-phones">' +
                      '<h4>Phone Numbers</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    for (let phone of contact.phone_numbers) {
      html +=         '<li class="contact-details-phone"><a href="tel:' + phone.phone_number + '" target="_blank">' + phone.phone_number + ' <span uk-icon="icon: forward"></span></a></li>';
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-addresses">' +
                      '<h4>Addresses</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    for (let address of contact.addresses) {
      html +=         '<li class="contact-details-address"><a href="https://www.google.com/maps/place/' + encodeURIComponent(address.display) + '" target="_blank">' + address.display + ' <span uk-icon="icon: forward"></span></a></li>';
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-jobs">' +
                      '<h4>Jobs</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    for (let job of contact.jobs) {
      html +=         '<li class="contact-details-job">' + job.display + '</li>';
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-educations">' +
                      '<h4>Educations</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    for (let education of contact.educations) {
      html +=         '<li class="contact-details-education">' + education.display + '</li>';
    }

    html +=           '</ul>' +
                    '</div>' +
                    '<div class="contact-details-urls">' +
                      '<h4>URLs</h4>' +
                      '<ul class="uk-list uk-list-striped">';

    for (let link of contact.links) {
      html +=         '<li class="contact-details-url"><a href="' + link.url + '" target="_blank">' + link.url + ' <span uk-icon="icon: forward"></span></a></li>';
    }

    html +=           '</ul>' +
                    '</div>';
    
    html +=       '</div>' +
                  '<button class="uk-offcanvas-close" type="button" uk-close></button>' +
                '</div>';

    $(this.ContactDetailsOverlayElement).empty();
    $(this.ContactDetailsOverlayElement).append(html);
  }

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

  CompleteMoreButton(selector) {
    $(selector).addClass('completed');
  }

  ShowSpinner() {

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

  GetFullContactDetails(businessURL) {
    return new Promise((resolve, reject) => {
      $.ajax({
        method: 'POST',
        url: this.FullContactEndpoint,
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

class Place {
  constructor({ place_id = '', name = '', vicinity = '', marker = {}, marker_label = '' } = {}) {
    this.place_id = place_id;
    this.name = name;
    this.vicinity = vicinity;
    this.address = '';
    this.phone_number = '';
    this.website = '';
    this.location = {};
    this.marker = marker;
    this.marker_label = marker_label;
    this.contacts = [];
  }
}

class Location {
  constructor({ latitude = '', longitude = '' } = {}) {
    this.latitude = latitude;
    this.longitude = longitude;
  }
}

class Contact {
  constructor({ emails = [], names = [], addresses = [], phone_numbers = [], educations = [], images = [], jobs = [], links = [], usernames = [] } = {}) {
    this.emails = emails;
    this.names = names;
    this.addresses = addresses;
    this.phone_numbers = phone_numbers;
    this.educations = educations;
    this.images = images;
    this.jobs = jobs;
    this.links = links;
    this.usernames = usernames;
  }
}

class Email {
  constructor({ email_address = '', confidence = '', type = '' } = {}) {
    this.email_address = email_address;
    this.confidence = confidence;
    this.type = type
  }
}

class Name {
  constructor({ first_name = '', middle_name = '', last_name = '' } = {}) {
    this.first_name = first_name;
    this.middle_name = middle_name;
    this.last_name = last_name;
  }
}

class Address {
  constructor({ house_number = '', street = '', city = '', state = '', zip_code = '', country = '', display = '' } = {}) {
    this.house_number = house_number;
    this.street = street;
    this.city = city;
    this.state = state;
    this.zip_code = zip_code;
    this.country = country;
    this.display = display;

    if (this.display === '') {
      this._setDisplay();
    }
  }

  _setDisplay() {
    this.display = this.house_number + ' ' + this.street + ' ' + this.city + ', ' + this.state + ' ' + this.zip_code + ' ' + this.country;
  }
}

class PhoneNumber {
  constructor({ phone_number = '' } = {}) {
    this.phone_number = phone_number;
  }
}

class Education {
  constructor({ school = '', date_range = { start: '', end: '' }, display = '' } = {}) {
    this.school = school;
    this.date_range = date_range,
    this.display = display;
  }
}

class Job {
  constructor({ title = '', organization = '', industry = '', date_range = { start: '', end: '' }, display = '' } = {}) {
    this.title = title;
    this.organization = organization;
    this.industry = industry;
    this.date_range = date_range;
    this.display = display;
  }
}

class Image {
  constructor({ url = '' } = {}) {
    this.url = url;
  }
}

class Link {
  constructor({ domain = '', name = '', url = '' } = {}) {
    this.domain = domain;
    this.name = name;
    this.url = url;
  }
}

class UserName {
  constructor({ username } = {}) {
    this.username = username;
  }
}