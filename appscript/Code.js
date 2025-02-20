const spreadsheetID = "1CSgsZHBNbztHMVLukHhDK9PY8W_KTEbq0M_S_4bXl4w";
const spreadsheet = SpreadsheetApp.openById(spreadsheetID);

/////////////////////
// Testing
/*
const param =  {
  "actionRequest":"getExercicioAleatorio",
  "dificuldade": 1
}
*/

/*function testeDeSpreadsheet(){
  
  var data = spreadsheet.getSheetByName("exercicios").getDataRange().getValues();
  
  var dataJSON = buildJSON(data);

  console.log(dataJSON);
}*/

//function auth() {
//  Logger.log(ScriptApp.getOAuthToken())
//}

/*
function testeUltimaLinha() {
  Logger.log(spreadsheet.getSheetByName("exercicios").getMaxRows());

  const lastRow = spreadsheet.getSheetByName("exercicios").getDataRange().getLastRow();
  const newRowId = (spreadsheet.getSheetByName("exercicios").getRange(lastRow,1).getValue() + 1);
  Logger.log(newRowId);
}
*/

//////////////////////




function doGet(e) {
  const param = e.parameter;

  if (!param.hasOwnProperty("actionRequest")) {
    const res = {
      status:"failed",
      "message":"GET request is missing actionRequest"
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  switch (param.actionRequest) {
    case "getExercicioAleatorio": return getExercicioAleatorio(param);
    case "getHistorico": return (param.hasOwnProperty('authentication') ? getHistorico(param) : userAuthMissingWarning('get')); // Verificar auth do usuário aqui
    case "getQualquerExercicioAleatorio": return getQualquerExercicioAleatorio();
    case "getExercicioFiltrado" : return getExercicioFiltrado(param);
    case "getExercicioById" : return getExercicioById(param);
    default: return warningActionRequestInvalid();
  }
}






function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  //var message = 'Recebido um POST com os seguintes dados: ' + JSON.stringify(e);
  //writeLog(message); // Escreve a mensagem no log


  if (!body.hasOwnProperty("actionRequest")) {
    const res = {
      status:"failed",
      "message":"POST request is missing actionRequest"
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  } 
  else if (!body.hasOwnProperty("payload")) {
    const res = {
      status:"failed",
      "message":"POST request is missing payload parameter"
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  switch (body.actionRequest) {
    case "postExercicio": return postExercicioNovo(body.payload);
    case "postHistorico": return (body.hasOwnProperty('auth') ? postHistorico(body.payload, body.auth) : userAuthMissingWarning('post'));
    case "postNovoUsuario": return postCadastroDeUsuario(body.payload);
    case "updateExercicio": return updateExercicio(body.payload);
    case "deleteExercicio": return deleteExercicioAndHistory(body.payload);
    default: return warningActionRequestInvalid();
  }
}


///////////////////////////

// GET EXERCICIO

function getExercicioAleatorio(param) {
  // Verifica se possui os parametros corretos
  if(!(checkGetParameters(param.actionRequest,param))) {
    const res = {
      status:"failed",
      "message":"GET request is missing parameters (dificuldade)."
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  // Converte o valor do parâmetro para número, se possível
  const dificuldade = isNaN(param.dificuldade) ? param.dificuldade : parseInt(param.dificuldade, 10);

  // Verifica se o valor do parâmetro é válido (userDefault ou do nível 0 ao 19)
  if (!(["userDefault"].includes(dificuldade)) && !([...Array(20).keys()].includes(dificuldade))) {
    const res = {
      status: "failed",
      message: "One of GET request's parameters has an invalid value."
    };
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }
  

  // Verifica se mandou a combinação correta (userDefault + userId ou apenas uma das dificuldades)
  if (param.dificuldade == "userDefault" && !(param.hasOwnProperty("userId"))) {
    const res = {
      status:"failed",
      "message":"Difficulty is set to <userDefault>, but params is missing <userId>."
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  const data = spreadsheet.getSheetByName("exercicios").getDataRange().getValues();
  const dataJSON = buildJSON(data);
  var dataJSONFiltered;
  var exercisesCompletedByUser;

  // Define a dificuldade
  if(param.dificuldade == "userDefault") {
    const user = getUserById(param.userId);
    var dataJSONFiltered = dataJSON.filter((obj) => obj.dificuldade == user.userLevel); 
    exercisesCompletedByUser = getAllUserCompletedExercisesIdInHistory(user.id);

    // TO DO / TODO
    // DESCOMENTAR QUANDO TIVER MAIS EXERCÍCIOS FEITOS
    // Realiza a diferença de conjuntos para retirar todos os exercícios já realizados pelo usuário
    if (exercisesCompletedByUser != null) {
      dataJSONFiltered = dataJSONFiltered.filter((obj) => !exercisesCompletedByUser.includes(obj.id))
    }
  } else {
    dataJSONFiltered = dataJSON.filter((obj) => obj.dificuldade == param.dificuldade);
  }

  var rand = 0;
  var randEx = {};

  rand = Math.floor(Math.random() * (dataJSONFiltered.length));
  randEx = dataJSONFiltered[rand];

  const res = {
    status:"success",
    "exercicio":randEx,
    userLevelInfo: (param.dificuldade == "userDefault") ? getUserLevelInfo(param.userId) : null
  }

  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON); 
}

function getQualquerExercicioAleatorio() {
  const data = spreadsheet.getSheetByName("exercicios").getDataRange().getValues();
  var dataJSON = buildJSON(data);

  var rand = 0;
  var randEx = {};

  rand = Math.floor(Math.random() * (dataJSON.length));
  randEx = dataJSON[rand];
  //console.log(randEx);

  const res = {
    status:"success",
    "exercicio":randEx,
  }

  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON); 
}

function getExercicioFiltrado(param){
  var dificuldade = param.dificuldade || null;
  var area = param.area || null;
  var tags = param.tags ? param.tags.split(",") : []; // tags como um array de strings

  var result = null;
  // Verifica se ao menos um filtro foi fornecido
  if (!dificuldade && !area && tags.length === 0) {
    result = getAllExercicios()
  }
  else{
    result = getFilteredExercicios(dificuldade, area, tags);
  }
  // Chamar a função que realiza a pesquisa e retorna os exercícios filtrados
  
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// Função para obter todos os exercícios da planilha
function getAllExercicios() {
  // Pega todos os dados da planilha
  var data = spreadsheet.getSheetByName("exercicios").getDataRange().getValues();

  var headers = data[0]; // Cabeçalhos das colunas
  var rows = data.slice(1); // Linhas de dados (ignorando os cabeçalhos)

  // Criar um objeto com os índices de cada coluna
  var columns = {};
  headers.forEach(function(header, index) {
    columns[header] = index;
  });

  // Formatar a resposta (retornando todos os exercícios)
  var result = rows.map(function(row) {
    return {
      "id": row[columns["id"]],
      "enunciado": row[columns["enunciado"]],
      "dificuldade": row[columns["dificuldade"]],
      "exercicio": row[columns["exercicio"]],
      "max_wrong_lines": row[columns["max_wrong_lines"]],
      "unittests": row[columns["unittests"]],
      "initcode": row[columns["initcode"]],
      "code": row[columns["code"]],
      "toggleTypeHandlers": row[columns["toggleTypeHandlers"]],
      "vartests": row[columns["vartests"]],
      "trinketHTML": row[columns["trinketHTML"]],
      "area": row[columns["area"]],
      "pythonTutor": row[columns["pythonTutor"]],
      "imgEnunciado": row[columns["imgEnunciado"]],
      "tags": row[columns["tags"]]
    };
  });

  return {
    "status": "success",
    "data": result
  };
}

// Função para pesquisar os exercícios com os filtros
function getFilteredExercicios(dificuldade, area, tags) {
  // Pega todos os dados da planilha
  var data = spreadsheet.getSheetByName("exercicios").getDataRange().getValues();

  var headers = data[0]; // Cabeçalhos das colunas
  var rows = data.slice(1); // Linhas de dados (ignorando os cabeçalhos)
  
   // Criar um objeto com os índices de cada coluna
  var columns = {};
  headers.forEach(function(header, index) {
    columns[header] = index;
  });

  // Filtros
  var filteredExercicios = rows.filter(function(row) {
    var matchesDificuldade = (dificuldade !== null) ? row[columns["dificuldade"]] == dificuldade : true;
    var matchesArea = (area !== null) ? row[columns["area"]] == area : true;
    
    // Para as tags, verificamos se todas as tags fornecidas estão presentes nas tags do exercício
    var exerciseTags = row[columns["tags"]].split(","); // Tags do exercício separadas por vírgula
    var matchesTags = tags.length > 0 ? tags.every(tag => exerciseTags.includes(tag)) : true;
    
    return matchesDificuldade && matchesArea && matchesTags;
  });
  
  // Formatar a resposta (retornando os exercícios que passaram pelo filtro)
  var result = filteredExercicios.map(function(row) {
    return {
      "id": row[columns["id"]],
      "enunciado": row[columns["enunciado"]],
      "dificuldade": row[columns["dificuldade"]],
      "exercicio": row[columns["exercicio"]],
      "max_wrong_lines": row[columns["max_wrong_lines"]],
      "unittests": row[columns["unittests"]],
      "initcode": row[columns["initcode"]],
      "code": row[columns["code"]],
      "toggleTypeHandlers": row[columns["toggleTypeHandlers"]],
      "vartests": row[columns["vartests"]],
      "trinketHTML": row[columns["trinketHTML"]],
      "area": row[columns["area"]],
      "pythonTutor": row[columns["pythonTutor"]],
      "imgEnunciado": row[columns["imgEnunciado"]],
      "tags": row[columns["tags"]]
    };
  });
  
  return {
    "status": "success",
    "data": result
  };
}

// Função para buscar o exercício pelo ID
function getExercicioById(param) {
  var data = spreadsheet.getSheetByName("exercicios").getDataRange().getValues();
  const id = param.id || null;

  if (id == null){
    return ContentService.createTextOutput(JSON.stringify({status: "failed", message: "ID null"}))
    .setMimeType(ContentService.MimeType.JSON);
  }

  for (var i = 1; i < data.length; i++) {  // Ignorar cabeçalhos
    if (data[i][0] == id) {  // Supondo que o ID está na primeira coluna
      const exercicio = {
        id: data[i][0],
        enunciado: data[i][1],
        dificuldade: data[i][2],
        exercicio: data[i][3],
        max_wrong_lines: data[i][4],
        unittests: data[i][5],
        toggleTypeHandlers: data[i][6],
        vartests: data[i][7],
        trinketHTML: data[i][8],
        area: data[i][9],
        pythonTutor: data[i][10],
        imgEnunciado: data[i][11],
        tags: data[i][12]
      };
      return ContentService.createTextOutput(JSON.stringify({status: "success", exercicio: exercicio, userLevelInfo: (param.dificuldade == "userDefault") ? getUserLevelInfo(param.userId) : null
}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Caso não encontre o exercício
  return ContentService.createTextOutput(JSON.stringify({status: "failed", message: "Exercicio com esse ID não encontrado"}))
    .setMimeType(ContentService.MimeType.JSON);
}


function testGetExercicios() {
  var param = {
    "actionRequest": "getExercicioFiltrado", // Adiciona o actionRequest para identificar a ação
    //"dificuldade": "2", // Parâmetro de dificuldade que deseja testar
    //"area": "inputOutput", // Parâmetro de área
    //"tags": "teste" // Tags separadas por vírgula
  };
  
  // Simular o objeto `e` que o `doGet` receberia em uma requisição real
  var e = { "parameter": param };

  // Chamar a função `doGet` simulando uma requisição
  var result = doGet(e);

  // Exibir o resultado no log para verificar
  Logger.log(result.getContent());
}

function testGetExerciciosID() {
  var param = {
    "actionRequest": "getExercicioById", // Adiciona o actionRequest para identificar a ação
    "id" : 24
  };
  
  // Simular o objeto `e` que o `doGet` receberia em uma requisição real
  var e = { "parameter": param };

  // Chamar a função `doGet` simulando uma requisição
  var result = doGet(e);

  // Exibir o resultado no log para verificar
  Logger.log(result.getContent());
}


// POST EXERCICIO

function postExercicioNovo(payload) {

  // Verifica se possui todas as colunas corretas da tabela que deseja inserir
  if (!(checkPostParameters("exercicios",payload))) {
    const res = {
      status:"failed",
      "message": "Action requested is missing parameters or at least one of variables type doesn't match."
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  //var message = 'Dentro do postExercicioNovo, payload: ' + JSON.stringify(payload);
  //writeLog(message); // Escreve a mensagem no log


  const lastRow = spreadsheet.getSheetByName("exercicios").getDataRange().getLastRow();
  var newRowId = (spreadsheet.getSheetByName("exercicios").getRange(lastRow,1).getValue() + 1);
  if (typeof(newRowId) == 'string') {
    if (!newRowId.isNum()) {
      newRowId = '0';
    }
  }
  // Recebe o conteúdo do 'FormData' enviado pelo frontend
  var imgEnunciado = payload.imgEnunciado;
  var fileUrl = "null";
  if(imgEnunciado != "null"){
  // funcao salva no utils.js
    fileUrl = saveImgEnunciado(imgEnunciado.image, imgEnunciado.imageType, newRowId)
  }

  spreadsheet.getSheetByName("exercicios").appendRow(
    [
      newRowId,
      payload.enunciado,
      payload.dificuldade,
      payload.exercicio,
      payload.max_wrong_lines,
      payload.unittests,
      payload.toggleTypeHandlers,
      payload.vartests,
      payload.trinketHTML,
      payload.area,
      payload.pythonTutor,
      fileUrl,
      payload.tags
    ]
  );

  const res = {
    status:"success",
    "message":"Exercise posted successfully."
  }
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function updateExercicio(payload) {
  const sheet = spreadsheet.getSheetByName("exercicios");
  const data = sheet.getDataRange().getValues(); // Obtém todos os dados da tabela
  const id = payload.id; // ID do exercício a ser atualizado

  // Procura o exercício pelo ID na primeira coluna
  var rowToUpdate = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      rowToUpdate = i + 1; //Adiciona 1 para considerar a contagem da planilha (base 1)
      break;
    }
  }

  if (rowToUpdate === -1) {
    const res = {
      status: "failed",
      message: "Exercise with specified ID not found."
    };
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  var fileUrl = "null";
  // nao vou usar pq teria que tratar alguma forma de exclusao da imagem, e to sem tempo
  //var fileUrl = existeImg(rowToUpdate - 1)
  if(payload.imgEnunciado !="null"){
    var imgEnunciado = payload.imgEnunciado;
    // funcao salva no utils.js
    fileUrl = saveImgEnunciado(imgEnunciado.image, imgEnunciado.imageType, id)
  }

  // Atualiza os valores com os novos dados do payload
  const columns = [
    "enunciado", "dificuldade", "exercicio", "max_wrong_lines",
    "unittests", "toggleTypeHandlers", "vartests", "trinketHTML",
    "area", "pythonTutor", "imgEnunciado","tags"
  ];

  columns.forEach((col, index) => {
    if (payload[col] !== undefined) {
      if(col == "imgEnunciado"){
        sheet.getRange(rowToUpdate, index + 2).setValue(fileUrl)
      }
      else{
      sheet.getRange(rowToUpdate, index + 2).setValue(payload[col]);
      }
    }
  });

  const res = {
    status: "success",
    message: "Exercise updated successfully."
  };
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function deleteExercicio(payload) {
  const sheet = spreadsheet.getSheetByName("exercicios");
  const data = sheet.getDataRange().getValues(); // Obtém todos os dados da tabela
  const id = payload.id; // ID do exercício a ser removido

  // Procura o exercício pelo ID na primeira coluna
  let rowToDelete = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      rowToDelete = i + 1; // Adiciona 1 para considerar a contagem da planilha (base 1)
      break;
    }
  }

  if (rowToDelete === -1) {
    const res = {
      status: "failed",
      message: "Exercise with specified ID not found."
    };
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }
  deleteImg(id)

  // Remove a linha correspondente ao exercício
  sheet.deleteRow(rowToDelete);

  const res = {
    status: "success",
    message: "Exercise deleted successfully."
  };
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function deleteExercicioAndHistory(payload) {
  const exerciseSheet = spreadsheet.getSheetByName("exercicios");
  const historySheet = spreadsheet.getSheetByName("historico");
  
  if (!exerciseSheet || !historySheet) {
    const res = {
      status: "failed",
      message: "Planilha de exercícios ou histórico não encontrada."
    };
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  const exerciseData = exerciseSheet.getDataRange().getValues();
  const exerciseId = payload.id;

  // Localiza a linha do exercício a ser excluído
  let exerciseRowToDelete = -1;
  for (let i = 1; i < exerciseData.length; i++) {
    if (exerciseData[i][0] == exerciseId) {
      exerciseRowToDelete = i + 1; // Índice base 1
      break;
    }
  }

  if (exerciseRowToDelete === -1) {
    const res = {
      status: "failed",
      message: "Exercise with specified ID not found."
    };
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  // Exclui o exercício
  exerciseSheet.deleteRow(exerciseRowToDelete);

  // Remove os registros do histórico relacionados ao exercício
  const historyData = historySheet.getDataRange().getValues();
  let rowsDeleted = 0;

  for (let i = historyData.length - 1; i >= 1; i--) { // De baixo para cima
    if (historyData[i][5] == exerciseId) { // Coluna 6 (index 5) é exerciseId
      historySheet.deleteRow(i + 1); // Índice base 1
      rowsDeleted++;
    }
  }

  const res = {
    status: "success",
    message: `Exercise and related history deleted successfully. ${rowsDeleted} history record(s) removed.`
  };
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}


function testUpdateExercicio() {
  const testPayload = {
    id: 54, // ID de um exercício existente
    enunciado: "Novo enunciado atualizado",
    dificuldade: 3,
    tags: "tag1, tag2, tag3" // Atualizando apenas alguns campos
  };

  const response = updateExercicio(testPayload);
  const result = JSON.parse(response.getContent());

  if (result.status === "success") {
    Logger.log("Teste de updateExercicio: SUCESSO");
  } else {
    Logger.log("Teste de updateExercicio: FALHA - " + result.message);
  }

  // Opcional: Verificar se os dados foram realmente atualizados na planilha
  const sheet = spreadsheet.getSheetByName("exercicios");
  const data = sheet.getDataRange().getValues();
  const updatedRow = data.find(row => row[0] == testPayload.id);

  if (updatedRow) {
    Logger.log("Dados atualizados: " + JSON.stringify(updatedRow));
  } else {
    Logger.log("Linha não encontrada após a atualização.");
  }
}

function testDeleteExercicio() {
  const testPayload = {
    id: 53 // ID de um exercício existente que será removido
  };

  const response = deleteExercicio(testPayload);
  const result = JSON.parse(response.getContent());

  if (result.status === "success") {
    Logger.log("Teste de deleteExercicio: SUCESSO");
  } else {
    Logger.log("Teste de deleteExercicio: FALHA - " + result.message);
  }

  // Opcional: Verificar se a linha foi realmente removida na planilha
  const sheet = spreadsheet.getSheetByName("exercicios");
  const data = sheet.getDataRange().getValues();
  const deletedRow = data.find(row => row[0] == testPayload.id);

  if (!deletedRow) {
    Logger.log("Linha removida com sucesso.");
  } else {
    Logger.log("Linha ainda presente na planilha após exclusão.");
  }
}


///////////////////////////

// GET HISTORICO

function getHistorico(param) {
  const authentication = JSON.parse(param.authentication);

  if (!(userAuth(authentication))) {
    const res = {
      status:"failed",
      "message": "User was not authenticated or not found. Aborting."
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  const email = authentication.email;

  const user = getUserByEmail(email);

  const userHistory = getUserHistory(user.id);

  const userLevel = getUserLevelInfo(user.id);

  const res = {
      status:"success",
      "userHistory": userHistory,
      "userLevelInfo": userLevel
    }

  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

// POST HISTORICO

function postHistorico(payload, auth) {
  // 1. Autenticar o usuário
  // 2. Resgatar o Enum do histórico
  //   2.1. Se não tiver nenhum registro desse usuário no histórico -> Enum = 0
  //   2.2. Se tiver -> Pega o último registro salvo deste usuário, Enum + 1
  //   (para ver autoincremento, verificar o gerador de ID de usuário)
  // 2. Postar os dados do usuário na tabela de histórico
  /////////////////
  // 3. Editar o progresso do usuário na tabela user com base no exercício feito
  //   3.1. Recuperar o progresso já salvo e incrementar

  if (!(userAuth(auth))) {
    const res = {
      status:"failed",
      "message": "User was not authenticated or not found. Aborting."
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  if (!(checkPostParameters("historico",payload))) {
    const res = {
      status:"failed",
      "message": "Action requested is missing parameters or at least one of variables type doesn't match."
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  var lastUserData = getLastUserDataInHistory(payload.userId);
  const exerciseEnum = (lastUserData == null) ? 0 : (lastUserData.exerciseEnum + 1);

  const lastRow = spreadsheet.getSheetByName("historico").getDataRange().getLastRow();
  var newRowId = (spreadsheet.getSheetByName("historico").getRange(lastRow,1).getValue() + 1);
  if (typeof(newRowId) == 'string') {
    if (!newRowId.isNum()) {
      newRowId = '0';
    }
  }

  spreadsheet.getSheetByName("historico").appendRow(
    [
      newRowId,
      payload.userId,
      payload.startDate,
      payload.submitDate,
      payload.state,
      payload.exerciseId,
      payload.triesCount,
      exerciseEnum,
      payload.exerciseDifficulty
    ]
  );

  const lvlInfo = atualizaProgressoUsuario(payload.userId);

  response = {
    exerciseInfo: {
      "userId": payload.userId,
      "startDate": payload.startDate,
      "submitDate": payload.submitDate,
      "state": payload.state,
      "triesCount": payload.triesCount,
      "exerciseEnum": exerciseEnum,
      "exerciseDifficulty": payload.exerciseDifficulty
    },
    userLevelInfo: {
      currentLevel: lvlInfo.currentLevel,
      levelProgress: lvlInfo.levelProgress,
      nextLevel: lvlInfo.nextLevel
    }
  }

  const res = {
    status:"success",
    "message":"Exercise saved in user history.",
    "data": response
  }
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);

  // Para editar o progresso do usuário, verificar esse tutorial aqui: https://nightwolf.dev/create-your-own-apis-with-google-sheets-and-google-apps-script-part-5/
}


function atualizaProgressoUsuario(userId) {
  let editRow = findRowById(userId, 'users');

  // quantidade de exercícios
  editRow.data[6] = editRow.data[6] + 1;

  if (editRow.data[6] >= 11) {
    const level = updateUserLevel(editRow.data[5]);
    editRow.data[5] = level.currentLevel;
    editRow.data[6] = 1;
    editRow.data[7] = level.nextLevel;  
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
  sheet.getRange(editRow.rowNum, 1, 1, editRow.data.length).setValues([
    [
      editRow.data[0],
      editRow.data[1],
      editRow.data[2],
      editRow.data[3],
      editRow.data[4],
      editRow.data[5],
      editRow.data[6],
      editRow.data[7]
    ]
  ]);

  return {
    currentLevel: editRow.data[5],
    levelProgress: editRow.data[6],
    nextLevel:editRow.data[7]
  };
}

///////////////////////////

// USUARIO

function postCadastroDeUsuario (payload) {
  if (!payload.email_verified) {
    const res = {
      status:"failed",
      "message": "Email is not verified by Google. Aborting."
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  if (!(checkPostParameters("users",payload))) {
    const res = {
      status:"failed",
      "message": "Action requested is missing parameters or at least one of variables type doesn't match."
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  var dadosUsuario = procuraUsuarioCadastrado(payload);
  // Se usuário existe
  if (dadosUsuario != null) {
    const res = {
      status:"success",
      "message":"Logged in",
      "data": dadosUsuario,
      "url":"./parsonsProblemsPage.html" // REDIRECT URL 
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);

  // Se não existe, vai cadastrar
  } else { 
    const lastRow = spreadsheet.getSheetByName("users").getDataRange().getLastRow();
    var newRowId = (spreadsheet.getSheetByName("users").getRange(lastRow,1).getValue() + 1);
    if (typeof(newRowId) == 'string') {
      if (!newRowId.isNum()) {
        newRowId = '0';
      }
    }

    spreadsheet.getSheetByName("users").appendRow(
      [
        newRowId,
        payload.email,
        payload.sub,
        payload.name,
        payload.pic,
        0,
        0,
        1
      ]
    );

    dadosUsuario = {
      "id":newRowId,
      "email":payload.email,
      "sub":payload.sub,
      "name":payload.name,
      "pic":payload.pic,
      "userLevel":0,
      "levelProgress":1,
      "nextUserLevel":1
    }

    const res = {
      status:"success",
      "message":"User is now registered.",
      "data": dadosUsuario,
      "url":"./parsonsProblemsPage.html" // REDIRECT URL 
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }
}

