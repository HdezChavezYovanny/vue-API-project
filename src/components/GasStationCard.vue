<script setup>
import { isOpenNow } from "../utils/openStatus.js";
import { FUEL_FIELDS } from "../utils/fuelFields.js";

const props = defineProps({
  item: Object,
  fuelKey: String
});
</script>

<template>
  <div class="station-card">

    <h3>{{ props.item.brand }}</h3>

    <span>
      {{
        isOpenNow(props.item.horario) === true
          ? "Abierto"
          : isOpenNow(props.item.horario) === false
            ? "Cerrado"
            : "Desconocido"
      }}
    </span>

    <p>{{ props.item.address }}</p>
    <p>Horario: {{ props.item.horario }}</p>
    <p>Distancia: {{ props.item.distanceKm.toFixed(2) }} km</p>

    <p>Combustible: {{ FUEL_FIELDS.find(f => f.key === props.fuelKey)?.label }}</p>

    <p>Precio: {{ props.item.raw[props.fuelKey] }} €</p>

  </div>
</template>

<style scoped>
.station-card {
  padding: 14px;
  border: 1px solid #ccc;
  border-radius: 10px;
}
</style>
