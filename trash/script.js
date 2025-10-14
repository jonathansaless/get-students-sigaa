document.getElementById('csvForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const fileInput = document.getElementById('csvFile');
    const periodoLetivo = document.getElementById('periodoLetivo').value;
    const opcaoTurma = document.querySelector('input[name="opcaoTurma"]:checked').value;

    if (!periodoLetivo) {
        alert("Por favor, insira o período letivo.");
        return;
    }

    if (fileInput.files.length === 0) {
        alert("Por favor, selecione um arquivo CSV.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const text = e.target.result;
        processCSV(text, opcaoTurma, periodoLetivo);
    };

    reader.readAsText(file);
});

function processCSV(text, opcaoTurma, periodoLetivo) {
    const rows = Papa.parse(text, { header: true }).data;

    let turno;
    switch (opcaoTurma) {
        case "1":
        case "2":
            turno = "MANHÃ";
            break;
        case "3":
        case "4":
            turno = "TARDE";
            break;
        default:
            alert("Opção de turma inválida.");
            return;
    }

    const output = [];
    output.push(['Username', 'Password', 'Firstname', 'Lastname', 'Email', 'City', 'Course1', 'Group1', 'Type1', 'Group2', 'Type2']);

    rows.forEach(row => {
        const email = row['email'];
        const fullName = row['nome'];
        const names = fullName.split(' ');
        const firstname = names[0].toUpperCase();
        const lastname = names.slice(1).map(name => name.toUpperCase()).join(' ');
        const curso = row['curso'].split('/')[0].trim();
        const group1 = `${curso} - ${turno}`;
        const group2 = turno.charAt(0).toUpperCase() + turno.slice(1).toLowerCase();

        output.push([email, 'newton123', firstname, lastname, email, 'Belém', `Página inicial Cálculo - ${periodoLetivo}`, group1, '1', group2, '1']);
    });

    const result = Papa.unparse(output, { quotes: true });
    document.getElementById('result').textContent = result;

    const blob = new Blob([result], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = url;
    downloadLink.download = `result_${opcaoTurma}.csv`;
    downloadLink.style.display = 'block';
    downloadLink.textContent = 'Download CSV';
}