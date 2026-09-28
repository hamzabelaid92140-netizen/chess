import os

import chess
import discord
from discord import app_commands
from dotenv import load_dotenv

from engine import StockfishEngine
from render import board_to_png

load_dotenv()

DISCORD_TOKEN = os.environ["DISCORD_TOKEN"]
STOCKFISH_PATH = os.environ.get("STOCKFISH_PATH", "stockfish")
SKILL_LEVEL = int(os.environ.get("SKILL_LEVEL", "20"))
THINK_TIME = float(os.environ.get("THINK_TIME", "2.5"))

intents = discord.Intents.default()
client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)

engine = StockfishEngine(STOCKFISH_PATH, SKILL_LEVEL, THINK_TIME)
games: dict[int, chess.Board] = {}


def result_text(board: chess.Board) -> str | None:
    if not board.is_game_over():
        return None
    outcome = board.outcome()
    if outcome.winner is True:
        return "Echec et mat, les blancs gagnent."
    if outcome.winner is False:
        return "Echec et mat, les noirs gagnent."
    return "Partie nulle."


@client.event
async def on_ready():
    await engine.start()
    await tree.sync()
    print(f"Connecte en tant que {client.user}")


@tree.command(name="chess", description="Commence une nouvelle partie d'echecs contre le bot")
async def chess_command(interaction: discord.Interaction):
    board = chess.Board()
    games[interaction.user.id] = board
    image = board_to_png(board)
    await interaction.response.send_message(file=discord.File(image, filename="board.png"))


@tree.command(name="move", description="Joue un coup (ex: e2e4 ou Nf3)")
@app_commands.describe(coup="Ton coup, en notation UCI (e2e4) ou SAN (Nf3)")
async def move_command(interaction: discord.Interaction, coup: str):
    board = games.get(interaction.user.id)
    if board is None:
        await interaction.response.send_message(
            "Aucune partie en cours. Lance /chess pour commencer.", ephemeral=True
        )
        return

    move = None
    try:
        move = board.parse_san(coup)
    except ValueError:
        try:
            candidate = chess.Move.from_uci(coup)
            if candidate in board.legal_moves:
                move = candidate
        except ValueError:
            move = None

    if move is None:
        await interaction.response.send_message("Coup invalide.", ephemeral=True)
        return

    await interaction.response.defer()

    board.push(move)

    end_text = result_text(board)
    if end_text is not None:
        image = board_to_png(board)
        await interaction.followup.send(content=end_text, file=discord.File(image, filename="board.png"))
        del games[interaction.user.id]
        return

    bot_move = await engine.best_move(board)
    board.push(bot_move)

    end_text = result_text(board)
    image = board_to_png(board)
    await interaction.followup.send(content=end_text, file=discord.File(image, filename="board.png"))
    if end_text is not None:
        del games[interaction.user.id]


@tree.command(name="resign", description="Abandonne la partie en cours")
async def resign_command(interaction: discord.Interaction):
    if games.pop(interaction.user.id, None) is not None:
        await interaction.response.send_message("Partie abandonnee.", ephemeral=True)
    else:
        await interaction.response.send_message("Aucune partie en cours.", ephemeral=True)


client.run(DISCORD_TOKEN)
