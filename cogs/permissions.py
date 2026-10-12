import discord
from discord import app_commands


class RoleNotAboveBot(app_commands.CheckFailure):
    """Levée quand l'auteur de la commande n'a pas un rôle plus haut que celui du bot."""


def role_above_bot():
    async def predicate(interaction: discord.Interaction) -> bool:
        if interaction.guild is None or not isinstance(interaction.user, discord.Member):
            raise RoleNotAboveBot

        if interaction.user.id == interaction.guild.owner_id:
            return True

        bot_member = interaction.guild.me
        if bot_member is None or interaction.user.top_role <= bot_member.top_role:
            raise RoleNotAboveBot

        return True

    return app_commands.check(predicate)


async def handle_role_not_above_bot(interaction: discord.Interaction, error: Exception) -> bool:
    if isinstance(error, RoleNotAboveBot):
        message = "Ton rôle doit être positionné au-dessus du rôle du bot pour utiliser cette commande."
        if interaction.response.is_done():
            await interaction.followup.send(message, ephemeral=True)
        else:
            await interaction.response.send_message(message, ephemeral=True)
        return True
    return False
