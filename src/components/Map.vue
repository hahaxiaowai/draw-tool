<template>
  <div id="map"></div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
export default {
  name: "Map",
  data() {
    return {
      myFeatureCollection: {
        type: "FeatureCollection",
        features: [
          /* insert features here */
        ],
      },
      selectedFeatureIndexes: [],
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      mapboxgl.accessToken =
        "pk.eyJ1IjoiaGFoYXhpYW93YWkiLCJhIjoiY2szZTI4bWh2MWdwYzNucGRlcWgxMWg2aCJ9.ykCKZTiqQWql2XjNsOgTuQ";
      this.map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11", // stylesheet location
        center: [-74.5, 40], // starting position [lng, lat]
        zoom: 9, // starting zoom
      });
      this.initDraw()
    },
    initDraw() {
      var Draw = new MapboxDraw({
        clickBuffer:50,
        touchBuffer:50,
      });
      this.map.addControl(Draw, "top-left");
      this.map.on("load", function () {
        // ALL YOUR APPLICATION CODE
      });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#map {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
