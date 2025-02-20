///////////// Tabelas:
/*
users:
  - id
  - email
  - sub
  - name
  - pic
  - userLevel
  - levelProgress
  - nextUserLevel


exercicios:
  - id
  - enunciado
  - dificuldade
  - exercicio
  - max_wrong_lines
  - unittests
  - initcode
  - code
  - toggleTypeHandlers
  - vartests
  - trinketHTML


historico:
  - id
  - userId (enviado pelo front)
  - startDate (enviado pelo front)
  - submitDate (enviado pelo front)
  - state (enviado pelo front)
  - exerciseId (enviado pelo front)
  - triesCount (enviado pelo front)
  - exerciseEnum
  - exerciseDifficulty

*/


///////////// Instruções
/*

INFORMAÇÃO IMPORTANTE:
Autenticação para requisições GET, o campo se chama "authentication"
Autenticação para requisições POST, o campo se chama "auth"

Para qualquer requisição GET, é necessário mandar:
-> actionRequest (a requisição que deseja fazer em formato de string, veja abaixo para mais detalhes)

Para qualquer requisição POST, é necessário mandar no body da requisição:
-> actionRequest (a requisição que deseja fazer em formato de string, veja abaixo para mais detalhes)
-> payload (o conteúdo a ser postado ou atualizado, deve ser um objeto em JSON)

Para requisições que precisem de autenticação de usuário (citadas abaixo do exemplo), é necessário mandar no body da requisição:
-> actionRequest (a requisição que deseja fazer em formato de string, veja abaixo para mais detalhes)
-> payload (o conteúdo a ser postado ou atualizado, deve ser um objeto em JSON)
-> auth (dados com autenticação de usuário, contendo os dados retornados pela request de login/cadastro)
  -> email_verified
  -> email
  -> sub
  Evite enviar dados inúteis na autenticação, como nome completo, picture e afins.

ATENÇÃO: Na request de login/cadastro, como os DADOS DE AUTENTICAÇÃO não são dados extras e sim os principais, eles se encaixam em PAYLOAD,
não há a necessidade de enviar o campo "auth" no login/cadastro.

-----------------------
GET e POST de exercícios

Para retornar algum exercício aleatório, fazer uma requisição do tipo GET com:
-> actionRequest: "getExercicioAleatorio"
-> dificuldade: <Possiveis valores: "iniciante", "intermediario", "avancado" ou "userDefault">
    -> "userDefault" pega a dificuldade atribuída ao usuário logado.
      -> Para isso, precisa enviar o campo "auth" junto nos parametros
* O retorno desse GET também retorna o horário em que esse exercício foi atribuído ao usuário, sem fazer nenhum post em nenhuma tabela
* Ao salvar no histórico o exercício em questão, não precisa mandar o horário de submit (o backend irá atribuir) mas é necessário mandar o horário de inicio foi retornado
ao receber o exercício 

Para postar algum exercício novo, fazer uma requisição do tipo POST com:
-> actionRequest: "postExercicio"
-> payload: {
    "enunciado": <Enunciado do exercício em HTML>,
    "dificuldade": <Possiveis valores: "iniciante", "intermediario" ou "avancado">,
    "exercicio": <Exercício em si, como ele é apresentado na biblioteca JS-Parsons>,
    "max_wrong_lines": <O máximo de distratores que serão mostrados>,
    "unittests": <Caso seja necessário teste unitário, mandar como string; caso não haja, mandar null>,
    "initcode": <Código a ser executado antes do teste, caso haja, mandar como string; caso não haja, mandar null>,
    "code": <Código a ser executado depois do teste, caso haja, mandar como string; caso não haja, mandar null>
    "toggleTypeHandlers": <Objeto contento as possibilidades de toggle (ver como são armazenados na documentação do JSParsons no TCC),
    "vartests": <Array de objetos contendo informações necessárias para realizar os testes com variáveis (ver como são armazenados na documentação do JSParsons no TCC)>
  }

*/