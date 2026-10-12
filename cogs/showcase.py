import logging
import re

import discord
from discord.ext import commands

from config import SHOWCASE_CHANNEL_ID

logger = logging.getLogger("deepwoken-bot.showcase")

LINK_PATTERN = re.compile(r"https?://\S+", re.IGNORECASE)
VOTE_EMOJIS = ("👍", "❤️")


class Showcase(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or message.guild is None:
            return
        if not SHOWCASE_CHANNEL_ID or message.channel.id != SHOWCASE_CHANNEL_ID:
            return
        if not LINK_PATTERN.search(message.content):
            return

        for emoji in VOTE_EMOJIS:
            try:
                await message.add_reaction(emoji)
            except discord.HTTPException:
                logger.exception("Échec de l'ajout de réaction sur le post showcase %s", message.id)


async def setup(bot: commands.Bot):
    await bot.add_cog(Showcase(bot))
