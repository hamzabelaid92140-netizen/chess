import chess
import chess.engine


class StockfishEngine:
    def __init__(self, path: str, skill_level: int, think_time: float):
        self.path = path
        self.skill_level = max(0, min(20, skill_level))
        self.think_time = think_time
        self._transport = None
        self._engine: chess.engine.UciProtocol | None = None

    async def start(self):
        self._transport, self._engine = await chess.engine.popen_uci(self.path)
        await self._engine.configure({"Skill Level": self.skill_level})

    async def stop(self):
        if self._engine is not None:
            await self._engine.quit()

    async def best_move(self, board: chess.Board) -> chess.Move:
        if self._engine is None:
            raise RuntimeError("Engine not started")
        result = await self._engine.play(
            board, chess.engine.Limit(time=self.think_time)
        )
        return result.move
