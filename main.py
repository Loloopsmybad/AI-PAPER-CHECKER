import os
import sys
import re
import tempfile
import urllib.request
import urllib.error
import base64
import json
from io import BytesIO
from openai import OpenAI
from pdf2image import convert_from_path
from PIL import Image
from huggingface_hub import InferenceClient

sys.stdout.reconfigure(encoding='utf-8')

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

    print(f"Downloading from Google Drive (ID: {file_id})...")
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

    print(f"Downloaded to: {tmp_path}")
    return tmp_path


def pdf_to_images(pdf_path, dpi=PDF_DPI):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    images = convert_from_path(pdf_path, dpi=dpi, poppler_path=r"C:\poppler\Library\bin")
    print(f"{len(images)} pages found")
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


def main(pdf_path, rubrics_path):
    if is_url(pdf_path):
        pdf_path = download_from_gdrive(pdf_path)

    images = pdf_to_images(pdf_path)
    ocr_text = ocr_images(images)
    ocr_output_path = pdf_path.replace(".pdf", "_ocr.txt")

    with open(ocr_output_path, "w", encoding="utf-8") as f:
        f.write(ocr_text)

    print(f"OCR text saved to: {ocr_output_path}")

    if not os.path.exists(rubrics_path):
        raise FileNotFoundError(f"Rubrics file not found: {rubrics_path}")
    with open(rubrics_path, "r", encoding="utf-8") as f:
        rubrics_content = f.read()
    print(f"Rubrics loaded from: {rubrics_path}")

    evaluation = evaluate_with_AI(ocr_text, subject=SUBJECT, total_marks=TOTAL_MARKS, rubrics=rubrics_content)

    print("\n" + "=" * 60)
    print("           AI EVALUATION RESULT")
    print("=" * 60)
    print(evaluation)

    downloads = os.path.join(os.path.expanduser("~"), "Downloads")
    result_path = os.path.join(downloads, "evaluation.txt")
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(evaluation)
    print(f"\nEvaluation saved to: {result_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print('Usage: python main.py <pdf_path> <rubrics_path>')
        sys.exit(1)

    pdf_file = sys.argv[1]
    rubrics_file = sys.argv[2]

    main(pdf_file, rubrics_file)
