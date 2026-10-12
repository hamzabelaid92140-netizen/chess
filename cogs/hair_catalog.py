import json
import logging
import random
import re
from pathlib import Path

import aiohttp
import discord
from discord.ext import commands, tasks

from config import HAIR_ID_CHANNEL_ID, VERIFIED_ROLE_ID

logger = logging.getLogger("deepwoken-bot.hair_catalog")

ID_PATTERN = re.compile(r"\d{4,15}")
THUMBNAIL_URL = "https://thumbnails.roblox.com/v1/assets"
CATALOG_SEARCH_URL = "https://catalog.roblox.com/v1/search/items/details"
# Category 11 = Accessories, Subcategory 20 = Hair Accessories. Ces IDs
# viennent du forum développeurs Roblox (pas de doc officielle à jour) :
# si l'auto-post ne trouve plus rien, c'est probablement eux qui ont changé.
CATALOG_PARAMS = {"Category": 11, "Subcategory": 20, "SortType": 3, "Limit": 30}
POSTED_FILE = Path(__file__).resolve().parent.parent / "data" / "posted_hair_ids.json"


async def fetch_asset_thumbnail(session: aiohttp.ClientSession, asset_id: str) -> str | None:
    params = {"assetIds": asset_id, "size": "420x420", "format": "Png", "isCircular": "false"}
    async with session.get(THUMBNAIL_URL, params=params) as resp:
        if resp.status != 200:
            return None
        data = await resp.json()
        items = data.get("data") or []
        if not items or items[0].get("state") != "Completed":
            return None
        return items[0].get("imageUrl")


class HairCatalog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.session: aiohttp.ClientSession | None = None
        POSTED_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not POSTED_FILE.exists():
            POSTED_FILE.write_text("[]", encoding="utf-8")
        self.auto_post.start()

    def cog_unload(self):
        self.auto_post.cancel()

    async def _get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session

    def _load_posted(self) -> list:
        return json.loads(POSTED_FILE.read_text(encoding="utf-8"))

    def _save_posted(self, ids: list) -> None:
        POSTED_FILE.write_text(json.dumps(ids, indent=2), encoding="utf-8")

    @commands.Cog.listener()
    async def on_thread_create(self, thread: discord.Thread):
        if not HAIR_ID_CHANNEL_ID or thread.parent_id != HAIR_ID_CHANNEL_ID:
            return

        if VERIFIED_ROLE_ID and isinstance(thread.owner, discord.Member):
            role = thread.guild.get_role(VERIFIED_ROLE_ID)
            if role and role not in thread.owner.roles:
                await thread.send(
                    "Tu dois d'abord te vérifier dans le salon de vérification avant de poster ici."
                )
                await thread.edit(archived=True, locked=True)
                return

        try:
            starter = thread.starter_message or await thread.fetch_message(thread.id)
        except (discord.NotFound, discord.HTTPException):
            starter = None

        content = starter.content if starter else ""
        ids = ID_PATTERN.findall(content)
        if not ids:
            await thread.send(
                "Je n'ai trouvé aucun ID Roblox dans ton post (uniquement des chiffres, "
                "4 à 15 caractères). Édite ton message avec l'ID du hair cut."
            )
            return

        session = await self._get_session()
        for asset_id in ids:
            image_url = await fetch_asset_thumbnail(session, asset_id)
            if not image_url:
                await thread.send(f"Impossible de récupérer une image pour l'ID `{asset_id}`.")
                continue
            embed = discord.Embed(title=f"Hair cut #{asset_id}")
            embed.set_image(url=image_url)
            await thread.send(embed=embed)

    @tasks.loop(minutes=1)
    async def auto_post(self):
        if not HAIR_ID_CHANNEL_ID:
            return
        channel = self.bot.get_channel(HAIR_ID_CHANNEL_ID)
        if not isinstance(channel, discord.ForumChannel):
            return

        session = await self._get_session()
        try:
            async with session.get(CATALOG_SEARCH_URL, params=CATALOG_PARAMS) as resp:
                if resp.status != 200:
                    logger.warning(
                        "Catalogue Roblox : réponse %s, cycle d'auto-post ignoré", resp.status
                    )
                    return
                data = await resp.json()
        except aiohttp.ClientError:
            logger.exception("Erreur réseau en interrogeant le catalogue Roblox")
            return

        items = data.get("data") or []
        if not items:
            return

        posted = self._load_posted()
        candidates = [item for item in items if str(item.get("id")) not in posted]
        if not candidates:
            candidates = items
            posted = []

        item = random.choice(candidates)
        asset_id = str(item.get("id"))
        name = item.get("name") or f"Hair cut #{asset_id}"

        image_url = await fetch_asset_thumbnail(session, asset_id)
        if not image_url:
            return

        embed = discord.Embed(title=name, description=f"ID : `{asset_id}`")
        embed.set_image(url=image_url)
        try:
            await channel.create_thread(name=name[:100], embed=embed)
        except discord.HTTPException:
            logger.exception("Échec de la création du post pour l'ID %s", asset_id)
            return

        posted.append(asset_id)
        self._save_posted(posted[-500:])

    @auto_post.before_loop
    async def before_auto_post(self):
        await self.bot.wait_until_ready()


async def setup(bot: commands.Bot):
    await bot.add_cog(HairCatalog(bot))
