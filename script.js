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
                const aluno1 = {};
                const aluno2 = {};
                const strongTags = row.querySelectorAll('strong');
                const emTags = row.querySelectorAll('em');

                if (strongTags.length > 0) aluno1['nome'] = strongTags[0].textContent.trim();
                if (emTags.length > 0) aluno1['curso'] = emTags[0].textContent.trim();
                if (emTags.length > 1) aluno1['matricula'] = emTags[1].textContent.trim();
                if (emTags.length > 2) aluno1['usuario'] = emTags[2].textContent.trim();
                if (emTags.length > 3) aluno1['email'] = emTags[3].textContent.trim();
                alunos.push(aluno1);

                if (strongTags.length > 1) aluno2['nome'] = strongTags[1].textContent.trim();
                if (emTags.length > 4) aluno2['curso'] = emTags[4].textContent.trim();
                if (emTags.length > 5) aluno2['matricula'] = emTags[5].textContent.trim();
                if (emTags.length > 6) aluno2['usuario'] = emTags[6].textContent.trim();
                if (emTags.length > 7) aluno2['email'] = emTags[7].textContent.trim();
                alunos.push(aluno2);
            });

            generateCSV(alunos);
        } else {
            alert("Não foi possível encontrar a segunda tabela com a classe 'participantes'.");
        }
    };

    reader.readAsText(file);
}

function generateCSV(data) {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = url;
    downloadLink.download = 'alunos.csv';
    downloadLink.style.display = 'block';
    downloadLink.textContent = 'Download CSV';
}