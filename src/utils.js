import { Guild, Collection, Role, Emoji, GuildChannel, Message, Client, User } from "discord.js";
import Config from './config';

/**
 * Get a collection of game roles for a guild
 * @param {Guild} guild 
 * @returns {Collection<String, Role}
 */
export const getGameRoles = (guild) => {
    return guild.roles.filter(role => role.hexColor === Config.game_role_hex_color);
}

/**
 * Get a collection of emojis for game roles of a guild
 * @param {Guild} guild 
 * @returns {Collection<String, Emoji}
 */
export const getGameEmojis = (guild) => {
    const game_roles = getGameRoles(guild);
    const game_role_names = game_roles.map(role => role.name.toLowerCase());

    return guild.emojis.filter(emoji => game_role_names.indexOf(emoji.name.toLowerCase()) > -1);
}

/**
 * Get the default channel of a guild
 * @param {Guild} guild 
 * @returns {GuildChannel}
 */
export const getDefaultChannel = (guild) => {
    return guild.channels.find(channel => channel.name.toLowerCase() === Config.default_channel);
}

/**
 * Get the welcome channel of a guild
 * @param {Guild} guild 
 * @returns {GuildChannel}
 */
export const getWelcomeChannel = (guild) => {
    let welcome_channel = guild.channels.find(channel => channel.name.toLowerCase() === Config.welcome_channel);

    if (!welcome_channel) {
        welcome_channel = getDefaultChannel(guild);
    }

    return welcome_channel;
}

/**
 * Get the guild from a message or its author
 * @param {Message} message 
 * @returns {Guild}
 */
export const getGuildFromMessage = (message) => {
    let guild = message.guild;

    // if empty, find the first guild that the author of the message is in that the bot services
    if (!guild) {
        guild = message.client.guilds.find(g => getGuildMember(g, message.author));
    }

    return guild;
}

/**
 * Get the guild member by a user id
 * @param {Guild} guild 
 * @param {User} user 
 */
export const getGuildMember = (guild, user) => {
    return guild.members.find(member => member.user.id === user.id);
}