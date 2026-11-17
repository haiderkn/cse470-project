"""Video call feature: 1-to-1 WebRTC calls.

The server only helps two browsers find each other ("signaling"). Audio and video
go directly between the browsers (or through the TURN relay), encrypted end to end.

Endpoints
    GET /api/video-call/ice-servers     STUN/TURN settings for the browser
    WS  /ws/video-call/{room_id}        signaling for one call room (max 2 people)
"""
import os
import re
from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["video-call"])

MAX_PEERS = 2
ROOM_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
STUN_ONLY = [{"urls": "stun:stun.l.google.com:19302"}]

_rooms: dict[str, list[WebSocket]] = defaultdict(list)


@router.get("/api/video-call/ice-servers")
def ice_servers():
    username = os.getenv("TURN_USERNAME")
    password = os.getenv("TURN_PASSWORD")
    if not username or not password:
        return STUN_ONLY
    login = {"username": username, "credential": password}
    return [
        {"urls": "stun:stun.relay.metered.ca:80"},
        {"urls": "turn:global.relay.metered.ca:80", **login},
        {"urls": "turn:global.relay.metered.ca:80?transport=tcp", **login},
        {"urls": "turn:global.relay.metered.ca:443", **login},
        {"urls": "turns:global.relay.metered.ca:443?transport=tcp", **login},
    ]


@router.websocket("/ws/video-call/{room_id}")
async def signaling(websocket: WebSocket, room_id: str):
    await websocket.accept()

    if not ROOM_ID_PATTERN.match(room_id):
        await websocket.send_json({"type": "invalid-room"})
        await websocket.close()
        return

    peers = _rooms[room_id]
    if len(peers) >= MAX_PEERS:
        await websocket.send_json({"type": "room-full"})
        await websocket.close()
        return

    peers.append(websocket)
    for peer in peers:
        if peer is not websocket:
            await peer.send_json({"type": "peer-joined"})

    try:
        while True:
            message = await websocket.receive_json()
            for peer in peers:
                if peer is not websocket:
                    await peer.send_json(message)
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in peers:
            peers.remove(websocket)
        for peer in peers:
            try:
                await peer.send_json({"type": "peer-left"})
            except Exception:
                pass
        if not peers:
            _rooms.pop(room_id, None)