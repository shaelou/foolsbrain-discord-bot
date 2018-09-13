import { GuildMember } from "discord.js";
import * as Utils from './Utils';

/**
 * Handles the event of a member's presence updating
 * @param {GuildMember} old_member 
 * @param {GuildMember} new_member 
 */
export const handlePresenceUpdated = (old_member, new_member) => {
    // when a guild member is added it also triggers a presence update of offline to online
    if (Utils.isNewMember(old_member)) {
        return;
    }

    if (old_member.presence.status === 'offline' && new_member.presence.status === 'online') {
        const channel = Utils.getDefaultChannel(new_member.guild);
        channel.send(`Welcome back from being ${old_member.presence.status} ${new_member}`);
    }
}