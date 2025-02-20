<template>
	<div class="flex items-center justify-center min-h-screen bg-gray-900 text-white px-6 py-1">
	  <div class="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-7xl mx-auto h-[95vh]   ">
		<h1 class="text-2xl font-bold mb-6 text-center">Exemplo de js-parsons no Vue 3</h1>
  
		<div class="text-center text-sm mb-4" v-if="exercicio">
		  <p>Enunciado:</p>
		  <div class="bg-gray-700 p-4 rounded">
		  	{{ exercicio.enunciado }}
		  </div>
		</div>

		<div class="flex flex-wrap justify-center bg-gray-700 p-4 rounded mb-4">
		  <div id="sortableTrash" class="sortable-code bg-gray-600 overflow-auto w-full"></div>
		  <div id="sortable" class="sortable-code bg-gray-600 overflow-auto w-full"></div>
		</div>
  
		<button @click="enviarCodigo" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full">
		  Enviar Código
		</button>
  
		<div id="erros" class="mt-4 p-4 bg-gray-800 rounded"></div>
	  </div>
	</div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import { getExercicioAleatorio } from './api/exercicios';
  
  export default {
	setup() {
	  const exercicio = ref(null);
	  let parson = null;
  
	  const iniciarParsons = async () => {
		try {
		  const response = await getExercicioAleatorio();
		  console.log(response);
		  exercicio.value = response.exercicio;
		  console.log(exercicio.value);
		  
		  if (parson) {
			document.getElementById("sortable").innerHTML = "";
			document.getElementById("sortableTrash").innerHTML = "";
		  }
		  
		  parson = new ParsonsWidget({
			sortableId: "sortable",
			trashId: "sortableTrash",
			max_wrong_lines: 1,
			feedback_cb: mostrarErros,
			lang: "ptbr"
		  });
  
		  parson.init(exercicio.value.exercicio);
		  parson.shuffleLines();
		} catch (error) {
		  console.error("Erro ao buscar exercício", error);
		}
	  };
  
	  const enviarCodigo = () => {
		if (parson) {
		  let feedback = parson.getFeedback();
		  if (feedback.errors.length === 0) {
			alert("Código correto!");
		  } else {
			mostrarErros(feedback);
		  }
		}
	  };
  
	  const mostrarErros = (feedback) => {
		let errosHtml = feedback.errors.map(error => `<p>${error}</p>`).join('');
		document.getElementById("erros").innerHTML = `<h2>Erros:</h2> ${errosHtml}`;
	  };
  
	  onMounted(() => {
		iniciarParsons();
	  });
  
	  return { iniciarParsons, enviarCodigo, exercicio };
	}
  };
  </script>
  
  <style>
  .sortable-code {
	min-height: 150px;
	padding: 10px;
	border: 2px dashed #ccc;
  }
  </style>
  