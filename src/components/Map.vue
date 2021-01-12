<template>
  <div>
    <div id="map"></div>
    <div class="drawTool">
      <a-button-group>
        <a-button @click="changeMode('static')" icon="select" />
        <a-button @click="changeMode('add')" icon="plus" />
        <a-button @click="changeMode('edit')" icon="edit" />
        <a-button @click="changeMode('split')" icon="scissor" />
        <a-button @click="changeMode('delete')" icon="delete" />
        <a-button @click="changeMode('save')" icon="check" />
        <a-button @click="changeMode('cancel')" icon="close" />
      </a-button-group>
    </div>
  </div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@/assets/mapbox-gl-draw.css";
import { mapConfig, drawConfig } from "./mapConfig.js";
import { Static, SplitPoylgon } from "./modes/index.js";
export default {
  name: "Map",
  data() {
    return {
      featureCollection: {
        type: "FeatureCollection",
        features: [],
      },
      selectedFeatureId: [],
      drawState: "static",
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    // 改变编辑状态
    changeMode(type) {
      const isEdit = this.checkIsEdit();
      if (this.selectedFeatureId.length !== 0 && isEdit && type !== "save") {
        this.$message.warning("请保存当前操作");
        return;
      }
      // 清空
      if (type !== "save") {
        // this.Draw.deleteAll();
        // this.selectedFeatureId = [];
        // this.map.setFilter("editData", null);
      }

      switch (type) {
        case "edit":
          this.edit();
          break;
        case "delete":
          this.delete();
          break;
        case "save":
          this.save(isEdit);
          break;
        case "static":
          this.Draw.changeMode("static",);
          break;
        case "split":
          this.Draw.changeMode("splitPolygon",{
            draw:this.Draw
          });
          this.drawState = "split";
          break;
        case "add":
          this.add();
          break;
        default:
          break;
      }
    },
    // 编辑
    edit() {
      this.drawState = "edit";
      this.Draw.changeMode("simple_select");
    },
    // 增加
    add() {
      this.drawState = "add";
      this.Draw.changeMode("draw_polygon");
    },
    // 删除
    delete() {},
    // 保存
    save(isEdit) {
      const feature = this.Draw.getAll().features[0];
      feature.properties.id = isEdit ? feature.properties.id : feature.id;
      const data = this.map.getSource("editData")._data;
      // 当选择编辑后不做编辑操作，然后直接保存，会使判断是否编辑有误，增加判断drawState确定保存类型
      if (isEdit) {
        const features = data.features.map((v) => {
          return v.properties.id === feature.properties.id ? feature : v;
        });
        data.features = features;
      } else if (this.drawState !== "edit") {
        data.features.push(feature);
      }
      this.map.getSource("editData").setData(data);
      this.Draw.deleteAll();
      this.selectedFeatureId = [];
      this.map.setFilter("editData", null);
      this.Draw.changeMode("static");
      this.drawState = "static";
    },
    checkIsEdit() {
      const drawed = this.Draw.getAll().features[0];
      // 下面这一步可以调用数据库
      let flag;
      this.map.getSource("editData")._data.features.forEach((v) => {
        if (v.properties.id === this.selectedFeatureId[0]) {
          flag =
            JSON.stringify(v.geometry.coordinates) ===
            JSON.stringify(drawed.geometry.coordinates);
        }
      });
      return !flag;
    },
    // 初始化地图
    initMap() {
      mapboxgl.accessToken =
        "pk.eyJ1IjoiaGFoYXhpYW93YWkiLCJhIjoiY2szZTI4bWh2MWdwYzNucGRlcWgxMWg2aCJ9.ykCKZTiqQWql2XjNsOgTuQ";
      this.map = new mapboxgl.Map(mapConfig);
      this.initDraw();
    },
    // 初始化绘制工具
    initDraw() {
      this.initDrawModes();
      this.Draw = new MapboxDraw(drawConfig);
      this.map.addControl(this.Draw, "top-right");
      this.map.on("load", () => {
        this.initLayer();
        this.initEvents();
      });
    },
    // 初始化图层
    initLayer() {
      const data = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              id: 1,
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [115.7080078125, 39.80853604144591],
                  [118.87207031250001, 39.80853604144591],
                  [118.87207031250001, 41.343824581185686],
                  [115.7080078125, 41.343824581185686],
                  [115.7080078125, 39.80853604144591],
                ],
              ],
            },
          },
          {
            type: "Feature",
            properties: {
              id: 2,
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [119.61914062499999, 40.805493843894155],
                  [119.036865234375, 40.463666324587685],
                  [119.66308593749999, 40.22082997283287],
                  [119.61914062499999, 40.805493843894155],
                ],
              ],
            },
          },
        ],
      };
      this.map.addSource("editData", {
        type: "geojson",
        data,
      });
      this.map.addLayer({
        id: "editData",
        type: "fill",
        source: "editData",
        layout: {},
        paint: {
          "fill-color": "#088",
          "fill-opacity": 0.8,
        },
      });
    },
    // 初始化绘制模式
    initDrawModes() {
      MapboxDraw.modes.static = Static;
      MapboxDraw.modes.splitPolygon = SplitPoylgon;
    },
    // 初始化地图事件
    initEvents() {
      this.map.on("click", "editData", (e) => {
        const id = e.features[0].properties.id;
        if (
          this.selectedFeatureId.indexOf(id) < 0 &&
          (this.drawState === "edit" || this.drawState==="split") &&
          this.selectedFeatureId.length === 0
        ) {
          this.selectedFeatureId.push(id);
          const data = this.map.getSource("editData")._data;
          const data2 = [];
          data.features.forEach((feature) => {
            if (feature.properties.id === id) {
              data2.push(feature);
            }
          });
          this.Draw.add({
            type: "FeatureCollection",
            features: data2,
          });
          this.map.setFilter("editData", [
            "match",
            ["get", "id"],
            this.selectedFeatureId,
            false,
            true,
          ]);
        } else {
          // do
        }
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
  cursor: url("/assets/favicon.ico");
}
.drawTool {
  position: absolute;
  z-index: 2;
  top: 10px;
  /* width: 32px; */
  right: 50px;
}
</style>
