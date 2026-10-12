import asyncio
import logging

import discord
from discord.ext import commands

from config import DISCORD_TOKEN, GUILD_ID

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("deepwoken-bot")

intents = discord.Intents.default()
intents.members = True
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

EXTENSIONS = ["cogs.verification", "cogs.hair_id"]


@bot.event
async def on_ready():
    logger.info("Connecté en tant que %s", bot.user)
    try:
        if GUILD_ID:
            guild = discord.Object(id=GUILD_ID)
            await bot.tree.sync(guild=guild)
        else:
            await bot.tree.sync()
    except discord.HTTPException:
        logger.exception("Échec de la synchronisation des commandes slash")


async def main():
    if not DISCORD_TOKEN:
        raise RuntimeError("DISCORD_TOKEN n'est pas défini (voir .env.example)")

    async with bot:
        for extension in EXTENSIONS:
            await bot.load_extension(extension)
        await bot.start(DISCORD_TOKEN)


if __name__ == "__main__":
    asyncio.run(main())
