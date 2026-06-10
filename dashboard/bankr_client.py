"""Bankr API client — portfolio, balances, tokens, and transfers."""

import os, json
from urllib.request import Request, urlopen
from urllib.error import URLError

BANKR_API = "https://api.bankr.bot"
API_KEY = os.environ.get("BANKR_API_KEY", "")

def _headers():
    return {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
        "User-Agent": "AutoMend-Dashboard/1.0",
    }

def _get(path):
    if not API_KEY:
        return None
    try:
        req = Request(f"{BANKR_API}{path}", headers=_headers(), method="GET")
        with urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except (URLError, OSError, json.JSONDecodeError):
        return None

def _post(path, data=None):
    if not API_KEY:
        return None
    try:
        body = json.dumps(data or {}).encode()
        req = Request(f"{BANKR_API}{path}", data=body, headers=_headers(), method="POST")
        with urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except (URLError, OSError, json.JSONDecodeError):
        return None

def get_portfolio():
    return _get("/wallet/portfolio")

def get_wallet_info():
    return _get("/wallet/me")

def search_tokens(query):
    return _get(f"/tokens/search?q={query}")

def get_token_info(symbol):
    return _get(f"/tokens/info/{symbol}")

def check_credits():
    return _get("/llm/credits")

def list_models():
    return _get("/llm/models")
