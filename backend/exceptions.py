from fastapi import HTTPException


class EmailAlreadyExistsException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=409,
            detail={
                "code": "EMAIL_ALREADY_EXISTS",
                "message": "An account with this email already exists.",
            },
        )


class InvalidCredentialsException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=401,
            detail={
                "code": "INVALID_CREDENTIALS",
                "message": "Incorrect email or password.",
            },
        )


class UnauthorizedException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=401,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Missing or invalid authentication token.",
            },
        )


class InvalidImageFormatException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=400,
            detail={
                "code": "INVALID_IMAGE_FORMAT",
                "message": "Unsupported image. Use a JPEG, PNG, or WEBP photo of at least 100x100px.",
            },
        )


class ImageTooLargeException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=400,
            detail={
                "code": "IMAGE_TOO_LARGE",
                "message": "Image exceeds the 5 MB size limit.",
            },
        )


class PrologEngineErrorException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=500,
            detail={
                "code": "PROLOG_ENGINE_ERROR",
                "message": "The diagnosis engine failed to process this assessment.",
            },
        )




class AssessmentNotFoundException(HTTPException):
    def __init__(self, assessment_id: str) -> None:
        super().__init__(
            status_code=404,
            detail={
                "code": "ASSESSMENT_NOT_FOUND",
                "message": f"Assessment with id {assessment_id} was not found.",
            },
        )


class ForbiddenException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have access to this resource.",
            },
        )


class LLMServiceUnavailableException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=503,
            detail={
                "code": "LLM_SERVICE_UNAVAILABLE",
                "message": "The chat assistant is temporarily unavailable.",
            },
        )


class ClinicServiceUnavailableException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=503,
            detail={
                "code": "CLINIC_SERVICE_UNAVAILABLE",
                "message": "Nearby clinic search is temporarily unavailable.",
            },
        )


class InvalidLinkTokenException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=400,
            detail={
                "code": "INVALID_LINK_TOKEN",
                "message": "This Telegram link is invalid or has expired.",
            },
        )
