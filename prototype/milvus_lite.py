import os
import json
import threading
from typing import List, Dict, Any, Optional

try:
    import faiss
except Exception as e:
    raise RuntimeError("faiss is required for milvus_lite. Install faiss-cpu in your environment") from e


class MilvusLite:
    """A tiny FAISS-backed in-process vector store used as a 'milvus lite' replacement.

    Features implemented (minimal):
    - create collection (noop)
    - has_collection (based on index file)
    - insert(collection_name, data) where data is a dict or list of dicts with a 'vector' field
    - search(collection_name, data=[vec], limit=k, output_fields=[...]) -> returns list-of-lists of hits
    - query(collection_name, filter=..., output_fields=[...]) -> simple attribute equality filter

    Persistence: index and metadata are stored under the base path given by db_path.
    """

    def __init__(self, db_path: str, dimension: int = 384):
        self.db_path = os.path.abspath(db_path)
        os.makedirs(self.db_path, exist_ok=True)
        self.index_file = os.path.join(self.db_path, "index.faiss")
        self.meta_file = os.path.join(self.db_path, "metadata.json")
        self.dimension = dimension
        self.lock = threading.Lock()

        # Load or create index
        if os.path.exists(self.index_file) and os.path.exists(self.meta_file):
            try:
                self.index = faiss.read_index(self.index_file)
            except Exception:
                # fallback: recreate
                self.index = faiss.IndexFlatIP(self.dimension)
            try:
                with open(self.meta_file, 'r', encoding='utf-8') as f:
                    self.metadata: List[Dict[str, Any]] = json.load(f)
            except Exception:
                self.metadata = []
        else:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.metadata = []

        # We will normalize vectors before adding/searching for cosine-sim via inner product
        self._normalize_index = True

    def _normalize(self, vecs):
        import numpy as np
        arr = np.array(vecs, dtype='float32')
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
        # Normalize each vector
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return (arr / norms).astype('float32')

    def has_collection(self, collection_name: str) -> bool:
        # Single collection supported here; presence of index file indicates collection
        return len(self.metadata) > 0

    def create_collection(self, collection_name: str, **kwargs):
        # noop for lite
        return True

    def insert(self, collection_name: str, data: Any):
        """Insert a single dict or a list of dicts. Each dict must have a 'vector' key.
        Returns inserted ids.
        """
        with self.lock:
            items = data if isinstance(data, list) else [data]
            vectors = [it.get('vector') for it in items]
            vecs = self._normalize(vectors) if self._normalize_index else vectors

            import numpy as np
            vecs = np.array(vecs, dtype='float32')

            # FAISS IndexFlatIP doesn't store ids; we append and use position as id
            self.index.add(vecs)
            start_id = len(self.metadata)
            for i, it in enumerate(items):
                # store metadata; ensure keys are present
                ent = dict(it)
                # remove raw vector from metadata to save space
                ent.pop('vector', None)
                self.metadata.append(ent)

            # persist
            try:
                faiss.write_index(self.index, self.index_file)
            except Exception:
                pass
            try:
                with open(self.meta_file, 'w', encoding='utf-8') as f:
                    json.dump(self.metadata, f)
            except Exception:
                pass

            return list(range(start_id, start_id + len(items)))

    def search(self, collection_name: str, data: List[List[float]], limit: int = 10, output_fields: Optional[List[str]] = None):
        """data is a list of query vectors (we support only 1 query vector typically). Returns list of lists.
        Each hit is represented as a dict-like object with 'id', 'distance' and 'entity' keys to mimic Milvus response.
        """
        if not data:
            return []
        qvecs = self._normalize(data) if self._normalize_index else data

        import numpy as np
        q = np.array(qvecs, dtype='float32')
        with self.lock:
            if self.index.ntotal == 0:
                return [[] for _ in range(len(q))]
            D, I = self.index.search(q, limit)

        results = []
        for row_idx in range(I.shape[0]):
            hits = []
            for col_idx in range(I.shape[1]):
                idx = int(I[row_idx, col_idx])
                score = float(D[row_idx, col_idx])
                if idx < 0 or idx >= len(self.metadata):
                    continue
                hits.append({
                    'id': idx,
                    'distance': score,
                    'entity': self.metadata[idx]
                })
            results.append(hits)
        return results

    def query(self, collection_name: str, filter: str = None, output_fields: Optional[List[str]] = None):
        """Simple filter parser supporting equality checks like: pdf_id == "<id>"""
        if not filter:
            return self.metadata
        # naive parser: look for pdf_id == "value" or pdf_id == 'value'
        import re
        m = re.search(r'pdf_id\s*==\s*["\'](.+?)["\']', filter)
        if m:
            val = m.group(1)
            matches = [ent for ent in self.metadata if str(ent.get('pdf_id') or ent.get('pdf_id')) == val or str(ent.get('pdf_id') or ent.get('pdf_id')) == val]
            return matches
        # fallback: return empty list
        return []
