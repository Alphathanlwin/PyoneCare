from fastapi import HTTPException


class _Coded(HTTPException):
    STATUS: int = 500
    CODE: str = "ERROR"
    MESSAGE: str = "Error."

    def __init__(self, message: str | None = None) -> None:
        super().__init__(
            status_code=self.STATUS,
            detail={"code": self.CODE, "message": message or self.MESSAGE},
        )


class EmailAlreadyExistsException(_Coded):
    STATUS = 409
    CODE = "EMAIL_ALREADY_EXISTS"
    MESSAGE = "An account with this email already exists."


class InvalidCredentialsException(_Coded):
    STATUS = 401
    CODE = "INVALID_CREDENTIALS"
    MESSAGE = "Incorrect email or password."


class UnauthorizedException(_Coded):
    STATUS = 401
    CODE = "UNAUTHORIZED"
    MESSAGE = "Missing or invalid authentication token."


class InvalidImageFormatException(_Coded):
    STATUS = 400
    CODE = "INVALID_IMAGE_FORMAT"
    MESSAGE = "Unsupported image. Use a JPEG, PNG, or WEBP photo of at least 100x100px."


class ImageTooLargeException(_Coded):
    STATUS = 400
    CODE = "IMAGE_TOO_LARGE"
    MESSAGE = "Image exceeds the 5 MB size limit."


class PrologEngineErrorException(_Coded):
    STATUS = 500
    CODE = "PROLOG_ENGINE_ERROR"
    MESSAGE = "The diagnosis engine failed to process this assessment."


class AssessmentNotFoundException(_Coded):
    STATUS = 404
    CODE = "ASSESSMENT_NOT_FOUND"

    def __init__(self, assessment_id: str) -> None:
        super().__init__(f"Assessment with id {assessment_id} was not found.")


class ForbiddenException(_Coded):
    STATUS = 403
    CODE = "FORBIDDEN"
    MESSAGE = "You do not have access to this resource."


class LLMServiceUnavailableException(_Coded):
    STATUS = 503
    CODE = "LLM_SERVICE_UNAVAILABLE"
    MESSAGE = "The chat assistant is temporarily unavailable."


class ClinicServiceUnavailableException(_Coded):
    STATUS = 503
    CODE = "CLINIC_SERVICE_UNAVAILABLE"
    MESSAGE = "Nearby clinic search is temporarily unavailable."
