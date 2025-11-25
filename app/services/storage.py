import os
import shutil
import aiofiles
from pathlib import Path
from typing import Optional, BinaryIO
from datetime import datetime
import uuid

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.exceptions import StorageError

logger = get_logger(__name__)


class StorageService:
    def __init__(self):
        self.settings = get_settings()
        self._ensure_directories()
    
    def _ensure_directories(self):
        for dir_name in [self.settings.upload_dir, self.settings.output_dir, self.settings.temp_dir]:
            Path(dir_name).mkdir(parents=True, exist_ok=True)
    
    def generate_filename(self, original_filename: str, prefix: str = "") -> str:
        ext = Path(original_filename).suffix
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        return f"{prefix}{timestamp}_{unique_id}{ext}"
    
    async def save_upload(self, file: BinaryIO, filename: str) -> Path:
        try:
            safe_filename = self.generate_filename(filename, "upload_")
            file_path = Path(self.settings.upload_dir) / safe_filename

            content = file.read()
            async with aiofiles.open(file_path, "wb") as f:
                await f.write(content)

            logger.info("file_saved", path=str(file_path), size=len(content))
            return file_path

        except Exception as e:
            logger.error("file_save_failed", error=str(e))
            raise StorageError(f"Failed to save file: {str(e)}")
    
    def get_output_path(self, input_filename: str) -> Path:
        safe_filename = self.generate_filename(input_filename, "captioned_")
        return Path(self.settings.output_dir) / safe_filename
    
    def get_temp_path(self, filename: str) -> Path:
        safe_filename = self.generate_filename(filename, "temp_")
        return Path(self.settings.temp_dir) / safe_filename
    
    async def delete_file(self, file_path: Path) -> bool:
        try:
            if file_path.exists():
                file_path.unlink()
                logger.info("file_deleted", path=str(file_path))
                return True
            return False
        except Exception as e:
            logger.error("file_delete_failed", path=str(file_path), error=str(e))
            return False
    
    async def cleanup_temp_files(self, task_id: str):
        temp_dir = Path(self.settings.temp_dir)
        for file in temp_dir.glob(f"*{task_id}*"):
            await self.delete_file(file)


_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
