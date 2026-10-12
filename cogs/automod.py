import logging
import re
from datetime import timedelta

import discord
from discord.ext import commands

from config import LINK_EXEMPT_CATEGORY_ID, MOD_LOG_CHANNEL_ID

logger = logging.getLogger("deepwoken-bot.automod")

LINK_PATTERN = re.compile(
    r"(https?://\S+|www\.\S+|discord(?:app)?\.com/invite/\S+|discord\.gg/\S+)",
    re.IGNORECASE,
)
TIMEOUT_DURATION = timedelta(hours=1)
DM_MESSAGE = (
    "No links allowed here. You've been timed out for 1 hour for posting a link "
    "outside the allowed category."
)


class AutoMod(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def _log(self, guild: discord.Guild, message: str):
        if not MOD_LOG_CHANNEL_ID:
            return
        channel = guild.get_channel(MOD_LOG_CHANNEL_ID)
        if channel:
            try:
                await channel.send(message)
            except discord.HTTPException:
                logger.exception("Échec de l'envoi dans le salon de logs de modération")

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or message.guild is None:
            return

        channel = message.channel
        category_id = getattr(channel, "category_id", None)
        if LINK_EXEMPT_CATEGORY_ID and category_id == LINK_EXEMPT_CATEGORY_ID:
            return

        if isinstance(message.author, discord.Member) and message.author.guild_permissions.manage_messages:
            return

        if not LINK_PATTERN.search(message.content):
            return

        try:
            await message.delete()
        except discord.HTTPException:
            logger.exception("Échec de la suppression d'un message contenant un lien")

        member = message.author
        try:
            await member.timeout(TIMEOUT_DURATION, reason="Lien posté hors de la catégorie autorisée")
        except discord.Forbidden:
            logger.warning("Impossible de timeout %s (permissions manquantes)", member)

        try:
            await member.send(DM_MESSAGE)
        except discord.Forbidden:
            pass

        await self._log(
            message.guild,
            f"🔗 Lien supprimé de **{member}** dans {channel.mention}, timeout 1h appliqué.",
        )


async def setup(bot: commands.Bot):
    await bot.add_cog(AutoMod(bot))
