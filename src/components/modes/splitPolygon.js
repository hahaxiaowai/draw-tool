import { point, polygon } from "@turf/helpers";
import polygonToLine from "@turf/polygon-to-line";
import nearestPointOnLine from "@turf/nearest-point-on-line";
const SplitPoylgon = {
  onSetup: function(options) {
    const state = {
      clickCount: 0,
      Draw: options.draw,
      dist: options.dist||5
    };
    return state;
  },
  onClick: function(state) {
    if (state.clickCount === 0) {
      state.clickCount++;

      // this.changeMode("draw_line_string")
      return;
    }
  },
  onMouseMove: function(state, e) {
    if (state.clickCount !== 0) {
      if(!this.polygon) {
        const coords = state.Draw.getAll().features[0].geometry.coordinates;
        this.polygon = polygon(coords);
        this.polygonLine = polygonToLine(this.polygon);
      }
      const turfPoint = point([e.lngLat.lng, e.lngLat.lat]);
      const snapped = nearestPointOnLine(this.polygonLine, turfPoint);
      if (state.clickCount !== 0) {
        var point2 = this.newFeature({
          type: "Feature",
          properties: {
            count: state.count,
          },
          id: "Adsorption",
          geometry: {
            type: "Point",
            coordinates: snapped.properties.dist>state.dist?[e.lngLat.lng, e.lngLat.lat]:snapped.geometry.coordinates,
          },
        });
        this.addFeature(point2); // puts the point on the map
      }
    }
  },
  toDisplayFeatures: function(state, geojson, display) {
    display(geojson);
  },
};

export default SplitPoylgon;
