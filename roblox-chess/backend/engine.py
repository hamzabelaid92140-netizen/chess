import os

import chess
import chess.engine


class StockfishEngine:
    """Wrapper autour de Stockfish configure pour la force maximale.

    Pas de "Skill Level" : ce parametre introduit volontairement des
    erreurs pour simuler un joueur humain. La force vient de
    Threads/Hash (recherche plus large et plus profonde dans le meme
    temps) et, si dispo, des tables Syzygy pour un jeu de finale
    mathematiquement parfait.
    """

    def __init__(
        self,
        path: str,
        think_time: float,
        threads: int | None = None,
        hash_mb: int = 256,
        depth: int | None = None,
        syzygy_path: str | None = None,
    ):
        self.path = path
        self.think_time = think_time
        self.threads = threads or max(1, (os.cpu_count() or 2) - 1)
        self.hash_mb = hash_mb
        self.depth = depth
        self.syzygy_path = syzygy_path
        self._transport = None
        self._engine: chess.engine.UciProtocol | None = None

    async def start(self):
        self._transport, self._engine = await chess.engine.popen_uci(self.path)

        options = {
            "Threads": self.threads,
            "Hash": self.hash_mb,
            "UCI_LimitStrength": False,
        }
        if self.syzygy_path:
            options["SyzygyPath"] = self.syzygy_path

        await self._engine.configure(options)

    async def stop(self):
        if self._engine is not None:
            await self._engine.quit()

    async def best_move(self, board: chess.Board) -> chess.Move:
        if self._engine is None:
            raise RuntimeError("Engine not started")

        limit_kwargs = {"time": self.think_time}
        if self.depth is not None:
            limit_kwargs["depth"] = self.depth

        result = await self._engine.play(board, chess.engine.Limit(**limit_kwargs))
        return result.move
