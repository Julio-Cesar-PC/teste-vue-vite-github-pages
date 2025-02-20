//////////////////////
// Utils

// Para formato tabelado, tal qual é armazenado no Sheets

/* 
 * buildJSON(dataToParse) Transforma uma tabela em formato JSON, considerando a primeira linha como nome das colunas
 * @params dataToParse - Values of SpreadsheetApp.openById(spreadsheetID).getSheetByName(sheetName).getDataRange().getValues()
 * @returns Object[] - Array of JSON objects.
*/
function buildJSON(dataToParse) {
  var objArray = []
  var obj = {}

  const firstLine = dataToParse[0]
  for (var i=1; i<dataToParse.length; i++) {
    obj = {}
    for(var j=0; j<firstLine.length; j++) {
      obj[firstLine[j]] = dataToParse[i][j];
    }
    objArray.push(obj)
  }
  return objArray
}

/* 
 * dataToJSON(dataToParse) Transforma uma célula com JSON em string em JSON de fato
 * @params dataToParse - Values of SpreadsheetApp.openById(spreadsheetID).getSheetByName(sheetName).getDataRange().getValues()
 * @returns Object[] - Array of JSON objects.
*/ 
function dataToJSON(dataToParse) {
  for(var i=0; i < dataToParse.length; i++){ 
    dataToParse[i] = JSON.parse(dataToParse[i]);
  }
  return dataToParse
}

/* 
 * isNum() => Adiciona uma nova função à classe String para verificar se a string contém apenas digitos.
 * @returns true or false.
*/ 
String.prototype.isNum = function () {
  return /^\d+$/.test(this);
}


function getUserById(id) {
  const data = spreadsheet.getSheetByName("users").getDataRange().getValues();
  const dataJSON = buildJSON(data);
  const dataJSONFiltered = dataJSON.filter((obj) => (obj.id == id));

  if (dataJSONFiltered.length != 0) {
    return dataJSONFiltered[0];
  } else {
    return null;
  }
}

function getUserByEmail(email) {
  const data = spreadsheet.getSheetByName("users").getDataRange().getValues();
  const dataJSON = buildJSON(data);
  const dataJSONFiltered = dataJSON.filter((obj) => (obj.email == email));

  if (dataJSONFiltered.length != 0) {
    return dataJSONFiltered[0];
  } else {
    return null;
  }
}

///////////////
// Validação de usuário

// Verifica existência de usuário
function procuraUsuarioCadastrado(payload) {
  const data = spreadsheet.getSheetByName("users").getDataRange().getValues();
  const dataJSON = buildJSON(data);
  const dataJSONFiltered = dataJSON.filter((obj) => (obj.email == payload.email) && (obj.sub == payload.sub));

  if (dataJSONFiltered.length != 0) {
    return dataJSONFiltered[0];
  } else {
    return null;
  }
}

// Verifica se o e-mail é verificado pelo google e também se existe o usuário na base de dados
function userAuth(payload) {
  if (!(payload.email_verified) || procuraUsuarioCadastrado(payload) == null) {
    return false;
  } else {
    return true;
  }
}

///////////////
// Check Parameters

tableName = {
  "users": ["email","sub","name","pic"],
  "exercicios": ["enunciado","dificuldade","exercicio","max_wrong_lines","unittests","toggleTypeHandlers","trinketHTML","area","pythonTutor","imgEnunciado", "tags", "vartests"],
  "historico": ["userId","startDate","submitDate","state","exerciseId","triesCount","exerciseDifficulty"] 
  // Ainda em análise se submitDate será enviado do front ou definido pelo back após a request ser feita
  // exerciseEnum precisa ser contabilizado pelo back, o front não tem como saber qual é a contagem desse exercício para esse usuário
}


function checkPostParameters(tName, payload) {
  for (var i = 0; i < tableName[tName].length; i++) {
    const field = tableName[tName][i];
    
    if (!payload.hasOwnProperty(field)) {
      // esses campos podem chegar ausentes, porém devem ser preenchidos como "null"
      if (field === "vartests" || field==="unittests" || field==="toggleTypeHandlers") {
        payload[field] = "null"; 
      }
      else {
        return false; // Retorna false para qualquer outro campo ausente
      }
    }
  }
  return true;
}




const actions = {
  "getExercicioAleatorio":["dificuldade"]
}


function checkGetParameters(action, param) {
  for (var i=0; i < actions[action].length; i++) {
    if(!(param.hasOwnProperty(actions[action][i]))) {
      return false;
    }
  }
  return true;
}


function warningActionRequestInvalid() {
  const res = {
    "status":"error",
    "message":"Action requested is invalid."
  }
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function getAllUserDataInHistory(userId) {
  const data = spreadsheet.getSheetByName("historico").getDataRange().getValues();
  const dataJSON = buildJSON(data);
  const dataJSONFiltered = dataJSON.filter((obj) => (obj.userId == userId));

  if (dataJSONFiltered.length != 0) {
    return dataJSONFiltered;
  } else {
    return null;
  }
}

function getUserHistory(userId) {
  const data = spreadsheet.getSheetByName("exercicios").getDataRange().getValues();
  const dataJSON = buildJSON(data);

  const userHist = getAllUserDataInHistory(userId);

  var userHistWithExercises = []

  for (var i = 0; i < userHist.length; i++) {
    const dataJSONFiltered = dataJSON.filter((obj) => (obj.id == userHist[i].exerciseId));
    
    userHistWithExercises.push({
      'id': userHist[i].id,
      'userId':userHist[i].userId,
      'startDate':userHist[i].startDate,
      'submitDate':userHist[i].submitDate,
      'state':userHist[i].state,
      'exerciseId':userHist[i].exerciseId,
      'triesCount':userHist[i].triesCount,
      'exerciseEnum':userHist[i].exerciseEnum,
      'exerciseDifficulty':userHist[i].exerciseDifficulty,
      'exercise':dataJSONFiltered[0].exercicio,
      'enunciado':dataJSONFiltered[0].enunciado,
      'trinketHTML':dataJSONFiltered[0].trinketHTML
    })
  }

  return userHistWithExercises;
}

function getLastUserDataInHistory(userId) {
  const ultimoRegistro = getAllUserDataInHistory(userId);

  if (ultimoRegistro != null) {
    return ultimoRegistro.pop();
  } else {
    return null;
  }
}

function getAllUserCompletedExercisesIdInHistory(userId) {
  const data = getAllUserDataInHistory(userId);
  var res = [];

  if(data === null) {
    return null;
  }

  for (var i=0; i < data.length; i++) {
    res.push(data[i].exerciseId);
  }

  return res;
}


function findRowById(entryId, sheetName) {
  const rows = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName).getDataRange().getValues();
  let entry = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const id = row[0];
 
    if (entryId === id) {
      entry = {
        rowNum: i + 1,
        data: row
      };
      break;
    }
  }

  return entry;
}


function updateUserLevel(currentLevel) {
  const newLevel = (currentLevel+1);
  var newNextLevel = (currentLevel+2);
  
  // TODO TO DO
  // Não deixa o nível do usuário passar de 2,retirar esse if abaixo quando tiver mais exercícios no banco de exercícios
  /*
  if (newNextLevel >= 3) {
    newNextLevel = 2;
  }
  if (newLevel >= 2) {
    newLevel = 1;
  }
  */

  return {
    currentLevel: newLevel,
    nextLevel: newNextLevel
  }
}


function getUserLevelInfo(userId) {
  const info = getUserById(userId);

  return {
    currentLevel: info.userLevel,
    levelProgress: info.levelProgress,
    nextLevel: info.nextUserLevel
  };
}

function userAuthMissingWarning(requestType) {
  if (requestType === 'get') {
    const res = {
      status:"failed",
      "message":"'authentication' field is missing in the request. Aborting."
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  } else if (requestType === 'post') {
    const res = {
      status:"failed",
      "message":"'auth' field is missing in the request. Aborting."
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }
}

// funcao temporaria para corrigir erro de id de exercicio excluido e suas referencias no historico
function deleteRowAndUpdateIds(sheetName, rowToDelete) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var lastRow = sheet.getLastRow();
  
  // Deleta a linha desejada
  sheet.deleteRow(rowToDelete);
  
  // Ajusta os IDs para as linhas restantes
  for (var i = rowToDelete; i <= lastRow - 1; i++) {
    var currentId = sheet.getRange(i, 1).getValue(); // Supondo que a coluna de IDs seja a coluna 1
    sheet.getRange(i, 1).setValue(currentId - 1);
  }
}

function writeLog(message) {
  var fileName = 'log.txt'; // Nome do arquivo de log
  var folder = DriveApp.getRootFolder(); // Pega a pasta raiz do Google Drive
  var file;

  // Verifica se o arquivo já existe
  var files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    file = files.next(); // Se o arquivo já existir, abre ele
  } else {
    file = folder.createFile(fileName, ''); // Se não, cria um novo arquivo
  }

  // Lê o conteúdo atual do arquivo
  var currentContent = file.getBlob().getDataAsString();

  // Adiciona a nova mensagem ao conteúdo existente
  var logMessage = new Date() + " - " + message + "\n"; // Adiciona data e hora
  var updatedContent = currentContent + logMessage;

  // Atualiza o conteúdo do arquivo com a nova linha
  file.setContent(updatedContent);
}

function saveImgEnunciado(image, tipoImg, id){
  var fileUrl = "null";
  // Verifica se o arquivo foi recebido corretamente

  if (image != "null" && tipoImg != "null") {

    const base64Image = image;
    const imageType = tipoImg; // Tipo MIME da imagem

    // Decodifique a imagem Base64
    try {
      var imageBlob = Utilities.newBlob(
        Utilities.base64Decode(base64Image),
        imageType,
        'img' + id + '.jpg'
      );
    } catch (e) {
      writeLog('Erro ao decodificar a imagem: ' + e.message);
      return "null";
    }
    const imageSize = imageBlob.length;

    if (imageSize > 50 * 1024 * 1024) { // Limite de 50MB
      writeLog('Imagem muito grande para ser processada: ' + imageSize);
      return "null";
    }


    var folder;
    var folders = DriveApp.getFoldersByName("PythonParsonsPuzzles"); // Procura por pastas com o nome específico
    
    // Verifica se a pasta existe
    if (folders.hasNext()) {
      folder = folders.next(); // Obtém a pasta existente
    } 
    else {
      folder = DriveApp.createFolder("PythonParsonsPuzzles"); // Cria a pasta se ela não existir
    }

    var existingFiles = folder.getFilesByName('img' + id + '.jpg');
    if (existingFiles.hasNext()) {
      // Arquivo já existe, lida com isso
      var existingFile = existingFiles.next();
      // altera todo o conteudo do arquivo já existente
      existingFile.setTrashed(true)
    } 
    // Crie um novo arquivo
    const file = folder.createFile(imageBlob);
    file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    fileUrl = file.getUrl();
    return fileUrl;
  }
  return "null";
}

function existeImg(id){
  var folder;
  var folders = DriveApp.getFoldersByName("PythonParsonsPuzzles"); // Procura por pastas com o nome específico
  
  // Verifica se a pasta existe
  if (folders.hasNext()) {
    folder = folders.next(); // Obtém a pasta existente
  } 
  else {
    return "null";
  }
  var existingFiles = folder.getFilesByName('img' + id + '.jpg');
  if (existingFiles.hasNext()) {
    // Arquivo já existe, lida com isso
    var existingFile = existingFiles.next();
    return existingFile.getUrl(); // Atualize o URL do arquivo existente
  }
  else{
    return "null";
  }
}

function deleteImg(id) {
  const folderName = "PythonParsonsPuzzles";
  
  // Obter a pasta específica
  const folders = DriveApp.getFoldersByName(folderName);
  if (!folders.hasNext()) {
    writeLog('A pasta ' + folderName + ' não existe.');
    return; // Retorna falso se a pasta não existir
  }
  
  const folder = folders.next();
  const fileName = 'img' + id + '.jpg';
  
  // Procurar arquivos com o nome específico
  const files = folder.getFilesByName(fileName);
  if (!files.hasNext()) {
    writeLog('Arquivo com o nome ' + fileName + ' não encontrado.');
    return; // Retorna falso se o arquivo não for encontrado
  }
  
  // Deletar todos os arquivos correspondentes
  while (files.hasNext()) {
    const file = files.next();
    try {
      file.setTrashed(true); // Move o arquivo para a lixeira
      writeLog('Arquivo ' + fileName + ' movido para a lixeira.');
    } catch (e) {
      writeLog('Erro ao mover o arquivo ' + fileName + ' para a lixeira: ' + e.message);
      return; // Retorna falso se houver erro
    }
  }
}