import Discord, { Guild, Collection, GuildMember, Invite, Client } from "discord.js";
import * as Utils from './Utils';
import * as Constants from './Constants';
import * as Logger from './Logger';

/**
 * A collection of guilds and their invites
 * @type {Collection<String, Collection<String, Invite>}
 */
const invites = new Collection(); // TODO: refactor to only retain minimal data necessary if this creates memory issues

/**
 * Schedule a task to update the invites for each guild every so often
 * @param {Client} client
 */
export const initRefreshInviteTask = (client) => {
    // refresh once to initialize
    refreshInvites(client.guilds);

    const one_minute_in_ms = 60 * 1000;

    setInterval(() => {
        refreshInvites(client.guilds);
    }, 5 * one_minute_in_ms);
};

/**
 * Update the invites for each guild
 * @param {Collection<String, Guild>} guilds 
 */
export const refreshInvites = (guilds) => {
    Logger.log(`Refreshing invites for guild(s): ${guilds.map(g => g.name).join(', ')}`);

    guilds.forEach(guild => {
        guild.fetchInvites().then((fetched_invites) => {
            invites.set(guild.id, fetched_invites);
        }).catch((error) => {
            Logger.error(error);
        });
    });
};

/**
 * Handles when a new member is added to a guild
 * @param {GuildMember} member 
 */
export const handleGuildMemberAdded = (member) => {
    member.guild.fetchInvites().then((fetched_invites) => {
        const previous_invites = invites.get(member.guild.id);
        const invite = fetched_invites.find(i => previous_invites && previous_invites.get(i.code).uses < i.uses);
        const recruiter = member.guild.members.find(m => invite && m.user.id === invite.inviter.id);

        invites.set(member.guild.id, fetched_invites);

        const welcome_channel = Utils.getWelcomeChannel(member.guild);

        const welcome_message = new Discord.RichEmbed()
            .setTitle(Constants.GUILD_MEMBER_WELCOME_MESSAGE_TITLE)
            .setDescription(`${member} has joined the guild`)
            .setThumbnail(member.user.displayAvatarURL)
            .addField('Recruited by', recruiter ? recruiter : "Unknown")
            .setTimestamp();

        welcome_channel.send(welcome_message).catch((error) => {
            Logger.error(error);
        });
    }).catch((error) => {
        Logger.error(error);
    });
};

/**
 * Handles when an existing member is removed from a guild
 * @param {GuildMember} member 
 */
export const handleGuildMemberRemoved = (member) => {
    const guilds = new Collection([[member.guild.id, member.guild]]);
    refreshInvites(guilds);
};