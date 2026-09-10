from typing import Optional
from fastapi import Header, Query

def get_store_id(
    x_store_id: Optional[int] = Header(None, alias="X-Store-Id"),
    store_id: Optional[int] = Query(None)
) -> Optional[int]:
    """Extracts store_id from X-Store-Id header or store_id query param."""
    if x_store_id is not None:
        return x_store_id
    if store_id is not None:
        return store_id
    return None
