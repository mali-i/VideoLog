<template>
  <div class="container">
    <h1>Hello from Vue!</h1>
    <p>Welcome to your Electron + Vue app.</p>
    <button @click="count++">Count is: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const count = ref(0);
</script>

<style scoped>
.container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
