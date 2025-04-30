document.getElementById('compareButton').addEventListener('click', compareFiles);

// Referências para os elementos de mensagem e resultados
const messageArea = document.getElementById('messageArea');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const resultsDiv = document.getElementById('results');
// Mantenha estes como referências aos PRE tags
const extraContent1 = document.getElementById('extraContent1');
const extraContent2 = document.getElementById('extraContent2');
const noDifferencesDiv = document.getElementById('noDifferences');
const extraInFile1Div = document.getElementById('extraInFile1');
const extraInFile2Div = document.getElementById('extraInFile2');


async function compareFiles() {
    const fileInput1 = document.getElementById('file1');
    const fileInput2 = document.getElementById('file2');

    const file1 = fileInput1.files[0];
    const file2 = fileInput2.files[0];

    // --- Limpa e oculta seções anteriores ---
    hideAllMessages();
    hideResults();

    if (!file1 || !file2) {
        showErrorMessage('Por favor, selecione ambos os arquivos.');
        return;
    }

    showLoadingMessage('Lendo e comparando arquivos...');


    try {
        // Lê os dados de ambos os arquivos
        const data1 = await readSpreadsheet(file1);
        const data2 = await readSpreadsheet(file2);

        if (!data1 || !data2) {
             showErrorMessage('Erro ao ler um ou ambos os arquivos.');
             return;
        }
         if (data1.length <= 1 && data2.length <= 1) {
             showErrorMessage('Ambos os arquivos contêm apenas o cabeçalho ou estão vazios.');
             return;
         }
        if (data1.length <= 1) {
            showErrorMessage('A Planilha 1 contém apenas o cabeçalho ou está vazia.');
            return;
        }
         if (data2.length <= 1) {
            showErrorMessage('A Planilha 2 contém apenas o cabeçalho ou está vazia.');
            return;
         }


        // --- Lógica de Comparação ---
        // Assumimos que a primeira linha é o cabeçalho e a excluímos da comparação
        const header1 = data1[0];
        const header2 = data2[0];
        const dataRows1 = data1.slice(1); // Dados sem cabeçalho
        const dataRows2 = data2.slice(1); // Dados sem cabeçalho

        // Cria Sets de strings de linha completa para comparação rápida
        const rows2Set = new Set(dataRows2.map(rowToString));
        const rows1Set = new Set(dataRows1.map(rowToString));

        // Encontra linhas em dataRows1 que não estão em dataRows2 (comparação de conteúdo total)
        const extraIn1 = dataRows1.filter(row => !rows2Set.has(rowToString(row)));

        // Encontra linhas em dataRows2 que não estão em dataRows1 (comparação de conteúdo total)
        const extraIn2 = dataRows2.filter(row => !rows1Set.has(rowToString(row)));

        // Cria Sets APENAS das matrículas (primeira coluna) de cada arquivo
        // Filtra matrículas vazias ou nulas e garante que são strings
        const matriculas1Set = new Set(
            dataRows1
                .map(row => (row && row.length > 0) ? String(row[0] === null || row[0] === undefined ? '' : row[0]).trim() : '')
                .filter(matricula => matricula !== '')
        );
        const matriculas2Set = new Set(
            dataRows2
                .map(row => (row && row.length > 0) ? String(row[0] === null || row[0] === undefined ? '' : row[0]).trim() : '')
                 .filter(matricula => matricula !== '')
        );


        // --- Exibe os Resultados ---
        hideAllMessages();
        showResults();


        if (extraIn1.length === 0 && extraIn2.length === 0) {
            showNoDifferencesMessage('Nenhuma diferença encontrada entre as planilhas (ignorando o cabeçalho e comparando o conteúdo total das linhas).');
            extraInFile1Div.style.display = 'none';
            extraInFile2Div.style.display = 'none';

        } else {
             noDifferencesDiv.classList.add('d-none');

            if (extraIn1.length > 0) {
                 // Passa o Set de matrículas do OUTRO arquivo (Planilha 2) para formatResults
                 extraContent1.innerHTML = formatResults(header1, extraIn1, matriculas2Set);
                 extraInFile1Div.style.display = 'block';
            } else {
                 extraContent1.textContent = 'Nenhuma linha extra encontrada na Planilha 1 (em relação à Planilha 2).';
                 extraInFile1Div.style.display = 'block';
            }

             if (extraIn2.length > 0) {
                 // Passa o Set de matrículas do OUTRO arquivo (Planilha 1) para formatResults
                 extraContent2.innerHTML = formatResults(header2, extraIn2, matriculas1Set);
                 extraInFile2Div.style.display = 'block';
             } else {
                extraContent2.textContent = 'Nenhuma linha extra encontrada na Planilha 2 (em relação à Planilha 1).';
                 extraInFile2Div.style.display = 'block';
             }
        }


    } catch (error) {
        hideAllMessages();
        showErrorMessage(`Erro durante o processamento: ${error.message}`);
        console.error('Erro:', error);
    }
}

// Função para ler o arquivo (CSV ou XLSX) usando SheetJS
// ... (mantida igual) ...
async function readSpreadsheet(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Assume o primeiro sheet
                const firstSheetName = workbook.SheetNames[0];
                 if (!firstSheetName) {
                     resolve([]); // Resolve com array vazio se não houver sheets
                     return;
                 }
                const worksheet = workbook.Sheets[firstSheetName];

                 if (!worksheet) {
                     // Resolve com array contendo apenas um cabeçalho vazio se o sheet existir mas estiver vazio
                     // Isso evita erro ao tentar acessar data[0] ou data.slice(1) depois
                      resolve([[]]);
                      return;
                 }

                // Converte o sheet para um array de arrays
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                 // Se jsonData estiver vazio mas worksheet tiver dados (ex: apenas células vazias),
                 // garante que ao menos um array vazio seja retornado para representar uma linha,
                 // ou um cabeçalho vazio se sheet_to_json retornar [] para um sheet com dados.
                 if (jsonData.length === 0 && worksheet['!ref']) {
                     // Tenta obter o range do sheet. Se existir, considera que há pelo menos o cabeçalho ou dados vazios.
                     // Retorna array com array vazio para evitar erros posteriores.
                      resolve([[]]); // Representa pelo menos uma linha vazia ou cabeçalho vazio
                 } else {
                    resolve(jsonData);
                 }

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}


// Função helper para converter uma linha (array de valores) em uma string única para comparação
// ... (mantida igual) ...
function rowToString(row) {
    if (!Array.isArray(row)) {
        console.warn('rowToString received non-array data:', row);
        return '';
    }
    // Garante que todos os elementos são stringificados, mesmo se for um array vazio [].
    return row.map(cell => JSON.stringify(cell)).join('|__|');
}

// Função helper para formatar os resultados para exibição
// Modificada para receber o set de matrículas do outro arquivo para decidir o destaque
function formatResults(header, rows, otherFileMatriculasSet) {
    let output = '';
    if (header && header.length > 0) {
        // Formata e adiciona o cabeçalho
        // Garante que a formatação do cabeçalho não quebre se for nulo ou indefinido
        output += header.map(cell => cell === null || cell === undefined ? '' : String(cell)).join(' | ') + '\n---\n';
    }

     if (rows.length === 0) {
         output += "Nenhuma linha encontrada.";
     } else {
         rows.forEach(row => {
              if (Array.isArray(row)) {
                  // Assume que a matrícula está na primeira coluna (índice 0)
                  const matricula = (row && row.length > 0) ? row[0] : ''; // Pega a matricula com segurança
                  // Converte a matrícula para string e remove espaços em branco
                  const matriculaString = String(matricula === null || matricula === undefined ? '' : matricula).trim();

                  // Formata a linha para exibição
                  const formattedRow = row.map(cell => cell === null || cell === undefined ? '' : String(cell)).join(' | ');

                  // --- Lógica de Destaque (Vermelho) ---
                  // Destaca se a matrícula NÃO existir no Set de matrículas do OUTRO arquivo
                  const shouldHighlight = matriculaString !== '' && !otherFileMatriculasSet.has(matriculaString);


                  if (shouldHighlight) {
                      output += `<span style="color: red; font-weight: bold;">${formattedRow}</span>\n`;
                  } else {
                      output += formattedRow + '\n';
                  }
              } else {
                  // Trata caso a "linha" não seja um array
                  output += String(row) + '\n';
              }
         });
     }
    return output;
}

// --- Funções para gerenciar a exibição de mensagens e resultados ---
// ... (mantidas iguais) ...

function hideAllMessages() {
    loadingMessage.classList.add('d-none');
    errorMessage.classList.add('d-none');
    loadingMessage.textContent = '';
    errorMessage.textContent = '';
}

function showLoadingMessage(message) {
    hideAllMessages();
    loadingMessage.textContent = message;
    loadingMessage.classList.remove('d-none');
}

function showErrorMessage(message) {
    hideAllMessages();
    errorMessage.textContent = message;
    errorMessage.classList.remove('d-none');
}

function showNoDifferencesMessage(message) {
    hideAllMessages();
    noDifferencesDiv.textContent = message;
    noDifferencesDiv.classList.remove('d-none');
}


function hideResults() {
    resultsDiv.style.display = 'none';
    extraContent1.innerHTML = '';
    extraContent2.innerHTML = '';
    noDifferencesDiv.classList.add('d-none');
    extraInFile1Div.style.display = 'none';
    extraInFile2Div.style.display = 'none';
}

function showResults() {
    resultsDiv.style.display = 'block';
}