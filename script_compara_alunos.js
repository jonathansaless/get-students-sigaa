document.getElementById('compareButton').addEventListener('click', compareFiles);

// Referências para os elementos de mensagem e resultados
const messageArea = document.getElementById('messageArea');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage'); // Novo para mensagens de erro
const resultsDiv = document.getElementById('results');
const extraContent1 = document.getElementById('extraContent1');
const extraContent2 = document.getElementById('extraContent2');
const noDifferencesDiv = document.getElementById('noDifferences');
const extraInFile1Div = document.getElementById('extraInFile1'); // Referência para a div da seção
const extraInFile2Div = document.getElementById('extraInFile2'); // Referência para a div da seção


async function compareFiles() {
    const fileInput1 = document.getElementById('file1');
    const fileInput2 = document.getElementById('file2');

    const file1 = fileInput1.files[0];
    const file2 = fileInput2.files[0];

    // --- Limpa e oculta seções anteriores ---
    hideAllMessages(); // Oculta todas as mensagens (carregamento, erro)
    hideResults(); // Oculta a área de resultados completa

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
         if (data1.length <= 1 || data2.length <= 1) { // Verifica se há pelo menos cabeçalho + 1 linha de dados
             showErrorMessage('Um ou ambos os arquivos estão vazios ou contêm apenas cabeçalho.');
             return;
         }


        // --- Lógica de Comparação ---
        // Assumimos que a primeira linha é o cabeçalho e a excluímos da comparação
        const header1 = data1[0];
        const header2 = data2[0];
        const dataRows1 = data1.slice(1); // Dados sem cabeçalho
        const dataRows2 = data2.slice(1); // Dados sem cabeçalho

        // Converte as linhas de dataRows2 em um Set para busca rápida
        const rows2Set = new Set(dataRows2.map(rowToString));

        // Encontra linhas em dataRows1 que não estão em dataRows2
        const extraIn1 = dataRows1.filter(row => !rows2Set.has(rowToString(row)));

        // Converte as linhas de dataRows1 em um Set para busca rápida
        const rows1Set = new Set(dataRows1.map(rowToString));

        // Encontra linhas em dataRows2 que não estão em dataRows1
        const extraIn2 = dataRows2.filter(row => !rows1Set.has(rowToString(row)));

        // --- Exibe os Resultados ---
        hideAllMessages(); // Oculta a mensagem de carregamento
        showResults(); // Mostra a área de resultados completa


        if (extraIn1.length === 0 && extraIn2.length === 0) {
            showNoDifferencesMessage('Nenhuma diferença encontrada entre as planilhas (ignorando o cabeçalho).');
            // Oculta as seções de linhas extras
            extraInFile1Div.style.display = 'none';
            extraInFile2Div.style.display = 'none';

        } else {
             // Oculta a mensagem de ausência de diferenças
             noDifferencesDiv.classList.add('d-none');

            if (extraIn1.length > 0) {
                 extraContent1.textContent = formatResults(header1, extraIn1);
                 extraInFile1Div.style.display = 'block'; // Mostra a seção
            } else {
                 extraContent1.textContent = 'Nenhuma linha extra encontrada na Planilha 1 (em relação à Planilha 2).';
                 extraInFile1Div.style.display = 'block'; // Ainda mostra a seção para a mensagem de "nenhuma linha"
            }

             if (extraIn2.length > 0) {
                 extraContent2.textContent = formatResults(header2, extraIn2);
                 extraInFile2Div.style.display = 'block'; // Mostra a seção
             } else {
                extraContent2.textContent = 'Nenhuma linha extra encontrada na Planilha 2 (em relação à Planilha 1).';
                 extraInFile2Div.style.display = 'block'; // Ainda mostra a seção para a mensagem de "nenhuma linha"
             }
        }


    } catch (error) {
        hideAllMessages();
        showErrorMessage(`Erro durante o processamento: ${error.message}`);
        console.error('Erro:', error);
    }
}

// Função para ler o arquivo (CSV ou XLSX) usando SheetJS
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
                     resolve([]); // Resolve com array vazio se o sheet estiver vazio
                     return;
                 }

                // Converte o sheet para um array de arrays (ignorando formatação rica, etc.)
                // header: 1 -> trata a primeira linha como dados, não chaves de objeto
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        // Lê o arquivo como ArrayBuffer, necessário para o SheetJS ler corretamente CSV/XLSX
        reader.readAsArrayBuffer(file);
    });
}

// Função helper para converter uma linha (array de valores) em uma string única para comparação
function rowToString(row) {
     // Garante que a linha é um array antes de tentar mapear
    if (!Array.isArray(row)) {
        console.warn('rowToString received non-array data:', row);
        return ''; // Retorna string vazia ou handle de erro apropriado
    }
    // Usa JSON.stringify para lidar com diferentes tipos de dados e valores vazios,
    // e um separador improvável de aparecer nos dados.
    // Adicionado `.filter(cell => cell !== null && cell !== undefined)` para remover células vazias antes de stringificar,
    // o que pode ajudar na comparação de linhas com células vazias no final.
    // Revertido: JSON.stringify(null/undefined) resulta em 'null'/'undefined', que é distinto. Manter todos os elementos é mais seguro.
    return row.map(cell => JSON.stringify(cell)).join('|__|');
}

// Função helper para formatar os resultados para exibição
function formatResults(header, rows) {
    let output = '';
    if (header && header.length > 0) { // Verifica se o cabeçalho existe e não está vazio
        // Exibe o cabeçalho primeiro, tratando null/undefined como string vazia
        output += header.map(cell => cell === null || cell === undefined ? '' : String(cell)).join(' | ') + '\n---\n';
    }
     if (rows.length === 0) {
         output += "Nenhuma linha encontrada.";
     } else {
         // Exibe as linhas extras, tratando null/undefined como string vazia
         rows.forEach(row => {
              if (Array.isArray(row)) { // Garante que é um array antes de mapear
                  output += row.map(cell => cell === null || cell === undefined ? '' : String(cell)).join(' | ') + '\n';
              } else {
                  output += String(row) + '\n'; // Trata caso a "linha" não seja um array
              }
         });
     }
    return output;
}

// --- Funções para gerenciar a exibição de mensagens e resultados ---

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
    extraContent1.textContent = '';
    extraContent2.textContent = '';
    noDifferencesDiv.classList.add('d-none'); // Esconde a mensagem de "nenhuma diferença"
    extraInFile1Div.style.display = 'none'; // Esconde a seção de resultados 1
    extraInFile2Div.style.display = 'none'; // Esconde a seção de resultados 2
}

function showResults() {
    resultsDiv.style.display = 'block';
}