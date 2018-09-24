import { RichEmbed, Message } from "discord.js";
import Config from './Config';
import Commands from './Commands';
import * as Utils from './Utils';
import * as GuildMemberService from './GuildMemberService';
import * as Logger from './Logger';

/**
 * 
 * @param {Message} message 
 */
export const handleCommand = (message) => {
    if (message.author.bot) {
        return false;
    }

    const args = message.content.slice(Config.command_prefix.length).trim().split(' ');
    const command = args.shift().toLowerCase();
    Logger.log(`${message.author.tag} used '${command}' command`);

    const guild = Utils.getGuildFromMessage(message);
    const member = Utils.getGuildMember(guild, message.author);

    switch (command) {
        case Commands.help.name: {
            const help_message = new RichEmbed({ title: "Commands Available" });

            for (const key in Commands) {
                if (Commands.hasOwnProperty(key)) {
                    help_message.addField(`${Config.command_prefix}${Commands[key].name}`, Commands[key].description)
                }
            }

            message.author.send(help_message).catch((error) => {
                Logger.error(error);
            });
            break;
        }

        case Commands.ping.name: {
            message.channel.send('Pinging...').then((ping_message) => {
                ping_message.edit(`Ping: ${Date.now() - ping_message.createdTimestamp}ms`);
            }).catch((error) => {
                Logger.error(error);
            });

            break;
        }

        case Commands.roll.name: {
            const rolled_number = Utils.getRandomInt(1, 100); // TODO: parse user input min/max

            message.channel.send(`${member} rolled a ${rolled_number}`).catch((error) => {
                Logger.error(error);
            });

            break;
        }

        case Commands.ranks.name: {
            const ranks = Utils.getRanks(guild);

            const rank_msg = new RichEmbed({ title: "Ranks" });

            ranks.forEach((rank) => {
                rank_msg.addField(rank.name, `${rank.members.size} members`);
            });

            message.channel.send(rank_msg).catch((error) => {
                Logger.error(error);
            });

            break;
        }

        case Commands.roles.name: {
            const roles = Utils.getGameRoles(guild);
            const emojis = Utils.getGameEmojis(guild);

            const role_msg = new RichEmbed({ title: "Roles" });

            roles.forEach((role) => {
                const emoji = emojis.find(emoji => emoji.name.toLowerCase() === role.name.toLowerCase());
                role_msg.addField(`${role.name}${emoji}`, `${role.members.size} members`);
            });

            message.channel.send(role_msg).catch((error) => {
                Logger.error(error);
            });

            break;
        }

        case Commands.addrole.name: {
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

            break;
        }

        case Commands.removerole.name: {
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

            break;
        }

        case Commands.emojis.name: {
            const emojis = Utils.getGameEmojis(guild);

            const emoji_msg = new RichEmbed({ title: "Emojis" });

            emojis.forEach((emoji) => {
                emoji_msg.addField(`:${emoji.name}:`, emoji, true);
            });

            message.channel.send(emoji_msg).catch((error) => {
                Logger.error(error);
            });

            break;
        }

        case Commands.invites.name: {
            const guilds = Utils.getGuildsFromUser(message.author);

            const refresh_invites_msg = new RichEmbed({ title: "Refreshing Invites" });
            refresh_invites_msg.addField("Guilds", guilds.map(g => g.name).join(", "));

            message.channel.send(refresh_invites_msg).catch((error) => {
                Logger.error(error);
            });

            GuildMemberService.refreshInvites(guilds);

            break;
        }

        default: {
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

            break;
        }
    }
}