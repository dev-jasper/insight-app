from __future__ import annotations

from typing import Any

from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError, NotAuthenticated, PermissionDenied
from rest_framework.response import Response


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """
    Standardizes error responses:
    {"error": {"code": "<CODE>", "details": <DETAILS>}}
    """
    resp = exception_handler(exc, context)
    if resp is None:
        return None  # let DRF/Django handle 500s (debug) or default 500 response

    # Default mapping
    code = "ERROR"
    if resp.status_code == 400:
        code = "VALIDATION_ERROR"
    elif resp.status_code == 401:
        code = "UNAUTHORIZED"
    elif resp.status_code == 403:
        code = "FORBIDDEN"
    elif resp.status_code == 404:
        code = "NOT_FOUND"
    elif resp.status_code >= 500:
        code = "SERVER_ERROR"

    # DRF exception types (more explicit)
    if isinstance(exc, ValidationError):
        code = "VALIDATION_ERROR"
    elif isinstance(exc, NotAuthenticated):
        code = "UNAUTHORIZED"
    elif isinstance(exc, PermissionDenied):
        code = "FORBIDDEN"

    # Normalize details shape
    details: Any = resp.data
    # Some errors come as {"detail": "..."}; keep as dict
    if isinstance(details, list):
        details = {"detail": details}

    resp.data = {"error": {"code": code, "details": details}}
    return resp