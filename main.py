from bs4 import BeautifulSoup
import csv

# Carregar o HTML salvo localmente
with open('pagina.html', 'r', encoding='utf-8') as file:
    html = file.read()

# Analisar o HTML
soup = BeautifulSoup(html, 'html.parser')

# Encontrar a segunda tabela com a classe "participantes"
tables = soup.find_all('table', class_='participantes')
if len(tables) > 1:
    table = tables[1]

    # Inicializar uma lista para armazenar os dados dos alunos
    alunos = []

    # Iterar sobre as linhas da tabela
    for tr in table.find_all('tr'):
        # Inicializar um dicionário para armazenar os dados de cada aluno
        aluno1 = {}
        aluno2 = {}

        # Extrair o nome do aluno 1
        strong_tag = tr.find_all('strong')
        if len(strong_tag) > 0:
            aluno1['nome'] = strong_tag[0].get_text(strip=True)
        
        # Extrair o curso do aluno
        em_tags = tr.find_all('em')
        if len(em_tags) > 0:
            aluno1['curso'] = em_tags[0].get_text(strip=True)
        
        # Extrair a matrícula do aluno
        if len(em_tags) > 1:
            aluno1['matricula'] = em_tags[1].get_text(strip=True)
        
        # Extrair o usuário do aluno
        em_tags = tr.find_all('em')
        if len(em_tags) > 2:
            aluno1['usuario'] = em_tags[2].get_text(strip=True)
        
        # Extrair o e-mail do aluno
        em_tags = tr.find_all('em')
        if len(em_tags) > 3:
            aluno1['email'] = em_tags[3].get_text(strip=True)
        
        # Adicionar os dados do aluno à lista de alunos
        alunos.append(aluno1)

        # extrair aluno 2
        strong_tag = tr.find_all('strong')
        if len(strong_tag) > 1:
            aluno2['nome'] = strong_tag[1].get_text(strip=True)
        
        # Extrair o curso do aluno
        em_tags = tr.find_all('em')
        if len(em_tags) > 4:
            aluno2['curso'] = em_tags[4].get_text(strip=True)
        
        # Extrair a matrícula do aluno
        if len(em_tags) > 5:
            aluno2['matricula'] = em_tags[5].get_text(strip=True)
        
        # Extrair o usuário do aluno
        em_tags = tr.find_all('em')
        if len(em_tags) > 6:
            aluno2['usuario'] = em_tags[6].get_text(strip=True)
        
        # Extrair o e-mail do aluno
        em_tags = tr.find_all('em')
        if len(em_tags) > 7:
            aluno2['email'] = em_tags[7].get_text(strip=True)
        alunos.append(aluno2)

    # Salvar os dados dos alunos em um arquivo CSV
    with open('alunos.csv', 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['nome', 'curso', 'matricula', 'usuario', 'email']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for aluno in alunos:
            writer.writerow(aluno)

    print("Dados dos alunos salvos em 'alunos.csv' com sucesso!")
else:
    print("Não foi possível encontrar a segunda tabela com a classe 'participantes'.")
