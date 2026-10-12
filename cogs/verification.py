import io
import logging
import random
import string
import time

import discord
from discord import app_commands
from discord.ext import commands
from PIL import Image, ImageDraw, ImageFont

from config import VERIFICATION_CHANNEL_ID, VERIFIED_ROLE_ID
from cogs.permissions import handle_role_not_above_bot, role_above_bot

logger = logging.getLogger("deepwoken-bot.verification")

CAPTCHA_CHARS = "".join(c for c in string.ascii_uppercase + "23456789" if c not in "OI01")
CAPTCHA_LENGTH = 6
CAPTCHA_TTL = 300
MAX_ATTEMPTS = 3

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "DejaVuSans-Bold.ttf",
]


def _load_font(size: int) -> ImageFont.ImageFont:
    for path in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def generate_captcha_code() -> str:
    return "".join(random.choices(CAPTCHA_CHARS, k=CAPTCHA_LENGTH))


def render_captcha_image(code: str) -> io.BytesIO:
    width, height = 260, 100
    image = Image.new("RGB", (width, height), (30, 30, 35))
    draw = ImageDraw.Draw(image)

    for _ in range(6):
        start = (random.randint(0, width), random.randint(0, height))
        end = (random.randint(0, width), random.randint(0, height))
        color = tuple(random.randint(60, 110) for _ in range(3))
        draw.line([start, end], fill=color, width=2)

    font = _load_font(44)
    x = 15
    for char in code:
        char_img = Image.new("RGBA", (48, 70), (0, 0, 0, 0))
        char_draw = ImageDraw.Draw(char_img)
        color = tuple(random.randint(190, 255) for _ in range(3))
        char_draw.text((4, 4), char, font=font, fill=color)
        char_img = char_img.rotate(random.randint(-25, 25), expand=True)
        y = random.randint(5, 25)
        image.paste(char_img, (x, y), char_img)
        x += 38

    for _ in range(100):
        point = (random.randint(0, width - 1), random.randint(0, height - 1))
        draw.point(point, fill=tuple(random.randint(80, 150) for _ in range(3)))

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


class CaptchaModal(discord.ui.Modal, title="Vérification"):
    code_input = discord.ui.TextInput(
        label="Code affiché sur l'image", min_length=CAPTCHA_LENGTH, max_length=10
    )

    def __init__(self, cog: "Verification"):
        super().__init__()
        self.cog = cog

    async def on_submit(self, interaction: discord.Interaction):
        await self.cog.check_captcha(interaction, self.code_input.value)


class CaptchaView(discord.ui.View):
    def __init__(self, cog: "Verification", user_id: int):
        super().__init__(timeout=CAPTCHA_TTL)
        self.cog = cog
        self.user_id = user_id

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.user_id:
            await interaction.response.send_message("Ce captcha n'est pas pour toi.", ephemeral=True)
            return False
        return True

    @discord.ui.button(label="Entrer le code", style=discord.ButtonStyle.primary)
    async def enter_code(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(CaptchaModal(self.cog))

    @discord.ui.button(label="Nouveau code", style=discord.ButtonStyle.secondary)
    async def refresh(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.cog.start_captcha(interaction, edit=True)


class VerifyView(discord.ui.View):
    def __init__(self, cog: "Verification"):
        super().__init__(timeout=None)
        self.cog = cog

    @discord.ui.button(
        label="Je me vérifie",
        style=discord.ButtonStyle.success,
        custom_id="deepwoken_verify_button",
    )
    async def verify(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.cog.start_captcha(interaction)


class Verification(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.pending: dict[int, dict] = {}

    @commands.Cog.listener()
    async def on_ready(self):
        self.bot.add_view(VerifyView(self))

    async def cog_app_command_error(
        self, interaction: discord.Interaction, error: app_commands.AppCommandError
    ):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message(
                "Tu n'as pas la permission d'utiliser cette commande.", ephemeral=True
            )
            return
        if await handle_role_not_above_bot(interaction, error):
            return
        logger.exception("Erreur dans une commande de vérification", exc_info=error)
        message = "Une erreur est survenue."
        if interaction.response.is_done():
            await interaction.followup.send(message, ephemeral=True)
        else:
            await interaction.response.send_message(message, ephemeral=True)

    async def start_captcha(self, interaction: discord.Interaction, edit: bool = False):
        if interaction.guild is None:
            return

        role = interaction.guild.get_role(VERIFIED_ROLE_ID) if VERIFIED_ROLE_ID else None
        if role and role in interaction.user.roles:
            content = "Tu es déjà vérifié !"
            if edit:
                await interaction.response.edit_message(content=content, attachments=[], view=None)
            else:
                await interaction.response.send_message(content, ephemeral=True)
            return

        code = generate_captcha_code()
        self.pending[interaction.user.id] = {
            "code": code,
            "attempts": 0,
            "expires": time.time() + CAPTCHA_TTL,
        }

        buffer = render_captcha_image(code)
        file = discord.File(buffer, filename="captcha.png")
        view = CaptchaView(self, interaction.user.id)
        content = (
            "Recopie le code affiché sur l'image (majuscule/minuscule indifférent), "
            "puis clique \"Entrer le code\"."
        )
        if edit:
            buffer2 = render_captcha_image(code)
            await interaction.response.edit_message(
                content=content, attachments=[discord.File(buffer2, filename="captcha.png")], view=view
            )
        else:
            await interaction.response.send_message(
                content=content, file=file, view=view, ephemeral=True
            )

    async def check_captcha(self, interaction: discord.Interaction, answer: str):
        pending = self.pending.get(interaction.user.id)
        if not pending or time.time() > pending["expires"]:
            self.pending.pop(interaction.user.id, None)
            await interaction.response.send_message(
                "Ton captcha a expiré, reclique sur \"Je me vérifie\".", ephemeral=True
            )
            return

        if answer.strip().upper() != pending["code"]:
            pending["attempts"] += 1
            if pending["attempts"] >= MAX_ATTEMPTS:
                self.pending.pop(interaction.user.id, None)
                await interaction.response.send_message(
                    "Trop d'essais incorrects. Reclique sur \"Je me vérifie\" pour réessayer.",
                    ephemeral=True,
                )
                return
            await interaction.response.send_message(
                f"Code incorrect ({pending['attempts']}/{MAX_ATTEMPTS} essais). "
                "Utilise \"Entrer le code\" pour réessayer, ou \"Nouveau code\".",
                ephemeral=True,
            )
            return

        if interaction.guild is None:
            return
        role = interaction.guild.get_role(VERIFIED_ROLE_ID)
        if role is None:
            await interaction.response.send_message(
                "Le rôle de vérification n'est pas configuré. Préviens un administrateur.",
                ephemeral=True,
            )
            return

        try:
            await interaction.user.add_roles(role, reason="Vérification par captcha")
        except discord.Forbidden:
            await interaction.response.send_message(
                "Je n'ai pas la permission de t'attribuer ce rôle. Préviens un administrateur.",
                ephemeral=True,
            )
            return

        self.pending.pop(interaction.user.id, None)
        await interaction.response.send_message(
            "Vérification réussie, bienvenue sur le serveur !", ephemeral=True
        )

    @app_commands.command(
        name="setup-verification",
        description="Poste le message de vérification dans ce salon.",
    )
    @app_commands.checks.has_permissions(administrator=True)
    @role_above_bot()
    async def setup_verification(self, interaction: discord.Interaction):
        if VERIFICATION_CHANNEL_ID and interaction.channel_id != VERIFICATION_CHANNEL_ID:
            await interaction.response.send_message(
                "Cette commande doit être utilisée dans le salon de vérification configuré.",
                ephemeral=True,
            )
            return

        embed = discord.Embed(
            title="Vérification",
            description=(
                "Clique sur le bouton ci-dessous, recopie le code du captcha qui s'affiche, "
                "et débloque l'accès au reste du serveur."
            ),
            color=discord.Color.green(),
        )
        await interaction.channel.send(embed=embed, view=VerifyView(self))
        await interaction.response.send_message("Message de vérification posté.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Verification(bot))
