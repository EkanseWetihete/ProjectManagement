import asyncio
import json
from contextlib import suppress


class RealtimeService:
    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[str]] = set()

    def subscribe(self) -> asyncio.Queue[str]:
        queue: asyncio.Queue[str] = asyncio.Queue()
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[str]) -> None:
        self._subscribers.discard(queue)

    async def stream(self):
        queue = self.subscribe()
        try:
            yield self._format_event("connected", {"status": "ok"})
            while True:
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=25)
                    yield payload
                except TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            self.unsubscribe(queue)

    def publish_dashboard_changed(self, project_id: int | None = None) -> None:
        payload = self._format_event(
            "dashboard_changed",
            {"project_id": project_id},
        )
        stale_queues: list[asyncio.Queue[str]] = []
        for queue in self._subscribers:
            try:
                queue.put_nowait(payload)
            except RuntimeError:
                stale_queues.append(queue)

        for queue in stale_queues:
            self.unsubscribe(queue)

    def _format_event(self, event: str, data: dict) -> str:
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"


realtime_service = RealtimeService()