import { point, lineString, polygon } from "@turf/helpers";
import polygonToLine from "@turf/polygon-to-line";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import lineIntersect from "@turf/line-intersect";
import lineSplit from "@turf/line-split";
const doubleClickZoom = {
  enable(ctx) {
    setTimeout(() => {
      // First check we've got a map and some context.
      if (
        !ctx.map ||
        !ctx.map.doubleClickZoom ||
        !ctx._ctx ||
        !ctx._ctx.store ||
        !ctx._ctx.store.getInitialConfigValue
      )
        return;
      // Now check initial state wasn't false (we leave it disabled if so)
      if (!ctx._ctx.store.getInitialConfigValue("doubleClickZoom")) return;
      ctx.map.doubleClickZoom.enable();
    }, 0);
  },
  disable(ctx) {
    setTimeout(() => {
      if (!ctx.map || !ctx.map.doubleClickZoom) return;
      // Always disable here, as it's necessary in some cases.
      ctx.map.doubleClickZoom.disable();
    }, 0);
  },
};
const SplitPoylgon = {
  onSetup: function(options) {
    const state = {
      clickCount: 0,
      Draw: options.draw,
      dist: options.dist || 5,
      pointCount: 0,
      drawEnd: false,
      message: options.message || null,
    };
    // 禁用双击放大事件
    doubleClickZoom.disable(this);
    return state;
  },
  onClick: function(state, e) {
    if (state.clickCount === 0) {
      state.clickCount++;
      // this.changeMode("draw_line_string")
      return;
    } else {
      if (state.pointCount > 1 && this.isVertex(state, e))
        return this.clickOnVertex(state, e);
      const adsorption = this.getFeature("Adsorption");
      if (!this.getFeature("drawLine")) {
        var drawLine = this.newFeature({
          type: "Feature",
          properties: {},
          id: "drawLine",
          geometry: {
            type: "LineString",
            coordinates: [adsorption.coordinates],
          },
        });
        this.addFeature(drawLine);
        state.pointCount++;
      } else if (!state.drawEnd) {
        this.getFeature("drawLine").addCoordinate(
          state.pointCount,
          ...adsorption.coordinates
        );
        state.pointCount++;
      }
    }
  },
  onMouseMove: function(state, e) {
    if (state.Draw.getAll().features.length === 0) {
      state.clickCount = 0;
    }
    if (state.clickCount !== 0 && !state.drawEnd) {
      if (!this.polygon) {
        const coords = state.Draw.getAll().features[0].geometry.coordinates;
        this.polygon = polygon(coords);
        this.polygonLine = polygonToLine(this.polygon);
      }
      const turfPoint = point([e.lngLat.lng, e.lngLat.lat]);
      const snapped = nearestPointOnLine(this.polygonLine, turfPoint);
      var point2 = this.newFeature({
        type: "Feature",
        properties: {
          count: state.count,
        },
        id: "Adsorption",
        geometry: {
          type: "Point",
          coordinates:
            snapped.properties.dist > state.dist
              ? [e.lngLat.lng, e.lngLat.lat]
              : snapped.geometry.coordinates,
        },
      });
      this.addFeature(point2); // puts the point on the map
      if (this.getFeature("drawLine")) {
        const adsorption = this.getFeature("Adsorption");
        this.getFeature("drawLine").updateCoordinate(
          state.pointCount,
          ...adsorption.coordinates
        );
      }
    }
  },
  clickOnVertex: function(state) {
    console.log("onTrash");
    state.drawEnd = true;
    const result = this.split(state);
    console.log(result);
    this.changeMode("static");
  },
  isVertex: function(state) {
    let lastPoint = this.getFeature("drawLine").coordinates[
      state.pointCount - 1
    ];
    lastPoint = [lastPoint[0].toFixed(9), lastPoint[1].toFixed(9)];
    let c1 = this.getFeature("Adsorption").coordinates;
    c1 = [c1[0].toFixed(9), c1[1].toFixed(9)];
    return lastPoint.toString() === c1.toString();
  },
  onStop: function(state) {
    state.drawEnd = true;
    doubleClickZoom.enable(this);
    console.log(state.drawEnd);
  },
  toDisplayFeatures: function(state, geojson, display) {
    display(geojson);
  },
  split: function(state) {
    const coordinates = this.getFeature("drawLine").coordinates;
    // 去除重复点
    coordinates.pop();
    const line = lineString(coordinates);
    const points = lineIntersect(this.polygonLine, line);
    if (points.features.length !== 2) {
      if (state.message) state.message.warning("只能将面切割成两个！");
    } else {
      const lines = lineSplit(this.polygonLine, line).features;
      const splitPoint1 = points.features[0].geometry.coordinates;
      const splitPoint2 = points.features[1].geometry.coordinates;
      const splitLine = this.splitLineByPoints(line,[splitPoint1,splitPoint2]);
      const splitArray = [this.fixedCoordinate(splitPoint1),this.fixedCoordinate(splitPoint2)];
      let AB, BC, CA;
      for (const line of lines) {
        const firstPoint =this.fixedCoordinate(line.geometry.coordinates[0]);
        const lastPoint = this.fixedCoordinate(line.geometry.coordinates[
          line.geometry.coordinates.length - 1
        ]);
        // A-B-C-A 这样一个面
        // BC线段
        if (
          splitArray.indexOf(firstPoint) >= 0 &&
          splitArray.indexOf(lastPoint) >= 0
        ) {
          BC = line.geometry.coordinates;
          BC.pop()
          BC.push(...splitLine)
          // AB线段
        } else if (splitArray.indexOf(firstPoint) < 0) {
          AB = line.geometry.coordinates;
          AB.pop()
          // 添加切割线
          AB.push(
            ...splitLine
          );
          // CA
        } else if (splitArray.indexOf(lastPoint) < 0) {
          CA = line.geometry.coordinates;
          CA.shift()
        }
      }
      console.log(lines);
      
      let polygon1 = polygon([[...BC,BC[0]]]);
      let polygon2 = polygon([[...AB,...CA,AB[0]]])
      state.Draw.deleteAll();
      state.Draw.add(polygon1);
      state.Draw.add(polygon2);
      return [polygon1,polygon2]
    }
  },
  fixedCoordinate(coordinate) {
    return [coordinate[0].toFixed(6),coordinate[1].toFixed(6)].toString()
  },
  // 切割线
  splitLineByPoints(line, split) {
    let lines = lineSplit(line, point(split[0])).features;
    let line2;
    if (line.geometry.coordinates[0].toString() === lines[0].geometry.coordinates[0].toString()) {
      line2 = lines[0].geometry.coordinates;
    } else {
      line2 = lines[1].geometry.coordinates;
    }
    lines = lineSplit(lineString(line2), point(split[1])).features;
    if (
      line.geometry.coordinates[line.geometry.coordinates.length - 1].toString() ===
      lines[0].geometry.coordinates[
        lines[0].geometry.coordinates.length - 1
      ].toString()
    ) {
      return lines[0].geometry.coordinates;
    } else {
      return lines[1].geometry.coordinates;
    }
  },
};

export default SplitPoylgon;
