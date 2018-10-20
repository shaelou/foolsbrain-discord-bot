import { RichEmbed, Message } from "discord.js";
import Config from './Config';
import Commands from './Commands';
import * as Utils from './Utils';
import * as GuildMemberService from './GuildMemberService';
import * as Logger from './Logger';
import * as Constants from './Constants';

/**
 * Get command arguments from a message
 * @param {Message} message 
 */
const getArgs = (message) => {
    const args = message.content.slice(Config.command_prefix.length).trim().split(' ');
    args.shift(); // remove command from args
    return args;
}

/**
 * Get a command from a message
 * @param {Message} message 
 */
const getCommand = (message) => {
    return message.content.slice(Config.command_prefix.length).trim().split(' ').shift().toLowerCase();
}

/**
 * Handles command messages
 * @param {Message} message 
 */
export const handleCommand = (message) => {
    if (message.author.bot) {
        return;
    }

    const command = getCommand(message);

    Logger.log(`${message.author.tag} used '${command}' command in ${message.channel.name}`);

    switch (command) {
        case Commands.help.name: {
            handleHelpCommand(message);
            break;
        }

        case Commands.ping.name: {
            handlePingCommand(message);
            break;
        }

        case Commands.roll.name: {
            handleRollCommand(message);
            break;
        }

        case Commands.ranks.name: {
            handleRanksCommand(message);
            break;
        }

        case Commands.roles.name: {
            handleRolesCommand(message);
            break;
        }

        case Commands.emojis.name: {
            handleEmojisCommand(message);
            break;
        }

        case Commands.invites.name: {
            handleInvitesCommand(message);
            break;
        }

        case Commands.addrole.name: {
            handleAddRoleCommand(message);
            break;
        }

        case Commands.removerole.name: {
            handleRemoveRoleCommand(message);
            break;
        }

        default: {
            handleUnrecognizedCommand(message);
            break;
        }
    }
}

/**
 * Handles an unrecognized command
 * @param {Message} message 
 */
const handleUnrecognizedCommand = (message) => {
    const command = getCommand(message);

    const invalid_cmd_msg = new RichEmbed({
        title: "Invalid Command",
        description: `'${command}' is not a valid command. See '${Config.command_prefix}help'.`
    });

    const similar_commands = Utils.getSimilarCommands(command);
    if (similar_commands.length > 0) {
        invalid_cmd_msg.addField("The most similar commands are", similar_commands.join(", "));
    }

    message.channel.send(invalid_cmd_msg).catch((error) => {
        Logger.error(error);
    });
}

/**
 * Handles the help command
 * @param {Message} message 
 */
const handleHelpCommand = (message) => {
    const help_message = new RichEmbed({ title: "Commands Available" });

    for (const key in Commands) {
        if (Commands.hasOwnProperty(key)) {
            help_message.addField(`${Config.command_prefix}${Commands[key].name}`, Commands[key].description)
        }
    }

    message.author.send(help_message).catch((error) => {
        Logger.error(error);
    });
}

/**
 * Handles the ping command
 * @param {Message} message 
 */
const handlePingCommand = (message) => {
    const pinging_msg = new RichEmbed({ title: 'Pinging', description: '...' });
    message.channel.send(pinging_msg).then((ping_message) => {
        const ping_time = Date.now() - ping_message.createdTimestamp;
        const ping_color = ping_time <= 300 ? Constants.GREEN : ping_time >= 500 ? Constants.DARK_RED : Constants.YELLOW;
        const pinged_msg = new RichEmbed({ title: 'Ping', description: `${Date.now() - ping_message.createdTimestamp}ms`, color: ping_color });
        ping_message.edit(pinged_msg).catch((error) => {
            Logger.error(error);
        });
    }).catch((error) => {
        Logger.error(error);
    });
}

/**
 * Handles the roll command
 * @param {Message} message 
 */
const handleRollCommand = (message) => {
    // TODO: parse user input min/max
    const min = 1;
    const max = 100;
    const rolled_number = Utils.getRandomInt(min, max);

    const msg = new RichEmbed({ title: 'Roll', description: `${message.author} rolled a ${rolled_number} out of ${max}` });
    message.channel.send(msg).catch((error) => {
        Logger.error(error);
    });
}

/**
 * Handles the ranks command
 * @param {Message} message 
 */
const handleRanksCommand = (message) => {
    const guild = Utils.getGuildFromMessage(message);
    const ranks = Utils.getRanks(guild);

    const rank_msg = new RichEmbed({ title: "Ranks" });

    ranks.forEach((rank) => {
        rank_msg.addField(rank.name, `${rank.members.size} members`);
    });

    message.channel.send(rank_msg).catch((error) => {
        Logger.error(error);
    });
}

/**
 * Handles the roles command
 * @param {Message} message 
 */
const handleRolesCommand = (message) => {
    const guild = Utils.getGuildFromMessage(message);
    const roles = Utils.getGameRoles(guild);

    const role_msg = new RichEmbed({ title: "Roles" });

    roles.forEach((role) => {
        role_msg.addField(`${role.name}`, `${role.members.size} members`);
    });

    message.channel.send(role_msg).catch((error) => {
        Logger.error(error);
    });
}

/**
 * Handles the emojis command
 * @param {Message} message 
 */
const handleEmojisCommand = (message) => {
    const guild = Utils.getGuildFromMessage(message);
    const emojis = Utils.getGameEmojis(guild);

    const emoji_msg = new RichEmbed({ title: "Emojis" });

    emojis.forEach((emoji) => {
        emoji_msg.addField(`:${emoji.name}:`, emoji, true);
    });

    message.channel.send(emoji_msg).catch((error) => {
        Logger.error(error);
    });
}

/**
 * Handles the invites command
 * @param {Message} message 
 */
const handleInvitesCommand = (message) => {
    const guilds = Utils.getGuildsFromUser(message.author);

    const refresh_invites_msg = new RichEmbed({ title: "Refreshing Invites", description: guilds.map(g => g.name).join(", ") });

    message.channel.send(refresh_invites_msg).catch((error) => {
        Logger.error(error);
    });

    GuildMemberService.refreshInvites(guilds);
}

/**
 * Handles the add role command
 * @param {Message} message 
 */
const handleAddRoleCommand = (message) => {
    const guild = Utils.getGuildFromMessage(message);
    const member = Utils.getGuildMember(guild, message.author);

    const args = getArgs(message);

    const desired_roles_to_join = args.toString().split(',').filter((role) => { return role }); // filter empty spaces
    const roles_to_join = [];

    const game_roles = Utils.getGameRoles(guild);

    desired_roles_to_join.forEach((desired_role) => {
        // check that role exists
        const game_role = game_roles.find(r => r.name.toLowerCase() === desired_role.toLowerCase());
        if (!game_role) {
            message.channel.send(`The role '${desired_role}' does not exist`);
            return;
        }

        // check permissions
        if (member.highestRole.comparePositionTo(game_role) < 0) {
            message.channel.send(`${member} has insufficient permissions to add role '${game_role.name}'`);
            return;
        }

        roles_to_join.push(game_role);
    });

    if (roles_to_join.length) {
        member.addRoles(roles_to_join).then(() => {
            message.channel.send(`Added ${member} to role(s): ${roles_to_join.map(role => role.name).join(', ')}`);
        }).catch((error) => {
            message.channel.send(`Failed to add role(s) for ${member}. ${error}`);
        });
    }
}

/**
 * Handles the remove role command
 * @param {Message} message 
 */
const handleRemoveRoleCommand = (message) => {
    const guild = Utils.getGuildFromMessage(message);
    const member = Utils.getGuildMember(guild, message.author);

    const args = getArgs(message);

    const desired_roles_to_leave = args.toString().split(',').filter((role) => { return role }); // filter empty spaces
    const roles_to_leave = [];

    desired_roles_to_leave.forEach((desired_role) => {
        // check that role exists
        const game_role = Utils.getGameRoles(guild).find(r => r.name.toLowerCase() === desired_role.toLowerCase());
        if (!game_role) {
            message.channel.send(`The role '${desired_role}' does not exist`);
            return;
        }

        roles_to_leave.push(game_role);
    });

    if (roles_to_leave.length) {
        member.removeRoles(roles_to_leave).then(() => {
            message.channel.send(`Removed role(s) for ${member}: ${roles_to_leave.map(role => role.name).join(', ')}`);
        }).catch((error) => {
            message.channel.send(`Failed to remove role(s) for ${member}. ${error}`);
        });
    }
}