import os
from contextlib import asynccontextmanager

import chess
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from engine import StockfishEngine
from game_manager import GameManager

load_dotenv()

STOCKFISH_PATH = os.environ.get("STOCKFISH_PATH", "stockfish")
THINK_TIME = float(os.environ.get("THINK_TIME", "3.0"))
SF_THREADS = int(os.environ["SF_THREADS"]) if "SF_THREADS" in os.environ else None
SF_HASH_MB = int(os.environ.get("SF_HASH_MB", "256"))
SF_DEPTH = int(os.environ["SF_DEPTH"]) if "SF_DEPTH" in os.environ else None
SF_SYZYGY_PATH = os.environ.get("SF_SYZYGY_PATH") or None
API_KEY = os.environ.get("API_KEY")

engine = StockfishEngine(
    STOCKFISH_PATH,
    THINK_TIME,
    threads=SF_THREADS,
    hash_mb=SF_HASH_MB,
    depth=SF_DEPTH,
    syzygy_path=SF_SYZYGY_PATH,
)
games = GameManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await engine.start()
    yield
    await engine.stop()


app = FastAPI(title="Roblox Chess Backend", lifespan=lifespan)


def check_api_key(x_api_key: str | None = Header(default=None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="invalid api key")


class MoveRequest(BaseModel):
    game_id: str
    from_square: str
    to_square: str
    promotion: str | None = None  # "q", "r", "b" ou "n"


def board_state(board: chess.Board, last_move: chess.Move | None = None) -> dict:
    pieces = []
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            pieces.append({"square": chess.square_name(square), "piece": piece.symbol()})

    status = "ongoing"
    if board.is_checkmate():
        status = "checkmate"
    elif board.is_stalemate():
        status = "stalemate"
    elif board.is_insufficient_material():
        status = "draw_material"
    elif board.can_claim_draw():
        status = "draw"

    return {
        "pieces": pieces,
        "turn": "white" if board.turn == chess.WHITE else "black",
        "in_check": board.is_check(),
        "game_over": board.is_game_over(),
        "status": status,
        "result": board.result() if board.is_game_over() else None,
        "last_move": {
            "from": chess.square_name(last_move.from_square),
            "to": chess.square_name(last_move.to_square),
        }
        if last_move
        else None,
    }


@app.post("/new_game", dependencies=[Depends(check_api_key)])
async def new_game():
    game_id, board = games.new_game()
    return {"game_id": game_id, **board_state(board)}


@app.get("/board/{game_id}", dependencies=[Depends(check_api_key)])
async def get_board(game_id: str):
    board = games.get(game_id)
    if board is None:
        raise HTTPException(status_code=404, detail="game not found")
    return board_state(board)


@app.post("/move", dependencies=[Depends(check_api_key)])
async def make_move(req: MoveRequest):
    board = games.get(req.game_id)
    if board is None:
        raise HTTPException(status_code=404, detail="game not found")
    if board.is_game_over():
        raise HTTPException(status_code=400, detail="game already over")

    promo = req.promotion.lower() if req.promotion else ""
    if promo not in ("", "q", "r", "b", "n"):
        raise HTTPException(status_code=400, detail="invalid promotion piece")

    uci = f"{req.from_square}{req.to_square}{promo}"
    try:
        move = chess.Move.from_uci(uci)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid move format")

    if move not in board.legal_moves:
        raise HTTPException(status_code=400, detail="illegal move")

    board.push(move)
    player_move = move

    if board.is_game_over():
        return board_state(board, last_move=player_move)

    engine_move = await engine.best_move(board)
    board.push(engine_move)

    return board_state(board, last_move=engine_move)


@app.delete("/game/{game_id}", dependencies=[Depends(check_api_key)])
async def delete_game(game_id: str):
    games.delete(game_id)
    return {"ok": True}
