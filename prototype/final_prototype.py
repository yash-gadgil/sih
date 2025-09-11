from flask import Flask, request, g
import pdfplumber
from io import BytesIO
import os
from sentence_transformers import SentenceTransformer
import re
from pymilvus import MilvusClient 


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


embedder = SentenceTransformer("all-MiniLM-L6-v2")
app = Flask(__name__)


def get_milvus():
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

def split_sections(text):
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
		}
	
	idv = getattr(hit, "id", None)
	score = getattr(hit, "distance", getattr(hit, "score", None))
	entity = getattr(hit, "entity", None)
	email = None
	phone = None
	if isinstance(entity, dict):
		email = entity.get("email")
		phone = entity.get("phone")
	else:
		email = getattr(entity, "email", None)
		phone = getattr(entity, "phone", None)

	return {"id": idv, "score": score, "email": email, "phone": phone}

@app.teardown_appcontext
def _close_milvus(_=None):
	client = g.pop("milvus", None)
	if client is not None:
		try:
			client.close()
		except Exception:
			pass
		

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
		output_fields=["email", "phone"],
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
		buffer = BytesIO(file.read())
		with pdfplumber.open(buffer) as pdf:
			pages = pdf.pages
			text = []
			for p in pages:
				page_txt = p.extract_text() or " "
				text.append(page_txt)
			full_text = " ".join(text)
	except Exception as e:
		return {"error": f"failed to read PDF: {e}"}
	
	metadata, clean_text = extract_metadata(full_text)
	broken_text = split_sections(clean_text)

	emb = embedder.encode(clean_text).tolist()
	data = {
		"vector": emb,
		"email": metadata.get("email", ""),
		"phone": metadata.get("phone", ""),
	}

	client = get_milvus()
	ensure_collection(client)
	res = client.insert(collection_name="demo_collection", data=data)

	return { "pages": len(pages), "excerpt": broken_text }


if __name__ == "__main__":
	app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)