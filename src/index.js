import Discord from 'discord.js';
import Config from './Config';
import Commands from './Commands';
import * as Utils from './Utils';
import * as MessageReactionService from './MessageReactionService';
import * as GuildMemberService from './GuildMemberService';
import * as Logger from './Logger';

const client = new Discord.Client();

client.on('ready', () => {
  Logger.log('Bot started!');
  client.user.setStatus('dnd').catch((error) => Logger.error(error));

  GuildMemberService.initRefreshInviteTask(client.guilds);

  // TODO: find channels that have pinned messages that bot should be parsing reactions for
  // client.guilds.first().channels.find(c => c.name.toLowerCase() === config.default_channel).fetchPinnedMessages();
});

client.on('message', (message) => {
  if (message.author.bot) {
    return;
  }

  if (!message.content.startsWith(Config.command_prefix)) {
    return;
  }

  const args = message.content.slice(Config.command_prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  const guild = Utils.getGuildFromMessage(message);
  const member = Utils.getGuildMember(guild, message.author);

  try {
    switch (command) {
      case Commands.help.name: {
        let help_message = new Discord.RichEmbed().setTitle('Commands available');

        for (const key in Commands) {
          if (Commands.hasOwnProperty(key)) {
            help_message = help_message.addField(`${Config.command_prefix}${Commands[key].name}`, Commands[key].description)
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
        const rank_names = ranks.map(rank => rank.name);

        message.channel.send(`Ranks available are: ${rank_names.join(', ')}`).catch((error) => {
          Logger.error(error);
        });

        break;
      }

      case Commands.roles.name: {
        const roles = Utils.getGameRoles(guild);
        const role_names = roles.map(role => role.name);

        message.channel.send(`Roles available are: ${role_names.join(', ')}`);
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

        message.channel.send(`Available emojis are: ${emojis.map(emoji => emoji.name).join(', ')}`).catch((error) => {
          Logger.error(error);
        });

        break;
      }

      case Commands.invites.name: {
        const guilds = Utils.getGuildsFromUser(message.author);

        message.channel.send(`Refreshing invites for guild(s): ${guilds.map(g => g.name).join(', ')}`).catch((error) => {
          Logger.error(error);
        });

        GuildMemberService.refreshInvites(guilds);

        break;
      }

      default: {
        message.channel.send(`Unknown command '${command}'. Try ${Config.command_prefix}help`).catch((error) => {
          Logger.error(error);
        });

        break;
      }
    }
  }
  catch (e) {
    Logger.error(e);
  }
  finally {
    Logger.log(`${message.author.tag} used '${command}' command`);
  }
});

client.on('messageReactionAdd', (message_reaction, user) => {
  try {
    MessageReactionService.handleMessageReaction(message_reaction, user, true);
  }
  catch (e) {
    Logger.error(e);
  }
});

client.on('messageReactionRemove', (message_reaction, user) => {
  try {
    MessageReactionService.handleMessageReaction(message_reaction, user, false);
  }
  catch (e) {
    Logger.error(e);
  }
});

client.on('guildMemberAdd', (member) => {
  try {
    GuildMemberService.handleGuildMemberAdded(member);
  }
  catch (e) {
    Logger.error(e);
  }
});

client.on('guildMemberRemove', (member) => {
  try {
    GuildMemberService.handleGuildMemberRemoved(member);
  }
  catch (e) {
    Logger.error(e);
  }
});

client.login(Config.token);