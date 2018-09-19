import { Guild, Collection, Role, Emoji, GuildChannel, Message, User, GuildMember, TextChannel } from "discord.js";
import Config from './Config';
import * as Constants from './Constants';

/**
 * Get a collection of game roles for a guild
 * @param {Guild} guild 
 * @returns {Collection<String, Role}
 */
export const getGameRoles = (guild) => {
    return guild.roles.filter(role => role.hexColor === Config.game_role_hex_color);
}

/**
 * Get a collection of rank roles for a guild
 * @param {Guild} guild 
 * @returns {Collection<String, Role}
 */
export const getRanks = (guild) => {
    return guild.roles.filter(role => role.hexColor != Config.game_role_hex_color);
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
 * @returns {TextChannel}
 */
export const getWelcomeChannel = (guild) => {
    let channel = guild.channels.find(channel => channel.name.toLowerCase() === Config.welcome_channel);

    if (!channel) {
        channel = getDefaultChannel(guild);
    }

    return channel;
}

/**
 * Get the role channel of a guild
 * @param {Guild} guild 
 * @returns {TextChannel}
 */
export const getRoleChannel = (guild) => {
    let channel = guild.channels.find(channel => channel.name.toLowerCase() === Config.role_channel);

    if (!channel) {
        channel = getDefaultChannel(guild);
    }

    return channel;
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
 * 
 * @param {User} user 
 * @returns {Collection<String, Guild>}
 */
export const getGuildsFromUser = (user) => {
    return user.client.guilds.filter(guild => getGuildMember(guild, user));
};

/**
 * Get the guild member by a user id
 * @param {Guild} guild 
 * @param {User} user 
 */
export const getGuildMember = (guild, user) => {
    return guild.members.find(member => member.user.id === user.id);
}

/**
 * Get a random integer in a range
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check whether or not a message is the new user message
 * @param {Message} message 
 * @returns {boolean}
 */
export const isNewMemberMessage = (message) => {
    return message.embeds.findIndex(embed => embed.title === Constants.GUILD_MEMBER_WELCOME_MESSAGE_TITLE) > -1;
}

/**
 * Check whether or not a message is the role assign message
 * @param {Message} message 
 * @returns {boolean}
 */
export const isRoleAssignMessage = (message) => {
    return message.embeds.findIndex(embed => embed.title === Constants.ROLE_ASSIGN_MESSAGE_TITLE) > -1;
}

/**
 * Check whether or not a user has recently joined the guild
 * @param {GuildMember} member 
 */
export const isNewMember = (member) => {
    return new Date().getUTCDate() < member.joinedAt.getUTCDate().setMinutes(member.joinedAt.getMinutes() + 5);
}