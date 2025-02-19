<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white p-6">
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-7xl">
      <h1 class="text-2xl font-bold mb-6 text-center">Exemplo de js-parsons no Vue 3</h1>

      <button @click="iniciarParsons" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4 w-full">
        Iniciar Exercício
      </button>

      <div class="text-center text-sm mb-4">
        <p>Arraste as linhas de código para a área de código e ordene-as de forma correta.</p>
        <p>Após ordenar, clique em "Enviar Código" para verificar se está correto.</p>
      </div>

      <div class="text-center text-sm mb-4">
        <p>Área de Código:</p>
      </div>

      <div class="flex flex-wrap justify-center bg-gray-700 p-4 rounded">
        <div id="sortableTrash" class="sortable-code bg-gray-600 overflow-auto w-full"></div>

        <div id="sortable" class="sortable-code bg-gray-600 overflow-auto w-full"></div>
        <div style="clear:both;"></div>
      </div>

      <button @click="enviarCodigo" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full">
        Enviar Código
      </button>

      <div id="erros" class="mt-4 p-4 bg-gray-800 rounded"></div>
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
        trashId: "sortableTrash",
        max_wrong_lines: 1,
        feedback_cb: mostrarErros,
        lang: "ptbr"
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
        if (feedback.length === 0) {
          alert("Código correto!");
        } else {
          mostrarErros(feedback);

        }
      }
    };

    const mostrarErros = (feedback) => {
      let erros = feedback.errors;
      let errosHtml = "";

      for (let i = 0; i < erros.length; i++) {
        errosHtml += `<p>${erros[i]}</p>`;
      }

      document.getElementById("erros").innerHTML = `<h2>Erros:</h2> ${errosHtml}`;
    };

    onMounted(() => {
    });

    return { iniciarParsons, enviarCodigo };
  }
};
</script>

<style>
</style>
