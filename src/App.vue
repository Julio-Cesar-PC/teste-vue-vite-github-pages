<template>
	<div class="flex items-center justify-center min-h-screen bg-gray-900 text-white px-6 py-1">
		<div class="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-7xl mx-auto h-[95vh]">
			<h1 class="text-2xl font-bold mb-6 text-center">Exemplo de js-parsons no Vue 3</h1>

			<div v-if="loading" class="text-center text-sm mb-4 align-middle">
					<p>Carregando exercício...</p>
				</div>

			<div class="text-center text-sm mb-4" v-if="exercicio">
				<p>Enunciado:</p>
				<div class="bg-gray-700 p-4 rounded">
					{{ exercicio.enunciado }}
				</div>
			</div>

			<div class="flex flex-wrap justify-center bg-gray-700 p-4 rounded mb-4 h-[50vh]">
				<div id="sortableTrash" class="sortable-code bg-gray-600 overflow-auto h-full"></div>
				<div id="sortable" class="sortable-code bg-gray-600 overflow-auto h-full"></div>
			</div>

			<button @click="enviarCodigo" class="btn btn-primary w-full">
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
		const loading = ref(true);
		let parson = null;

		const iniciarParsons = async () => {
			try {
				loading.value = true;
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
			} finally {
				loading.value = false;
			}
		};

		const enviarCodigo = () => {
			if (parson) {
				let feedback = parson.getFeedback();
				if (feedback.length === 0) {
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

		return { iniciarParsons, enviarCodigo, exercicio, loading };
	}
};
</script>

<style>
.sortable-code {
	min-height: 30vh;
	padding: 10px;
	border: 2px dashed #ccc;
}
</style>