"""Custom exceptions for the analysis engine."""

from typing import Optional, Dict, Any


class AnalysisEngineError(Exception):
    """Base exception for analysis engine errors."""

    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class DataNotFoundError(AnalysisEngineError):
    """Exception raised when required data is not found."""

    def __init__(self, symbol: str, data_type: str, details: Optional[Dict[str, Any]] = None):
        message = f"{data_type} data not found for symbol {symbol}"
        super().__init__(message, status_code=404, details=details)
        self.symbol = symbol
        self.data_type = data_type


class ExternalServiceError(AnalysisEngineError):
    """Exception raised when external service calls fail."""

    def __init__(self, service: str, operation: str, original_error: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        message = f"External service error: {service} - {operation}"
        if original_error:
            message += f" - {original_error}"
        super().__init__(message, status_code=502, details=details)
        self.service = service
        self.operation = operation
        self.original_error = original_error


class ValidationError(AnalysisEngineError):
    """Exception raised when input validation fails."""

    def __init__(self, field: str, value: Any, reason: str, details: Optional[Dict[str, Any]] = None):
        message = f"Validation error for {field}: {reason}"
        super().__init__(message, status_code=400, details=details)
        self.field = field
        self.value = value
        self.reason = reason


class RateLimitError(AnalysisEngineError):
    """Exception raised when rate limits are exceeded."""

    def __init__(self, service: str, retry_after: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        message = f"Rate limit exceeded for {service}"
        super().__init__(message, status_code=429, details=details)
        self.service = service
        self.retry_after = retry_after


class CacheError(AnalysisEngineError):
    """Exception raised when cache operations fail."""

    def __init__(self, operation: str, key: str, original_error: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        message = f"Cache {operation} failed for key {key}"
        if original_error:
            message += f" - {original_error}"
        super().__init__(message, status_code=500, details=details)
        self.operation = operation
        self.key = key
        self.original_error = original_error


class LLMError(AnalysisEngineError):
    """Exception raised when LLM operations fail."""

    def __init__(self, operation: str, model: str, original_error: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        message = f"LLM {operation} failed with model {model}"
        if original_error:
            message += f" - {original_error}"
        super().__init__(message, status_code=503, details=details)
        self.operation = operation
        self.model = model
        self.original_error = original_error


class InsufficientDataError(AnalysisEngineError):
    """Exception raised when insufficient data is available for analysis."""

    def __init__(self, symbol: str, analysis_type: str, required_points: int, available_points: int, details: Optional[Dict[str, Any]] = None):
        message = f"Insufficient data for {analysis_type} analysis of {symbol}: required {required_points}, available {available_points}"
        super().__init__(message, status_code=422, details=details)
        self.symbol = symbol
        self.analysis_type = analysis_type
        self.required_points = required_points
        self.available_points = available_points