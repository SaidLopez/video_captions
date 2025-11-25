from typing import Dict, Optional
from datetime import datetime
import asyncio

from app.models import VideoTask, TaskStatusEnum
from app.core.logging import get_logger

logger = get_logger(__name__)


class TaskManager:
    def __init__(self):
        self._tasks: Dict[str, VideoTask] = {}
        self._lock = asyncio.Lock()
    
    async def create_task(self, **kwargs) -> VideoTask:
        async with self._lock:
            task = VideoTask(**kwargs)
            self._tasks[task.id] = task
            logger.info("task_created", task_id=task.id)
            return task
    
    async def get_task(self, task_id: str) -> Optional[VideoTask]:
        return self._tasks.get(task_id)
    
    async def update_task(
        self,
        task_id: str,
        status: Optional[TaskStatusEnum] = None,
        progress: Optional[float] = None,
        message: Optional[str] = None,
        output_path: Optional[str] = None,
        result_url: Optional[str] = None,
        error: Optional[str] = None,
        **kwargs
    ) -> Optional[VideoTask]:
        async with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return None
            
            if status is not None:
                task.status = status
            if progress is not None:
                task.progress = progress
            if message is not None:
                task.message = message
            if output_path is not None:
                task.output_path = output_path
            if result_url is not None:
                task.result_url = result_url
            if error is not None:
                task.error = error
            
            task.updated_at = datetime.utcnow()
            
            logger.info(
                "task_updated",
                task_id=task_id,
                status=task.status.value,
                progress=task.progress
            )
            
            return task
    
    async def delete_task(self, task_id: str) -> bool:
        async with self._lock:
            if task_id in self._tasks:
                del self._tasks[task_id]
                logger.info("task_deleted", task_id=task_id)
                return True
            return False
    
    async def list_tasks(self, limit: int = 100) -> list[VideoTask]:
        tasks = list(self._tasks.values())
        tasks.sort(key=lambda t: t.created_at, reverse=True)
        return tasks[:limit]


_task_manager: Optional[TaskManager] = None


def get_task_manager() -> TaskManager:
    global _task_manager
    if _task_manager is None:
        _task_manager = TaskManager()
    return _task_manager
