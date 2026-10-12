import logging

import discord
from discord import app_commands
from discord.ext import commands

from config import VERIFICATION_CHANNEL_ID, VERIFIED_ROLE_ID

logger = logging.getLogger("deepwoken-bot.verification")


class VerifyView(discord.ui.View):
    """Vue persistante attachée au message de vérification."""

    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="Je me vérifie",
        style=discord.ButtonStyle.success,
        custom_id="deepwoken_verify_button",
    )
    async def verify(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.guild is None:
            return

        role = interaction.guild.get_role(VERIFIED_ROLE_ID)
        if role is None:
            await interaction.response.send_message(
                "Le rôle de vérification n'est pas configuré. Préviens un administrateur.",
                ephemeral=True,
            )
            return

        member = interaction.user
        if role in member.roles:
            await interaction.response.send_message("Tu es déjà vérifié !", ephemeral=True)
            return

        try:
            await member.add_roles(role, reason="Vérification via le salon de vérification")
        except discord.Forbidden:
            await interaction.response.send_message(
                "Je n'ai pas la permission de t'attribuer ce rôle. Préviens un administrateur.",
                ephemeral=True,
            )
            return

        await interaction.response.send_message(
            "Vérification réussie, bienvenue sur le serveur !", ephemeral=True
        )


class Verification(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        self.bot.add_view(VerifyView())

    @app_commands.command(
        name="setup-verification",
        description="Poste le message de vérification dans ce salon.",
    )
    @app_commands.checks.has_permissions(administrator=True)
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
                "Clique sur le bouton ci-dessous pour te vérifier et débloquer "
                "l'accès au reste du serveur."
            ),
            color=discord.Color.green(),
        )
        await interaction.channel.send(embed=embed, view=VerifyView())
        await interaction.response.send_message("Message de vérification posté.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Verification(bot))
