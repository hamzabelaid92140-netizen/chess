import time
import uuid

import chess

# une partie inactive depuis plus longtemps que ca est nettoyee
GAME_TTL_SECONDS = 3600


class GameManager:
    def __init__(self):
        self._boards: dict[str, chess.Board] = {}
        self._last_seen: dict[str, float] = {}

    def _cleanup_stale(self):
        now = time.time()
        stale = [
            gid for gid, last in self._last_seen.items()
            if now - last > GAME_TTL_SECONDS
        ]
        for gid in stale:
            self._boards.pop(gid, None)
            self._last_seen.pop(gid, None)

    def new_game(self) -> tuple[str, chess.Board]:
        self._cleanup_stale()
        game_id = str(uuid.uuid4())
        board = chess.Board()
        self._boards[game_id] = board
        self._last_seen[game_id] = time.time()
        return game_id, board

    def get(self, game_id: str) -> chess.Board | None:
        board = self._boards.get(game_id)
        if board is not None:
            self._last_seen[game_id] = time.time()
        return board

    def delete(self, game_id: str):
        self._boards.pop(game_id, None)
        self._last_seen.pop(game_id, None)
