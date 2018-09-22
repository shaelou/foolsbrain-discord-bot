import { MessageReaction, User, Client, RichEmbed } from "discord.js";
import * as Utils from './Utils';
import * as Logger from './Logger';
import * as Constants from './Constants';

/**
 * Loads or creates a pinned message in the designated roles channel for the bot to manage reactions to add/remove roles
 * @param {Client} client
 */
export const initPinnedRoleMessages = (client) => {
    client.guilds.forEach((guild) => {
        const channel = Utils.getRoleChannel(guild);
        channel.fetchPinnedMessages().then((messages) => {
            const role_msg_exists = messages.some((message) => message.author.id === client.user.id && message.embeds.some((embed) => embed.title === Constants.ROLE_ASSIGN_MESSAGE_TITLE));
            if (!role_msg_exists) {
                const role_msg = new RichEmbed({
                    title: Constants.ROLE_ASSIGN_MESSAGE_TITLE,
                    description: "Click a reaction to add/remove yourself to a role"
                });

                channel.send(role_msg).then((message) => {
                    message.pin().catch((error) => {
                        Logger.error(error);
                    });

                    const emojis = Utils.getGameEmojis(guild);

                    emojis.forEach((emoji) => {
                        message.react(emoji);
                    });
                }).catch((error) => {
                    Logger.error(error);
                });
            }
        }).catch((error) => {
            Logger.error(error);
        });
    });
}

/**
 * Handles the event of a reaction on a message being added
 * @param {MessageReaction} message_reaction 
 * @param {User} user 
 */
export const handleMessageReactionAdded = (message_reaction, user) => {
    handleMessageReaction(message_reaction, user, true);
}

/**
 * Handles the event of a reaction on a message being removed
 * @param {MessageReaction} message_reaction 
 * @param {User} user 
 */
export const handleMessageReactionRemoved = (message_reaction, user) => {
    handleMessageReaction(message_reaction, user, false);
}

/**
 * Handles the event of a reaction on a message being added or removed
 * @param {MessageReaction} message_reaction 
 * @param {User} user 
 * @param {boolean} added 
 */
const handleMessageReaction = (message_reaction, user, added) => {
    if (user.bot) {
        return;
    }

    if (Utils.isRoleAssignMessage(message_reaction.message)) {
        handleRoleAssignMessageReaction(message_reaction, user, added);
    }
}

/**
 * Handles the event of a reaction on a message being added
 * @param {MessageReaction} message_reaction 
 * @param {User} user 
 * @param {boolean} added
 */
const handleRoleAssignMessageReaction = (message_reaction, user, added) => {
    const guild = Utils.getGuildFromMessage(message_reaction.message);

    const game_emojis = Utils.getGameEmojis(guild);
    const game_emoji = game_emojis.find(emoji => emoji.id === message_reaction.emoji.id);
    if (!game_emoji) {
        return;
    }

    const game_roles = Utils.getGameRoles(guild);
    const game_role = game_roles.find(role => game_emoji.name.toLowerCase() === role.name.toLowerCase());
    if (!game_role) {
        return;
    }

    const member = Utils.getGuildMember(guild, user);

    if (added) {
        member.addRole(game_role).then(() => {
            message_reaction.message.channel.send(`Added ${member} to role ${game_role.name}`).then((message) => {
                setTimeout(() => { message.delete() }, 2000);
            });
        }).catch((error) => {
            message_reaction.message.channel.send(`Failed to add role ${game_role.name}. ${error}`);
        });
    }
    else {
        member.removeRole(game_role).then(() => {
            message_reaction.message.channel.send(`Removed role ${game_role.name} for ${member}`).then((message) => {
                setTimeout(() => { message.delete() }, 2000);
            });
        }).catch((error) => {
            message_reaction.message.channel.send(`Failed to remove role ${game_role.name} for ${member}. ${error}`);
        });
    }
}
