  
var Static = {};

Static.onSetup = function() {
  this.setActionableState(); // default actionable state is false for all actions
  return {};
};

Static.toDisplayFeatures = function(state, geojson, display) {
  display(geojson);
};
export default Static;