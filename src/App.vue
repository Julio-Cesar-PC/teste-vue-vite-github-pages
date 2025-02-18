<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white p-6">
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl">
      <h1 class="text-2xl font-bold mb-6 text-center">Exemplo de js-parsons no Vue 3</h1>

      <button @click="iniciarParsons" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4 w-full">
        Iniciar Exercício
      </button>

      <div id="sortable" class="sortable-code bg-white overflow-auto w-full"></div>

      <button @click="enviarCodigo" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full">
        Enviar Código
      </button>

      <div id="unittest" class="mt-4 p-4 bg-gray-800 text-yellow-400 rounded"></div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';

export default {
  setup() {
    let parson = null;

    const iniciarParsons = () => {
      parson = new ParsonsWidget({
        sortableId: "sortable",
        programmingLang: "c"
      });

      let codigoC = 
        `#include &ltstdio.h&gt
        int soma(int a, int b) {
            return a + b;
        }
        int main() {
            int resultado = soma(2, 3);
            printf("%d\\n", resultado);
            return 0;
        }`;

      parson.init(codigoC);
      parson.shuffleLines();
    };

    const enviarCodigo = () => {
      if (parson) {
        let feedback = parson.getFeedback();
        document.getElementById("unittest").innerHTML = `<h2>Feedback:</h2> ${feedback.feedback}`;
      }
    };

    onMounted(() => {
    });

    return { iniciarParsons, enviarCodigo };
  }
};
</script>

<style>
</style>
