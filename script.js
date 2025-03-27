function processFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please upload a file first.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const html = event.target.result;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tables = doc.querySelectorAll('table.participantes');
        
        if (tables.length > 1) {
            const table = tables[1];
            const rows = table.querySelectorAll('tr');
            const alunos = [];

            rows.forEach(row => {
                const aluno1 = extractAlunoData(row, 0, 4);
                const aluno2 = extractAlunoData(row, 1, 4);
                alunos.push(aluno1, aluno2);
            });

            generateCSV(alunos);
        } else {
            alert("Não foi possível encontrar a segunda tabela com a classe 'participantes'.");
        }
    };

    reader.readAsText(file, 'UTF-8');
}

function extractAlunoData(row, strongIndex, emOffset) {
    const aluno = {};
    const strongTags = row.querySelectorAll('strong');
    const emTags = row.querySelectorAll('em');

    if (strongTags.length > strongIndex) aluno['nome'] = normalizeText(strongTags[strongIndex].textContent.trim());
    if (emTags.length > emOffset) aluno['curso'] = normalizeText(emTags[emOffset].textContent.trim());
    if (emTags.length > emOffset + 1) aluno['matricula'] = normalizeText(emTags[emOffset + 1].textContent.trim());
    if (emTags.length > emOffset + 2) aluno['usuario'] = normalizeText(emTags[emOffset + 2].textContent.trim());
    if (emTags.length > emOffset + 3) aluno['email'] = normalizeText(emTags[emOffset + 3].textContent.trim());

    return aluno;
}

function normalizeText(text) {
    return text.normalize('NFKD').replace(/[\u0300-\u036F]/g, "");
}

function generateCSV(data) {
    const csv = Papa.unparse(data, { quotes: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = url;
    downloadLink.download = 'alunos.csv';
    downloadLink.style.display = 'block';
    downloadLink.textContent = 'Download CSV';
}