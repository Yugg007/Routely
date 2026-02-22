// constants.js or top of file
const GOOGLE_MAPS_LIBRARIES = ["places"];
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  ],
};