import { Message, RichEmbed } from "discord.js";
import * as Utils from './Utils';
import * as Constants from './Constants';
import * as Logger from './Logger';

/**
 * Audit when a message is deleted
 * @param {Message} message 
 */
export const onMessageDeleted = (message) => {
    const audit_message = new RichEmbed({
        title: Constants.MESSAGE_DELETED_MESSAGE_TITLE,
        description: message.content,
        timestamp: new Date(),
        color: Constants.DARK_RED
    });

    audit_message.addField("Author", message.author, true);
    audit_message.addField("Channel", message.channel, true);

    const auditChannel = Utils.getAuditChannel(message.guild);
    auditChannel.send(audit_message).catch((error) => {
        Logger.error(error);
    });
};

/**
 * Audit when a member is removed from a guild
 * @param {GuildMember} member 
 */
export const onGuildMemberRemoved = (member) => {
    const removed_message = new RichEmbed({
        title: Constants.GUILD_MEMBER_REMOVED_MESSAGE_TITLE,
        description: `${member} has been removed from the guild`,
        timestamp: new Date(),
        color: Constants.DARK_RED
    });

    const auditChannel = Utils.getAuditChannel(member.guild);
    auditChannel.send(removed_message).catch((error) => {
        Logger.error(error);
    });
};

/**
 * Audit when a user is banned from a guild
 * @param {Guild} guild 
 * @param {User} user 
 */
export const onUserBanned = (guild, user) => {
    const banned_message = new RichEmbed({
        title: Constants.USER_BANNED_MESSAGE_TITLE,
        description: `${user} has been banned from the guild`,
        timestamp: new Date(),
        color: Constants.DARK_RED
    });

    const auditChannel = Utils.getAuditChannel(guild);
    auditChannel.send(banned_message).catch((error) => {
        Logger.error(error);
    });
};