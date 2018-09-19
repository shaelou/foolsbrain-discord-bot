import { MessageReaction, User } from "discord.js";
import * as Utils from './Utils';
import * as Logger from './Logger';

/**
 * 
 * @param {Collection<String, Guild>} guilds 
 */
export const initPinnedRoleMessages = (guilds) => {
    // TODO: fetch pinned role message or create it if not exists
    
    // const guild = client.guilds.first();
    // const channel = Utils.getRoleChannel(guild);
    // channel.fetchPinnedMessages().then((message) => {

    // }).catch((error) => {
    //     Logger.error(error);
    // });
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

    if (Utils.isNewMemberMessage(message_reaction.message)) {
        handleNewMemberMessageReaction(message_reaction, user, added);
    }
}

/**
 * Handles the event of a reaction on a message being added
 * @param {MessageReaction} message_reaction 
 * @param {User} user 
 * @param {boolean} added
 */
const handleNewMemberMessageReaction = (message_reaction, user, added) => {
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
