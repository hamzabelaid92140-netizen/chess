import json
import logging
from datetime import timedelta
from pathlib import Path

import discord
from discord import app_commands
from discord.ext import commands

from config import MOD_LOG_CHANNEL_ID
from cogs.permissions import handle_role_not_above_bot, role_above_bot

logger = logging.getLogger("deepwoken-bot.moderation")

WARNINGS_FILE = Path(__file__).resolve().parent.parent / "data" / "warnings.json"


def _load_warnings() -> dict:
    if not WARNINGS_FILE.exists():
        return {}
    return json.loads(WARNINGS_FILE.read_text(encoding="utf-8"))


def _save_warnings(data: dict) -> None:
    WARNINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    WARNINGS_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


class Moderation(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

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
        logger.exception("Erreur dans une commande de modération", exc_info=error)
        message = "Une erreur est survenue."
        if interaction.response.is_done():
            await interaction.followup.send(message, ephemeral=True)
        else:
            await interaction.response.send_message(message, ephemeral=True)

    async def _log(self, guild: discord.Guild, message: str):
        if not MOD_LOG_CHANNEL_ID:
            return
        channel = guild.get_channel(MOD_LOG_CHANNEL_ID)
        if channel:
            try:
                await channel.send(message)
            except discord.HTTPException:
                logger.exception("Échec de l'envoi dans le salon de logs de modération")

    @app_commands.command(name="kick", description="Expulse un membre du serveur.")
    @app_commands.describe(member="Le membre à expulser", reason="Raison de l'expulsion")
    @app_commands.checks.has_permissions(kick_members=True)
    @role_above_bot()
    async def kick(
        self,
        interaction: discord.Interaction,
        member: discord.Member,
        reason: str = "Non spécifiée",
    ):
        try:
            await member.kick(reason=f"{reason} (par {interaction.user})")
        except discord.Forbidden:
            await interaction.response.send_message(
                "Je n'ai pas la permission d'expulser ce membre.", ephemeral=True
            )
            return
        await interaction.response.send_message(f"{member.mention} a été expulsé. Raison : {reason}")
        await self._log(interaction.guild, f"👢 **{member}** expulsé par {interaction.user} — {reason}")

    @app_commands.command(name="ban", description="Bannit un membre du serveur.")
    @app_commands.describe(member="Le membre à bannir", reason="Raison du bannissement")
    @app_commands.checks.has_permissions(ban_members=True)
    @role_above_bot()
    async def ban(
        self,
        interaction: discord.Interaction,
        member: discord.Member,
        reason: str = "Non spécifiée",
    ):
        try:
            await member.ban(reason=f"{reason} (par {interaction.user})", delete_message_seconds=0)
        except discord.Forbidden:
            await interaction.response.send_message(
                "Je n'ai pas la permission de bannir ce membre.", ephemeral=True
            )
            return
        await interaction.response.send_message(f"{member.mention} a été banni. Raison : {reason}")
        await self._log(interaction.guild, f"🔨 **{member}** banni par {interaction.user} — {reason}")

    @app_commands.command(name="unban", description="Débannit un utilisateur via son ID Discord.")
    @app_commands.describe(user_id="L'ID Discord de l'utilisateur à débannir")
    @app_commands.checks.has_permissions(ban_members=True)
    @role_above_bot()
    async def unban(self, interaction: discord.Interaction, user_id: str):
        try:
            user = discord.Object(id=int(user_id))
        except ValueError:
            await interaction.response.send_message("ID invalide.", ephemeral=True)
            return

        try:
            await interaction.guild.unban(user)
        except discord.NotFound:
            await interaction.response.send_message("Cet utilisateur n'est pas banni.", ephemeral=True)
            return
        except discord.Forbidden:
            await interaction.response.send_message(
                "Je n'ai pas la permission de débannir.", ephemeral=True
            )
            return

        await interaction.response.send_message(f"Utilisateur `{user_id}` débanni.")
        await self._log(interaction.guild, f"🔓 `{user_id}` débanni par {interaction.user}")

    @app_commands.command(name="mute", description="Rend un membre muet temporairement.")
    @app_commands.describe(
        member="Le membre à rendre muet",
        minutes="Durée en minutes (max 40320, soit 28 jours)",
        reason="Raison du mute",
    )
    @app_commands.checks.has_permissions(moderate_members=True)
    @role_above_bot()
    async def mute(
        self,
        interaction: discord.Interaction,
        member: discord.Member,
        minutes: app_commands.Range[int, 1, 40320],
        reason: str = "Non spécifiée",
    ):
        try:
            await member.timeout(timedelta(minutes=minutes), reason=f"{reason} (par {interaction.user})")
        except discord.Forbidden:
            await interaction.response.send_message(
                "Je n'ai pas la permission de mute ce membre.", ephemeral=True
            )
            return
        await interaction.response.send_message(
            f"{member.mention} est muet pour {minutes} minute(s). Raison : {reason}"
        )
        await self._log(
            interaction.guild, f"🔇 **{member}** muet {minutes} min par {interaction.user} — {reason}"
        )

    @app_commands.command(name="unmute", description="Retire le mute d'un membre.")
    @app_commands.describe(member="Le membre à démuter")
    @app_commands.checks.has_permissions(moderate_members=True)
    @role_above_bot()
    async def unmute(self, interaction: discord.Interaction, member: discord.Member):
        try:
            await member.timeout(None, reason=f"Unmute par {interaction.user}")
        except discord.Forbidden:
            await interaction.response.send_message("Je n'ai pas la permission.", ephemeral=True)
            return
        await interaction.response.send_message(f"{member.mention} n'est plus muet.")
        await self._log(interaction.guild, f"🔊 **{member}** démuté par {interaction.user}")

    @app_commands.command(name="warn", description="Donne un avertissement à un membre.")
    @app_commands.describe(member="Le membre à avertir", reason="Raison de l'avertissement")
    @app_commands.checks.has_permissions(moderate_members=True)
    @role_above_bot()
    async def warn(self, interaction: discord.Interaction, member: discord.Member, reason: str):
        data = _load_warnings()
        guild_warnings = data.setdefault(str(interaction.guild_id), {})
        user_warnings = guild_warnings.setdefault(str(member.id), [])
        user_warnings.append(
            {
                "reason": reason,
                "by": str(interaction.user),
                "at": discord.utils.utcnow().isoformat(),
            }
        )
        _save_warnings(data)

        await interaction.response.send_message(
            f"{member.mention} a reçu un avertissement ({len(user_warnings)} au total). Raison : {reason}"
        )
        await self._log(interaction.guild, f"⚠️ **{member}** averti par {interaction.user} — {reason}")
        try:
            await member.send(f"Tu as reçu un avertissement sur **{interaction.guild.name}** : {reason}")
        except discord.Forbidden:
            pass

    @app_commands.command(name="warnings", description="Liste les avertissements d'un membre.")
    @app_commands.describe(member="Le membre dont on veut voir les avertissements")
    @app_commands.checks.has_permissions(moderate_members=True)
    @role_above_bot()
    async def warnings(self, interaction: discord.Interaction, member: discord.Member):
        data = _load_warnings()
        user_warnings = data.get(str(interaction.guild_id), {}).get(str(member.id), [])
        if not user_warnings:
            await interaction.response.send_message(
                f"{member.mention} n'a aucun avertissement.", ephemeral=True
            )
            return
        lines = [
            f"{i + 1}. {w['reason']} (par {w['by']}, {w['at'][:10]})"
            for i, w in enumerate(user_warnings)
        ]
        await interaction.response.send_message(
            f"Avertissements de {member.mention} :\n" + "\n".join(lines), ephemeral=True
        )

    @app_commands.command(name="clear", description="Supprime des messages récents dans ce salon.")
    @app_commands.describe(amount="Nombre de messages à supprimer (max 100)")
    @app_commands.checks.has_permissions(manage_messages=True)
    @role_above_bot()
    async def clear(self, interaction: discord.Interaction, amount: app_commands.Range[int, 1, 100]):
        await interaction.response.defer(ephemeral=True)
        deleted = await interaction.channel.purge(limit=amount)
        await interaction.followup.send(f"{len(deleted)} message(s) supprimé(s).", ephemeral=True)
        await self._log(
            interaction.guild,
            f"🧹 {len(deleted)} messages supprimés par {interaction.user} dans {interaction.channel.mention}",
        )


async def setup(bot: commands.Bot):
    await bot.add_cog(Moderation(bot))
