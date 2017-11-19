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





Vue.component('leads-search', {
  props: ['searchinput', 'searchenabled'],
  template: `<div class="uk-flex uk-flex-center uk-margin">
              <div class="uk-card uk-card-default uk-card-body uk-flex-1">
                  <form>
                    <fieldset class="uk-fieldset">
                      <div class="uk-flex uk-flex-center">
                          <input id="searchInput" class="uk-input uk-form-large" type="text" v-model="iSearchInput" :disabled="!searchenabled">
                          <button id="searchBtn" class="uk-button uk-button-primary" v-on:click="EmitSearch" :disabled="!searchenabled">Search</button>
                      </div>
                    </fieldset>
                  </form>
              </div>
            </div>`,
  data: function() {
    return {
      iSearchInput: ''
    }
  },
  watch: {
    'iSearchInput': function() {
      this.$emit('input', this.iSearchInput);
    }
  },
  created: function() {
    this.iSearchInput = this.searchinput;
  },
  methods: {
    EmitSearch: function(e) {
      e.preventDefault();
      this.$emit('search', this.iSearchInput);
    }
  }
})

Vue.component('leads-map', {
  props: ['mapspinnerenabled'],
  template: `<div class="uk-flex uk-flex-center uk-margin">
              <div class="uk-card uk-card-default uk-card-body uk-flex-1">
                  <div id="map"></div>
                  <div id="mapSpinner" v-if="mapspinnerenabled">
                    <div uk-spinner></div>
                    <div class="uk-text-meta">Getting your current location...</div>
                  </div>
              </div>
            </div>`
})

Vue.component('leads-place', {
  props: ['place'],
  template: `<div :id="'place-'+place.place_id" class="place-item uk-card uk-card-small uk-card-default uk-card-hover">
              <div class="uk-card-body">
                <div class="place-item-marker"><img src="assets/pin-small.png"><span>{{place.marker_label}}</span></div>
                <div class="place-item-information">
                  <div class="place-item-title uk-text-bold" v-on:click="EmitOpenInfoWindow">{{place.name}}</div>
                  <div class="uk-text-meta">{{place.vicinity}}</div>
                </div>
              </div>
              <div class="uk-card-footer">
                <button :id="'place-details-button-'+place.place_id" class="uk-button uk-button-primary uk-button-small uk-align-center" v-on:click="EmitGetPlaceDetails">Get Details</button>
              </div>
            </div>`,
  methods: {
    EmitOpenInfoWindow: function(e) {
      e.preventDefault();
      this.$emit('openinfowindow', this.place.place_id);
    },
    EmitGetPlaceDetails: function(e) {
      e.preventDefault();
      this.$emit('getplacedetails', this.place.place_id);
    }
  }
})

Vue.component('leads-place-overlay', {
  props: ['selectedplace'],
  template: `<div id="placeDetailsOverlay" uk-offcanvas="overlay: true">
              <div class="uk-offcanvas-bar">
                <div class="place-details">
                  <h1 class="uk-heading-divider">{{selectedplace.name}}</h1>
                  <div v-show="typeof selectedplace.phone_number !== 'undefined' && selectedplace.phone_number !== ''">
                    <span class="uk-text-bold uk-margin-right">Phone</span>
                    <a class="uk-link-text" :href="'tel:'+selectedplace.phone_number">
                      <span class="uk-text-meta">{{selectedplace.phone_number}}</span>
                    </a>
                  </div>
                  <div v-show="typeof selectedplace.website !== 'undefined' && selectedplace.website !== ''">
                    <span class="uk-text-bold uk-margin-right">Website</span>
                    <a class="uk-link-text" :href="selectedplace.website" target="_blank">
                      <span class="uk-text-meta">{{selectedplace.website}}</span>
                    </a>
                  </div>
                  <div v-show="typeof selectedplace.address !== undefined && selectedplace.address !== {}">
                    <span class="uk-text-bold uk-margin-right">Address</span>
                    <span class="uk-text-meta">{{selectedplace.address ? selectedplace.address.display : ''}}</span>
                  </div>
                  <div>
                    <button id="placeMoreDetailsBtn" class="more-button uk-button uk-button-text uk-button-small" :disabled="selectedplace.website === ''">
                      <span uk-icon="icon: plus-circle"></span>
                      <span uk-icon="icon: check"></span>
                      <span uk-icon="icon: check"></span> More Details
                    </button>
                  </div>
                </div>
                <hr class="uk-divider-icon">
                <div class="place-contacts">
                  <div class="place-contacts-header uk-flex uk-flex-row uk-flex-between uk-margin">
                    <span class="uk-text-lead">Contacts</span>
                    <button id="placeGetContactsBtn" class="more-button uk-button uk-button-text uk-button-small" :disabled="selectedplace.website === ''" v-on:click="EmitGetContacts">
                      <span uk-icon="icon: plus-circle"></span><span uk-icon="icon: check"></span>
                      <span uk-icon="icon: question"></span> Get Contacts
                    </button>
                  </div>
                  <div id="placeContactsContent" class="place-contacts-content uk-flex uk-flex-row uk-flex-around uk-flex-wrap">
                    <leads-place-contact v-for="contact in selectedplace.contacts" :contact="contact" v-on:getcontactdetails="EmitGetContactDetails" v-on:getcontacts="EmitGetContacts"></leads-place-contact>
                  </div>
                </div>
                <button class="uk-offcanvas-close" type="button" uk-close></button>
              </div>
            </div>`,
  methods: {
    EmitGetContacts: function(e) {
      e.preventDefault();
      this.$emit('getcontacts', this.selectedplace);
    },
    EmitGetMorePlaceDetails: function(e) {
      e.preventDefault();
      this.$emit('getmoreplacedetails', this.selectedplace);
    },
    EmitGetContactDetails: function(contact) {
      this.$emit('getcontactdetails', contact);
    }
  }
})

Vue.component('leads-place-contact', {
  props: ['contact'],
  template: `<div class="place-contact uk-card uk-card-small uk-card-default uk-card-hover">
              <div class="uk-card-body">
                <div class="uk-text-bold"><a :href="'mailto:' + contact.emails[0].email_address">{{contact.emails[0].email_address}}</a></div>
                <div class="uk-text-meta">{{contact.names[0].first_name}} {{contact.names[0].last_name}}</div>
              </div>
              <div class="uk-card-footer">
                <span class="uk-badge">{{contact.emails[0].confidence}}% Confidence</span>
                <span class="uk-label">{{contact.emails[0].type}}</span>
                <button class="place-contact-details-button uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom" v-on:click="GetContactDetails">Get Details</button>
              </div>
            </div>`,
  methods: {
    GetContactDetails: function(e) {
      e.preventDefault();
      this.$emit('getcontactdetails', this.contact);
    }
  }
})

// Vue.component('leads-contact-contact', {
//   props: ['contact'],
//   template: `<div class="place-contact uk-card uk-card-small uk-card-default uk-card-hover">
//               <div class="uk-card-body">
//                 <div class="uk-text-bold"><a :href="'mailto:' + contact.emails[0].email_address">{{contact.emails[0].email_address}}</a></div>
//                 <div class="uk-text-meta">{{contact.names[0].first_name}} {{contact.names[0].last_name}}</div>
//               </div>
//               <div class="uk-card-footer">
//                 <span class="uk-badge">{{contact.emails[0].confidence}}% Confidence</span>
//                 <span class="uk-label">{{contact.emails[0].type}}</span>
//                 <button class="place-contact-details-button uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom">Get Details</button>
//               </div>
//             </div>`,
//   methods: {
    
//   }
// })

Vue.component('leads-contact-overlay', {
  props: ['contact'],
  template: `<div id="contactDetailsOverlay" uk-offcanvas="overlay: true, flip: true">
              <div class="uk-offcanvas-bar">
                <div class="contact-details">
                  <div class="contact-details-images">
                    <div v-for="image in contact.images" class="contact-details-image" :style="{ backgroundImage: 'url('+image.url+')' }"></div>
                  </div>
                  <hr class="uk-divider-icon">
                  <div class="contact-tabs">
                    <ul uk-tab>
                      <li v-on:click="SelectTab(0)" :class="{ 'uk-active': tabSelected === 0 }"><a href="#">Names</a></li>
                      <li v-on:click="SelectTab(1)" :class="{ 'uk-active': tabSelected === 1 }"><a href="#">Usernames</a></li>
                      <li v-on:click="SelectTab(2)" :class="{ 'uk-active': tabSelected === 2 }"><a href="#">Numbers</a></li>
                      <li v-on:click="SelectTab(3)" :class="{ 'uk-active': tabSelected === 3 }"><a href="#">Addresses</a></li>
                      <li v-on:click="SelectTab(4)" :class="{ 'uk-active': tabSelected === 4 }"><a href="#">Jobs</a></li>
                      <li v-on:click="SelectTab(5)" :class="{ 'uk-active': tabSelected === 5 }"><a href="#">Education</a></li>
                      <li v-on:click="SelectTab(6)" :class="{ 'uk-active': tabSelected === 6 }"><a href="#">Links</a></li>
                    </ul>
                  </div>
                  <div class="contact-tabs-content">
                    <div v-show="tabSelected === 0" class="contact-names">
                      <ul class="uk-list uk-list-striped">
                        <li v-for="name in contact.names" class="contact-details-name">{{name.first_name}} {{name.last_name}}</li>
                      </ul>
                    </div>
                    <div v-show="tabSelected === 1" class="contact-usernames">
                      <ul class="uk-list uk-list-striped">
                        <li v-for="userName in contact.usernames" class="contact-details-username">{{userName.username}}</li>
                      </ul>
                    </div>
                    <div v-show="tabSelected === 2" class="contact-phones">
                      <ul class="uk-list uk-list-striped">
                        <li v-for="phone in contact.phone_numbers" class="contact-details-phone">
                          <a :href="'tel:'+phone.phone_number" target="_blank">{{phone.phone_number}}<span uk-icon="icon: forward"></span></a>
                        </li>
                      </ul>
                    </div>
                    <div v-show="tabSelected === 3" class="contact-addresses">
                      <ul class="uk-list uk-list-striped">
                        <li v-for="address in contact.addresses" class="contact-details-address">
                          <a :href="'https://www.google.com/maps/place/'+encodeURIComponent(address.display)" target="_blank">{{address.display}}<span uk-icon="icon: forward"></span></a>
                        </li>
                      </ul>
                    </div>
                    <div v-show="tabSelected === 4" class="contact-jobs">
                      <ul class="uk-list uk-list-striped">
                        <li v-for="job in contact.jobs" class="contact-details-job">{{job.display}}</li>
                      </ul>
                    </div>
                    <div v-show="tabSelected === 5" class="contact-educations">
                      <ul class="uk-list uk-list-striped">
                        <li v-for="education in contact.educations" class="contact-details-education">{{education.display}}</li>
                      </ul>
                    </div>
                    <div v-show="tabSelected === 6" class="contact-links">
                      <ul class="uk-list uk-list-striped">
                        <li v-for="link in contact.links" class="contact-details-link">
                          <a :href="link.url" target="_blank">{{link.url}}<span uk-icon="icon: forward"></span></a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <button class="uk-offcanvas-close" type="button" uk-close></button>
              </div>
            </div>`,
  methods: {
    SelectTab: function(tabNumber) {
      this.tabSelected = tabNumber;
    }
  },
  data: function () {
    return {
      tabSelected: 1
    }
  }
})

let LeadsApp = new Vue({
  el: '#leadsApp',
  data: {
    places: [],
    selectedPlace: {},
    selectedContact: {},
    apiService: new APIService(),
    placesService: {},
    searchInput: '',
    searchEnabled : true,
    currentLocation: new Location(),
    mapSpinnerEnabled: false,
    map: {},
    userMarker: {},
    markerLabels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    markerLabelIndex: 0
  },
  methods: {
    Init: function() {
      this.InitOverlays();
      this.EnableSearch(false);
      this.EnableMapSpinner(true);
      var defaultLocation = new google.maps.LatLng(39.491965, -97.034354);
      this.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: defaultLocation,
        gestureHandling: 'cooperative'
      });
      var icon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10
      }

      this.userMarker = new google.maps.Marker({
        position: defaultLocation,
        map: this.map,
        icon: icon
      });

      this.placesService = new google.maps.places.PlacesService(this.map);

      this.GetUserLocation()
        .then(() => {
          var location = new google.maps.LatLng(this.currentLocation.latitude, this.currentLocation.longitude);
          this.map.setCenter(location);
          this.map.setZoom(13);
          this.userMarker.setPosition(location);
          this.EnableMapSpinner(false);
          this.EnableSearch(true);
        })
        .catch(error => {
          //
        })
    },
    GetUserLocation: function() {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(position => {
          this.currentLocation = new Location({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          resolve();
        }, error => {
          console.log(error);
          reject();
        });
      })
    },
    GetNearbyPlaces: function(searchTerm) {
      var location = new google.maps.LatLng(this.currentLocation.latitude, this.currentLocation.longitude);
      var request = {
        location: location,
        radius: '5000',
        keyword: searchTerm
      };
      this.placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          for (let result of results) {
            this.AddNearbyPlaceMarker(result);
          }
          this.MapFitBounds();
          console.log(results);
          this.EnableMapSpinner(false);
        }
      });
    },
    AddNearbyPlaceMarker: function(place) {
      let icon = {
        url: '../assets/pin-small.png',
        size: new google.maps.Size(35, 50),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17.5, 50),
        labelOrigin: new google.maps.Point(17.5, 17)
      }

      let labelText = this.markerLabels[this.markerLabelIndex++ % this.markerLabels.length];
      
      let marker = new google.maps.Marker({
        map: this.map,
        position: place.geometry.location,
        icon: icon,
        label: { text: labelText, color: "white" }
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

      this.places.push(newPlace);
    },
    MapFitBounds: function() {
      let bounds = new google.maps.LatLngBounds();
      for (let place of this.places) {
        bounds.extend(place.marker.getPosition());
      }

      this.map.fitBounds(bounds);
    },
    OpenInfoWindow: function(placeId) {
      let placeIndex = this.places.findIndex(el => {
        return el.place_id === placeId;
      });
      google.maps.event.trigger(this.places[placeIndex].marker, 'click');
    },
    GetPlaceDetails: function(placeId) {
      var request = {
        placeId: placeId
      };
      this.placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          let placeIndex = this.places.findIndex(el => {
            return el.place_id === placeId;
          });

          this.MapAdditionalGmapsPlaceDetails(this.places[placeIndex], place);
          this.selectedPlace = this.places[placeIndex];
          
          this.EnablePlaceDetailsOverlay(true);
        }
      });
    },
    MapAdditionalGmapsPlaceDetails: function(place, gMapsPlace) {
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
    },
    GetContacts: function(selectedPlace) {
      this.GetHunterDetails(selectedPlace);
      this.GetAnyMailDetails(selectedPlace);
    },
    GetHunterDetails: function(place) {
      this.apiService.GetHunterDetails(place.website)
        .then(hunterData => {
          console.log(hunterData);
          this.MapHunterContacts(place, hunterData.data.emails);
        })
        .catch(error => {
          console.log(error);
        })
    },
    MapHunterContacts: function(place, hunterEmails) {
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
    },
    GetAnyMailDetails: function(businessURL) {
      this.apiService.GetAnyMailDetails(businessURL)
        .then(anymailData => {
          console.log(anymailData);
          this.MapAnyMailContacts(place, anymailData.emails);
        })
        .catch(error => {
          console.log(error);
        })
    },
    MapAnyMailContacts: function(place, anymailEmails) {
      for (let email of anymailEmails) {
        place.contacts.push(new Contact({
          emails: [ new Email({
            email_address: email.value,
            type: email.email_class
          }) ]
        }));
      }
    },
    GetContactDetails: function(contact) {
      this.selectedContact = contact;
      this.GetPiplDetails(contact);
    },
    GetPiplDetails: function(contact) {
      let email = contact.emails[0].email_address;
      let firstName = '';
      let lastName = '';
      if (contact.names.length > 0) {
        firstName = contact.names[0].first_name;
        lastName = contact.names[0].last_name;
      }

      this.apiService.GetPiplDetails(email, firstName, lastName)
        .then(piplData => {
          console.log(piplData);
          this.MapPiplContactDetails(contact, piplData.person);
          this.EnableContactDetailsOverlay(true);
        })
        .catch(error => {
          console.log(error);
        })
    },
    MapPiplContactDetails: function(contact, piplDetails) {

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

    },
    InitOverlays: function() {
      UIkit.offcanvas('#placeDetailsOverlay', {
        mode: 'slide',
        flip: true,
        overlay: true
      });
      UIkit.offcanvas('#contactDetailsOverlay', {
        mode: 'slide',
        flip: true,
        overlay: true
      });
    },
    EnableSearch: function(enabled) {
      this.searchEnabled = enabled;
    },
    EnableMapSpinner: function(enabled) {
      this.mapSpinnerEnabled = enabled;
    },
    EnablePlaceDetailsOverlay: function(enabled) {
      if (enabled) {
        UIkit.offcanvas('#placeDetailsOverlay').show();
      } else {
        UIkit.offcanvas('#placeDetailsOverlay').hide();
      }
    },
    EnableContactDetailsOverlay: function(enabled) {
      if (enabled) {
        UIkit.offcanvas('#contactDetailsOverlay').show();
      } else {
        UIkit.offcanvas('#contactDetailsOverlay').hide();
      }
    }
  }
})

LeadsApp.Init();