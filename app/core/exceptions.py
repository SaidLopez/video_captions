from fastapi import HTTPException, status


class VideoCaptionException(Exception):
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class VideoNotFoundError(VideoCaptionException):
    pass


class VideoProcessingError(VideoCaptionException):
    pass


class TranscriptionError(VideoCaptionException):
    pass


class InvalidFileTypeError(VideoCaptionException):
    pass


class FileTooLargeError(VideoCaptionException):
    pass


class StorageError(VideoCaptionException):
    pass


class TaskNotFoundError(VideoCaptionException):
    pass
