# MicrOSINT RTL Starter (React + Tailwind + Vite)

**RTL**, interactive sidebar and header with lucide-react icons.

## Run

```bash
npm install
npm run dev
```

## Notes

- Layout is Flexbox-first (no absolute positioning for structure).
- Tailwind classes use the default spacing scale; adjust as needed.
- Replace placeholder images and texts with your real assets.

## Translation Backend API

Set your Python translator to expose three endpoints and run on `http://127.0.0.1:8000`. The dev server proxies `/api/*` there (see `vite.config.ts`).

- `POST /api/translate/url`: JSON `{ url: string }` → JSON `{ source_text: string, translated_text: string }`
- `POST /api/translate/file`: `multipart/form-data` with field `file` → JSON `{ source_text: string, translated_text: string }`
- `POST /api/export-docx`: JSON `{ source_text: string, translated_text: string }` → returns `application/vnd.openxmlformats-officedocument.wordprocessingml.document` as a file download

Example FastAPI skeleton:

```py
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

app = FastAPI()

class URLIn(BaseModel):
    url: str

class ExportIn(BaseModel):
    source_text: str
    translated_text: str

@app.post("/api/translate/url")
async def translate_url(payload: URLIn):
    # TODO: fetch + detect language + extract text from payload.url
    # TODO: translate to Farsi
    return {"source_text": "...extracted...", "translated_text": "...translated..."}

@app.post("/api/translate/file")
async def translate_file(file: UploadFile = File(...)):
    # TODO: read file.file, detect language, extract text, translate
    return {"source_text": "...extracted...", "translated_text": "...translated..."}

@app.post("/api/export-docx")
async def export_docx(payload: ExportIn):
    # TODO: render docx with payload.source_text and payload.translated_text
    buf = io.BytesIO()
    # write DOCX bytes to buf
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=translation_report.docx"},
    )
```

Run:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
