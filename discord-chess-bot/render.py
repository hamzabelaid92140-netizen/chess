import io

import cairosvg
import chess
import chess.svg


def board_to_png(board: chess.Board, size: int = 480) -> io.BytesIO:
    last_move = board.peek() if board.move_stack else None
    check_square = board.king(board.turn) if board.is_check() else None

    svg_data = chess.svg.board(
        board,
        lastmove=last_move,
        check=check_square,
        size=size,
        orientation=chess.WHITE,
    )

    png_bytes = cairosvg.svg2png(bytestring=svg_data.encode("utf-8"))
    buffer = io.BytesIO(png_bytes)
    buffer.seek(0)
    return buffer
