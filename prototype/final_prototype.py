from flask import Flask, request, send_file, g
from flask_cors import CORS
import pdfplumber
from io import BytesIO
import os
from sentence_transformers import SentenceTransformer
import re
from pymilvus import MilvusClient 
import importlib

# Optional lightweight in-process vector store (FAISS) for local/dev use.
# Try absolute import first (works when running the script directly), then
# fall back to a relative import for package-based runs. If neither works we
# leave MilvusLite = None and will attempt a lazy import inside get_milvus().
MilvusLite = None
try:
	# when running as a script the package context may be absent, so absolute
	# import from the current working directory is preferred
	from milvus_lite import MilvusLite as _MilvusLite
	MilvusLite = _MilvusLite
except Exception:
	try:
		from .milvus_lite import MilvusLite as _MilvusLite
		MilvusLite = _MilvusLite
	except Exception:
		MilvusLite = None
from pathlib import Path
import uuid
from werkzeug.utils import secure_filename

embedder = SentenceTransformer("all-MiniLM-L6-v2")
app = Flask(__name__)
CORS(app)


PDF_STORAGE = Path(app.root_path).parent / "resume_holder"
PDF_STORAGE.mkdir(parents=True, exist_ok=True)
DB_PATH = os.path.abspath(os.environ.get("MILVUS_LITE_DB", "./milvus_demo.db"))
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
LINKEDIN_RE = re.compile(r"(https?://)?(www\.)?linkedin\.com/[^\s]+", re.IGNORECASE)
GITHUB_RE = re.compile(r"(https?://)?(www\.)?github\.com/[^\s]+", re.IGNORECASE)
SECTION_HEADERS = [
	r"experience", r"work experience", r"professional experience",
	r"projects?", r"academic projects?",
	r"education", r"qualifications?", r"academics?",
	r"skills?", r"technical skills?", r"programming skills?",
	r"certifications?", r"achievements?", r"awards?"
]
_PHONE_PATTERNS = [
	re.compile(r"(?<!\d)(?:\+?91[\s\-.]*)?(?:0[\s\-.]*)?(?:[6-9]\d{2}[\s\-.]?\d{3}[\s\-.]?\d{4}|[6-9]\d{9})(?!\d)"),
	re.compile(r"(?<!\d)(?:\+?1[\s\-.]*)?(?:\(\d{3}\)|\d{3})[\s\-.]?\d{3}[\s\-.]?\d{4}(?!\d)"),
	re.compile(r"(?<!\d)\+?\d(?:[\s\-.]?\d){6,15}(?!\d)"),
]


def get_milvus():
	# If MILVUS_LITE_DB is set, use the FAISS-backed MilvusLite in-process store
	lite_path = os.environ.get('MILVUS_LITE_DB')
	if lite_path:
		if "milvus" not in g:
			# lazy import in case faiss isn't installed
			if MilvusLite is None:
				try:
					module = importlib.import_module('milvus_lite')
					_MilvusLite = getattr(module, 'MilvusLite')
					g.milvus = _MilvusLite(lite_path, dimension=384)
				except Exception:
					# Re-raise so caller sees an import error with traceback
					raise
			else:
				g.milvus = MilvusLite(lite_path, dimension=384)
		return g.milvus

	# Fallback: use real pymilvus client (server-backed)
	if "milvus" not in g:
		g.milvus = MilvusClient(DB_PATH)
	return g.milvus

def ensure_collection(client):
	if not client.has_collection(collection_name="demo_collection"):
		client.create_collection(
			collection_name="demo_collection",
			dimension=384,
			vector_field_name="vector",
			metric_type="COSINE",
			auto_id=True,
			enable_dynamic_field=True,
		)
		
def _normalize_digits(s: str) -> str:
	return re.sub(r"\D", "", s)

def find_phone_numbers(text: str):
	hits = []
	seen = set()
	for pat in _PHONE_PATTERNS:
		for m in pat.finditer(text):
			norm = _normalize_digits(m.group(0))
			if 7 <= len(norm) <= 16 and norm not in seen:
				seen.add(norm)
				hits.append(norm)
	return hits

def redact_phone_numbers(text: str) -> str:
	def repl(m: re.Match) -> str:
		s = m.group(0)
		return re.sub(r"\d", "", s)
	redacted = text
	for pat in _PHONE_PATTERNS:
		redacted = pat.sub(repl, redacted)
	return redacted

def split_sections(text: str):
	sections = {}
	current_header = "other"
	sections[current_header] = []

	for line in text.splitlines():
		line_lower = line.strip().lower()
		if any(re.search(h, line_lower) for h in SECTION_HEADERS):
			current_header = line.strip()
			sections[current_header] = []
		else:
			sections[current_header].append(line.strip())
	
	return {h: " ".join(lines) for h, lines in sections.items()}

def extract_metadata(text: str):
	metadata = {}

	email_match = EMAIL_RE.search(text)
	linkedin_match = LINKEDIN_RE.search(text)
	github_match = GITHUB_RE.search(text)
	phones = find_phone_numbers(text)

	if email_match:
		metadata["email"] = email_match.group()
	if phones:
		metadata["phone"] = phones[0]
	if linkedin_match:
		metadata["linkedin"] = linkedin_match.group()
	if github_match:
		metadata["github"] = github_match.group()

	clean_text = redact_phone_numbers(text)
	clean_text = EMAIL_RE.sub("", clean_text)
	clean_text = LINKEDIN_RE.sub("", clean_text)
	clean_text = GITHUB_RE.sub("", clean_text)

	return metadata, clean_text

def _normalize_whitespace(text: str):
	return re.sub(r"\s+", " ", text).strip()

def _to_plain(hit):
	if isinstance(hit, dict):
		entity = hit.get("entity") or {}
		if not isinstance(entity, dict):
			entity = {}
		return {
			"id": hit.get("id"),
			"score": hit.get("distance") or hit.get("score"),
			"email": entity.get("email"),
			"phone": entity.get("phone"),
			"pdf_id": entity.get("pdf_id"),
		}
	
	idv = getattr(hit, "id", None)
	score = getattr(hit, "distance", getattr(hit, "score", None))
	entity = getattr(hit, "entity", None)
	email = None
	phone = None
	pdf_id = None
	if isinstance(entity, dict):
		email = entity.get("email")
		phone = entity.get("phone")
		pdf_id = entity.get("pdf_id")
	else:
		email = getattr(entity, "email", None)
		phone = getattr(entity, "phone", None)
		pdf_id = getattr(entity, "pdf_id", None)
	return {"id": idv, "score": score, "email": email, "phone": phone, "pdf_id": pdf_id}

@app.teardown_appcontext
def _close_milvus(_=None):
	client = g.pop("milvus", None)
	if client is not None:
		try:
			client.close()
		except Exception:
			pass
		

@app.get("/pdf/<pdf_id>.pdf")
def serve_pdf(pdf_id):
	file_path = PDF_STORAGE / f"{pdf_id}.pdf"
	if not file_path.exists():
		return {"error": "PDF not found"}, 404
	return send_file(str(file_path), mimetype="application/pdf")

@app.get("/eligible-candidates")
def get_eligible_candidates():
	query = request.args.get("q", "")
	
	try:
		k = int(request.args.get("k", request.args.get("limit", 2)))
	except ValueError:
		k = 2
	query_vec = embedder.encode(query).tolist()
	
	client = get_milvus()
	ensure_collection(client)
	res = client.search(
		collection_name="demo_collection",
		data=[query_vec],
		limit=k, 
		output_fields=["email", "phone", "pdf_id", "name"],
	)
	print(res)

	if isinstance(res, dict) and "data" in res:
		rows = res.get("data") or []
		hits = rows[0] if rows else []
	elif isinstance(res, list):
		hits = res[0] if res and isinstance(res[0], list) else res
	else:
		hits = []

	plain = [_to_plain(h) for h in hits]

	return { "eligible": plain, "query": query, "limit": k }


@app.post("/upload-cv")
def upload_cv():
	file = request.files.get("file")
	if not file:
		return {"error": "missing form field 'file'"}, 400
	
	
	try:
		file_bytes = file.read()
		buffer = BytesIO(file_bytes)
		with pdfplumber.open(buffer) as pdf:
			pages = pdf.pages
			text = []
			for p in pages:
				page_txt = p.extract_text() or " "
				text.append(page_txt)
			full_text = " ".join(text)
			# Heuristic candidate name: first non-empty line of the first page
			first_page_text = text[0] if text else ""
	except Exception as e:
		return {"error": f"failed to read PDF: {e}"}
	
	pdf_id = str(uuid.uuid4())  
	filename = secure_filename(f"{pdf_id}.pdf")
	file_path = PDF_STORAGE / filename
	
	with open(file_path, "wb") as f:
		f.write(file_bytes)
	
	metadata, clean_text = extract_metadata(full_text)

	# Derive a display name
	candidate_name = ""
	if first_page_text:
		for ln in first_page_text.splitlines():
			ln = ln.strip()
			if ln:
				candidate_name = ln[:80]
				break
	if not candidate_name and metadata.get("email"):
		local = metadata["email"].split("@")[0]
		parts = re.split(r"[._-]+", local)
		candidate_name = " ".join(p.capitalize() for p in parts if p)
	
	clean_text = _normalize_whitespace(clean_text)
	# Short summary/excerpt for display
	summary = clean_text[:240]

	emb = embedder.encode(clean_text).tolist()
	data = {
		"vector": emb,
		"email": metadata.get("email", ""),
		"phone": metadata.get("phone", ""),
		"pdf_id": pdf_id,
		"name": candidate_name,
		"summary": summary,
	}

	client = get_milvus()
	ensure_collection(client)
	res = client.insert(collection_name="demo_collection", data=data)

	return { "pages": len(pages), "excerpt": clean_text }


@app.get("/candidates/<pdf_id>")
def get_candidate(pdf_id):
	"""Return minimal candidate info for a given pdf_id as JSON."""
	client = get_milvus()
	ensure_collection(client)
	try:
		res = client.query(
			collection_name="demo_collection",
			filter=f'pdf_id == "{pdf_id}"',
			output_fields=["email", "phone", "pdf_id", "name", "summary"],
		)
	except Exception as e:
		return {"error": f"query failed: {e}"}, 500

	if not res:
		return {"error": "candidate not found", "pdf_id": pdf_id}, 404

	# client.query returns a list of dicts
	entity = res[0] if isinstance(res, list) else res
	base = request.host_url.rstrip("/")
	return {
		"id": entity.get("id"),
		"email": entity.get("email"),
		"phone": entity.get("phone"),
		"pdf_id": entity.get("pdf_id", pdf_id),
		"name": entity.get("name"),
		"summary": entity.get("summary"),
		"score": 0,
		"pdf_url": f"{base}/pdf/{pdf_id}.pdf",
	}


if __name__ == "__main__":
	# When running inside Docker we must bind to 0.0.0.0 so other containers
	# (and the host) can reach the service. Allow debug mode to be controlled
	# via the FLASK_DEBUG environment variable.
	host = os.environ.get("FLASK_HOST", "0.0.0.0")
	debug = os.environ.get("FLASK_DEBUG", "1") == "1"
	app.run(host=host, port=5000, debug=debug, use_reloader=False)