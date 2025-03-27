from flask import Flask, request, render_template, redirect, url_for, send_file
from bs4 import BeautifulSoup
import csv
import os
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    logging.info("Index page accessed")
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        logging.info("Upload endpoint accessed")
        if 'file' not in request.files:
            logging.error("No file part in the request")
            return "No file part in the request", 400
        file = request.files['file']
        if file.filename == '':
            logging.error("No selected file")
            return "No selected file", 400
        if file:
            file_path = os.path.join('static', file.filename)
            file.save(file_path)
            logging.info(f"File saved to {file_path}")
            csv_path = process_html(file_path)
            return send_file(csv_path, as_attachment=True)
    except Exception as e:
        logging.error(f"Error during file upload: {e}")
        return "An error occurred during file upload.", 500

def process_html(file_path):
    try:
        logging.info(f"Processing HTML file: {file_path}")
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
            logging.info("Dados dos alunos salvos em 'static/alunos.csv' com sucesso!")
            return csv_path
        else:
            logging.error("Não foi possível encontrar a segunda tabela com a classe 'participantes'.")
            raise ValueError("Tabela não encontrada.")
    except Exception as e:
        logging.error(f"Error during HTML processing: {e}")
        raise e

if __name__ == '__main__':
    app.run(debug=True)