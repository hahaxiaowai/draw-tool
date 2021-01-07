<template>
  <div id="app">
    <Map />
  </div>
</template>

<script>
import Map from './components/Map.vue'

export default {
  name: 'App',
  components: {
    Map
  }
}
</script>

<style>
html,body{
  margin: 0 0;
}
#app{
  height: 100vh;
  overflow: hidden;
}
</style>
