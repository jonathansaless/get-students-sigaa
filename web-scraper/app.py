from flask import Flask, request, render_template, redirect, url_for
from bs4 import BeautifulSoup
import csv
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    if file:
        file_path = os.path.join('static', file.filename)
        file.save(file_path)
        process_html(file_path)
        return redirect(url_for('download_file'))

def process_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        html = file.read()

    soup = BeautifulSoup(html, 'html.parser')
    tables = soup.find_all('table', class_='participantes')
    if len(tables) > 1:
        table = tables[1]
        alunos = []
        for tr in table.find_all('tr'):
            aluno1 = {}
            aluno2 = {}
            strong_tag = tr.find_all('strong')
            if len(strong_tag) > 0:
                aluno1['nome'] = strong_tag[0].get_text(strip=True)
            em_tags = tr.find_all('em')
            if len(em_tags) > 0:
                aluno1['curso'] = em_tags[0].get_text(strip=True)
            if len(em_tags) > 1:
                aluno1['matricula'] = em_tags[1].get_text(strip=True)
            if len(em_tags) > 2:
                aluno1['usuario'] = em_tags[2].get_text(strip=True)
            if len(em_tags) > 3:
                aluno1['email'] = em_tags[3].get_text(strip=True)
            alunos.append(aluno1)
            if len(strong_tag) > 1:
                aluno2['nome'] = strong_tag[1].get_text(strip=True)
            if len(em_tags) > 4:
                aluno2['curso'] = em_tags[4].get_text(strip=True)
            if len(em_tags) > 5:
                aluno2['matricula'] = em_tags[5].get_text(strip=True)
            if len(em_tags) > 6:
                aluno2['usuario'] = em_tags[6].get_text(strip=True)
            if len(em_tags) > 7:
                aluno2['email'] = em_tags[7].get_text(strip=True)
            alunos.append(aluno2)
        csv_path = 'static/alunos.csv'
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['nome', 'curso', 'matricula', 'usuario', 'email']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for aluno in alunos:
                writer.writerow(aluno)
        print("Dados dos alunos salvos em 'static/alunos.csv' com sucesso!")

@app.route('/download')
def download_file():
    return render_template('upload.html')

if __name__ == '__main__':
    app.run(debug=True)