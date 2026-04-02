import asyncio
import json
from typing import Any, Dict

class SSEManager:
    def __init__(self):
        self.listeners: Dict[str, list[asyncio.Queue]] = {}

    def subscribe(self, session_id: str) -> asyncio.Queue:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"SSE Subscribe: {session_id}")
        if session_id not in self.listeners:
            self.listeners[session_id] = []
        q = asyncio.Queue()
        self.listeners[session_id].append(q)
        return q

    def unsubscribe(self, session_id: str, queue: asyncio.Queue):
        if session_id in self.listeners:
            if queue in self.listeners[session_id]:
                self.listeners[session_id].remove(queue)
            if not self.listeners[session_id]:
                del self.listeners[session_id]

    async def broadcast(self, session_id: str, event_type: str, data: Any = None):
        import logging
        logger = logging.getLogger(__name__)
        if session_id not in self.listeners:
            logger.warning(f"SSE Broadcast dropped for {session_id}: no listeners (event: {event_type})")
            return
            
        logger.info(f"SSE Broadcast to {len(self.listeners[session_id])} listeners: {session_id} - {event_type}")
        payload: dict[str, Any] = {"type": event_type}
        if data is not None:
            if hasattr(data, "model_dump"):
                payload["data"] = data.model_dump()
            else:
                payload["data"] = data

        message = json.dumps(payload)
        
        # Dispatch to all queues for the session
        for q in self.listeners[session_id]:
            await q.put(message)

sse_manager = SSEManager()
