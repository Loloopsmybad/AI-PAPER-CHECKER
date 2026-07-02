# AI Paper Checker

Evaluate student answer sheets automatically using OCR and AI. Upload a PDF (or paste a Google Drive link) and a rubrics file, and get detailed marks and feedback.

## How It Works

1. **PDF ingestion** — local file or Google Drive URL
2. **OCR** — pages converted to images, text extracted via Hugging Face Gemma-3-4b-it
3. **Evaluation** — OCR text scored against rubrics by an AI model
4. **Output** — marks, per-question feedback, and improvement suggestions

## Quick Start

### Backend

```bash
pip install -r requirements.txt
python app.py          # Flask server on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # Vite dev server with hot reload
```

### CLI (no server needed)

```bash
python main.py <pdf_path> <rubrics_path>
```

Results are saved to `~/Downloads/`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/evaluate` | Evaluate a PDF against rubrics (JSON body: `pdf_source`, `rubrics`, `subject`, `total_marks`) |
| POST | `/api/upload-pdf` | Upload a PDF file, returns temp path |

## Tech Stack

- **Backend:** Python, Flask, pdf2image, Pillow
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **OCR:** Hugging Face Inference API (Gemma-3-4b-it)
- **Evaluation:** OpenAI-compatible API (mimo-v2.5-free)

## Project Structure

```
├── app.py              # Flask API + static file server
├── main.py             # CLI entry point
├── requirements.txt    # Python dependencies
├── static/             # Fallback static files
├── frontend/           # React app
│   ├── src/
│   ├── dist/           # Production build output
│   └── package.json
└── AGENTS.md           # Agent instructions
```
