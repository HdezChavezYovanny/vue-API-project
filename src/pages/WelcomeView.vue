<script setup>

</script>

<template>
    <div class="container">
        <h1>Welcome to a View with Vue</h1>
        <p>A través de esta página interactiva, podrás encontrar la gasolinera que más se adapte a tus necesidades en España. <br>
            Como se puede observar en la parte superior de nuestro menu de opciones, tenemos la vista del profesor y la versión mejorada por
            el estudiante. Gracias al profesor pudimos obtener una versión funcional con todas las funciones necesarias para el funcionamiento 
            correcto desde el llamado de la API hasta el filtrado de los resultados mostrados. <br> <br>
        </p>
        <h2>Versión del profesor</h2>
        <p>En la versión del profesor, encontraremos una interfaz rudimentaria, pero donde todos los campos funcionan sin ningún problema. Como 
            podremos notar al visitarla, no cuenta con gran interacción por parte del usuario más que algunas listas desplegables y botones para 
            seleccionar algunos filtros o propiedades de la búsqueda. <br><br>
        </p>
        <h2>Mi versión mejorada</h2>
        <p>En esta version mejorada se busco generar un diseño base a través de html y CSS sin utilizar ninguna librería o apoyo de parte de Vue. 
            Esto se realizó con el objetivo de crear un diseño preliminar de lo que se buscaba obtener por medio de las herramientas de Vue, que en 
            este caso se usó Vuetify.<br><br>
        </p>
        <h2>Versión con Vuetify</h2>
        <p>Gracias a Vuetify, pudimos explotar un poco el potencial de Vue al llevar mi versión mejorada al siguiente nivel con mejor disposición, diseño 
          y efectos más modernos.
        </p>
    </div>
    
</template>

<style>
p {
    color: #1a1a1a;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #DCDCDC; /* NEUTRO BASE*/
  margin: 0;
  color: #1a1a1a;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

h1, h2, h3, h4 {
  color: #F85A3E; /* NARANJA SECUNDARIO*/
  text-shadow: 1px 1px 1px #2D6CDF; /* AZUL PRINCIPAL para la sombra */
}
</style>