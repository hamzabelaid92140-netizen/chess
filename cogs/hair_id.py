import json
import logging
import re
from pathlib import Path

import discord
from discord.ext import commands

from config import HAIR_ID_CHANNEL_ID, VERIFIED_ROLE_ID

logger = logging.getLogger("deepwoken-bot.hair_id")

ID_PATTERN = re.compile(r"^\d{4,15}$")
DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "hair_ids.json"


class HairId(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not DATA_FILE.exists():
            DATA_FILE.write_text("[]", encoding="utf-8")

    def _load(self) -> list:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))

    def _save(self, entries: list) -> None:
        DATA_FILE.write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf-8")

    async def _reject(self, message: discord.Message, reason: str) -> None:
        await message.delete()
        try:
            await message.author.send(reason)
        except discord.Forbidden:
            pass

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or message.guild is None:
            return
        if not HAIR_ID_CHANNEL_ID or message.channel.id != HAIR_ID_CHANNEL_ID:
            return

        if VERIFIED_ROLE_ID:
            role = message.guild.get_role(VERIFIED_ROLE_ID)
            if role and role not in message.author.roles:
                await self._reject(
                    message,
                    "Tu dois d'abord te vérifier dans le salon de vérification "
                    "avant de soumettre ton ID.",
                )
                return

        content = message.content.strip()
        if not ID_PATTERN.fullmatch(content):
            await self._reject(
                message,
                "Ton message a été supprimé : envoie uniquement ton ID "
                "(uniquement des chiffres, entre 4 et 15 caractères) dans ce salon.",
            )
            return

        entries = self._load()
        entries.append(
            {
                "user_id": message.author.id,
                "username": str(message.author),
                "hair_id": content,
                "message_id": message.id,
                "timestamp": message.created_at.isoformat(),
            }
        )
        self._save(entries)
        await message.add_reaction("✅")


async def setup(bot: commands.Bot):
    await bot.add_cog(HairId(bot))
