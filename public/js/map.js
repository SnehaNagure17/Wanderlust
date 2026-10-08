const map = new mapboxgl.Map({
  accessToken: mapToken,
  container: "map", // container ID
  style: "mapbox://styles/mapbox/streets-v12", // style URL
  center: listing.geometry.coordinates, // starting position [lng, lat]
  zoom: 9, // starting zoom
});

const marker = new mapboxgl.Marker({ color: "red" })
  .setLngLat(listing.geometry.coordinates)
  .setPopup(
    new mapboxgl.Popup({ closeOnClick: false }).setHTML(
      `<h5>${listing.location}</h5><p>Exact location will be provided after booking</p>`,
    ),
  )
  .addTo(map);
