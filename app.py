import os
import sys
import re
import tempfile
import urllib.request
import urllib.error
import base64
import json
from io import BytesIO
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
from pdf2image import convert_from_path
from PIL import Image
from huggingface_hub import InferenceClient

sys.stdout.reconfigure(encoding='utf-8')

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')
STATIC_DIR = FRONTEND_DIST if os.path.isdir(FRONTEND_DIST) else 'static'

app = Flask(__name__, static_folder=STATIC_DIR)
CORS(app)

HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL = "google/gemma-3-4b-it"
hf_client = InferenceClient(token=HF_API_KEY)
PDF_DPI = 300
SUBJECT = "General Knowledge"
TOTAL_MARKS = 100


def is_url(path):
    return path.startswith("http://") or path.startswith("https://")


def extract_gdrive_id(url):
    patterns = [
        r"https?://drive\.google\.com/file/d/([a-zA-Z0-9_-]+)",
        r"https?://drive\.google\.com/open\?id=([a-zA-Z0-9_-]+)",
        r"https?://drive\.google\.com/uc\?id=([a-zA-Z0-9_-]+)",
        r"https?://drive\.usercontent\.google\.com/download\?id=([a-zA-Z0-9_-]+)"
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def download_from_gdrive(url):
    file_id = extract_gdrive_id(url)
    if not file_id:
        raise ValueError(f"Not a valid Google Drive URL: {url}")

    download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
    tmp_path = os.path.join(tempfile.gettempdir(), f"gdrive_{file_id}.pdf")

    req = urllib.request.Request(download_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as response:
        data = response.read()

    if b"<html" in data[:1000].lower():
        confirm_match = re.search(rb'confirm=([0-9A-Za-z_-]+)', data)
        if confirm_match:
            confirm_url = f"{download_url}&confirm={confirm_match.decode()}"
            req = urllib.request.Request(confirm_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req) as response:
                data = response.read()
        else:
            raise ValueError("Google Drive download requires confirmation.")

    with open(tmp_path, "wb") as f:
        f.write(data)

    return tmp_path


def pdf_to_images(pdf_path, dpi=PDF_DPI):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    images = convert_from_path(pdf_path, dpi=dpi, poppler_path=r"C:\poppler\Library\bin")
    return images


def image_to_base64(img):
    img.thumbnail((1024, 1024))
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def ocr_images(images):
    full_text = []
    for i, img in enumerate(images, start=1):
        print(f"OCR on page {i}/{len(images)}...")
        img.thumbnail((1024, 1024))
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_bytes = buffered.getvalue()

        resp = hf_client.chat_completion(
            model=HF_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": "data:image/png;base64," + base64.b64encode(img_bytes).decode()}},
                    {"type": "text", "text": "Read all the text in this document image. Output the full text exactly as it appears, preserving structure and formatting."},
                ],
            }],
            max_tokens=4096,
        )

        text = resp.choices[0].message.content or ""
        full_text.append(f"--- Page {i} ---\n{text.strip()}")

    combined = "\n\n".join(full_text)
    print(f"Extracted {len(combined)} characters total.")
    return combined


def evaluate_with_AI(ocr_text, subject, total_marks, rubrics):
    client = OpenAI(
        base_url=os.getenv("OPENAI_BASE_URL", "https://opencode.ai/zen/v1"),
        api_key=os.getenv("OPENAI_API_KEY"),
    )

    system_prompt = (
        "You are an experienced teacher and examiner. "
        "You will be given the OCR-extracted text of a student's answer sheet. "
        "Your job is to:\n"
        "1. Identify each question and the student's answer.\n"
        "2. Evaluate each answer for correctness, completeness, and clarity.\n"
        "3. Assign marks to each answer with brief justification.\n"
        "4. Provide a total score and an overall comment on the student's performance.\n"
        "5. Point out any common mistakes or areas for improvement.\n\n"
        "Be fair, constructive, and encouraging in your feedback."
    )

    user_prompt = (
        f"Subject: {subject}\n"
        f"Total Marks: {total_marks}\n\n"
        f"Below is the OCR-extracted text from the student's answer sheet:\n\n"
        f"{'='*60}\n"
        f"{ocr_text}\n"
        f"{'='*60}\n\n"
        f"Rubrics for evaluation:\n"
        f"{'='*60}\n"
        f"{rubrics}\n"
        f"{'='*60}\n\n"
        f"Please evaluate the answers based on the above rubrics and provide detailed feedback with marks."
    )

    message = client.chat.completions.create(
        model="mimo-v2.5-free",
        max_tokens=2048,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
    )

    content = message.choices[0].message.content
    if not content:
        content = getattr(message.choices[0].message, 'reasoning', None) or ''
    return content


@app.route('/')
def landing():
    return send_from_directory(STATIC_DIR, 'index.html')


@app.route('/app')
def app_page():
    return send_from_directory(STATIC_DIR, 'index.html')


@app.route('/<path:path>')
def static_files(path):
    file_path = os.path.join(STATIC_DIR, path)
    if os.path.isfile(file_path):
        return send_from_directory(STATIC_DIR, path)
    return send_from_directory(STATIC_DIR, 'index.html')


@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    try:
        data = request.json
        pdf_source = data.get('pdf_source', '')
        rubrics = data.get('rubrics', '')
        subject = data.get('subject', SUBJECT)
        total_marks = int(data.get('total_marks', TOTAL_MARKS))

        if not pdf_source:
            return jsonify({'error': 'PDF source is required'}), 400
        if not rubrics:
            return jsonify({'error': 'Rubrics are required'}), 400

        if is_url(pdf_source):
            pdf_path = download_from_gdrive(pdf_source)
        else:
            pdf_path = pdf_source

        images = pdf_to_images(pdf_path)
        ocr_text = ocr_images(images)

        evaluation = evaluate_with_AI(ocr_text, subject, total_marks, rubrics)

        downloads = os.path.join(os.path.expanduser("~"), "Downloads")
        os.makedirs(downloads, exist_ok=True)
        with open(os.path.join(downloads, "ocr_text.txt"), "w", encoding="utf-8") as f:
            f.write(ocr_text)
        with open(os.path.join(downloads, "evaluation.txt"), "w", encoding="utf-8") as f:
            f.write(evaluation)
        print(f"Saved to {downloads}")

        return jsonify({
            'success': True,
            'ocr_text': ocr_text,
            'evaluation': evaluation
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    try:
        if 'pdf' not in request.files:
            return jsonify({'error': 'No PDF file provided'}), 400

        file = request.files['pdf']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        tmp_dir = tempfile.gettempdir()
        pdf_path = os.path.join(tmp_dir, file.filename)
        file.save(pdf_path)

        return jsonify({'success': True, 'pdf_path': pdf_path})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
