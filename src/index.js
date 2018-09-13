import Discord from 'discord.js';
import Config from './config';
import Commands from './commands';
import * as Utils from './utils';

const client = new Discord.Client();

client.on('ready', () => {
  console.log('Bot started!');
  client.user.setStatus('dnd').catch((error) => console.error(error));

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
      case Commands.help.name:
        let help_msg = '';
        for (const key in Commands) {
          if (Commands.hasOwnProperty(key)) {
            help_msg += `\`\`\`\n${Config.command_prefix}${Commands[key].name}, ${Commands[key].description}\`\`\``;
          }
        }

        message.author.send(help_msg);
        break;

      case Commands.ping.name:
        message.channel.send('Pinging...').then((msg) => {
          msg.edit(`Ping: ${Date.now() - msg.createdTimestamp}ms`);
        });
        break;

      case Commands.roll.name:
        const rolled_number = 1 + Math.floor(Math.random() * 100);
        message.channel.send(`${member} rolled a ${rolled_number}`);
        break;

      case Commands.roles.name:
        const roles = guild.roles.filter(role => role.hexColor === Config.game_role_hex_color).map(role => role.name);
        message.channel.send(`Roles available are: ${roles.join(', ')}`);
        break;

      case Commands.addrole.name:
        const desired_roles_to_join = args.toString().split(',').filter((role) => { return role }); // filter empty spaces
        const roles_to_join = [];

        desired_roles_to_join.forEach((desired_role) => {
          // check that role exists
          const guild_role = guild.roles.filter(role => role.hexColor === Config.game_role_hex_color).find(r => r.name.toLowerCase() === desired_role.toLowerCase());
          if (!guild_role) {
            message.channel.send(`The role '${desired_role}' does not exist`);
            return;
          }

          // check permissions
          if (member.highestRole.comparePositionTo(guild_role) < 0) {
            message.channel.send(`${member} has insufficient permissions to add role '${guild_role.name}'`);
            return;
          }

          roles_to_join.push(guild_role);
        });

        if (roles_to_join.length) {
          member.addRoles(roles_to_join).then(() => {
            message.channel.send(`Added ${member} to role(s): ${roles_to_join.map(role => role.name).join(', ')}`);
          }).catch((error) => {
            message.channel.send(`Failed to add roles for ${member}. ${error}`);
          });
        }

        break;

      case Commands.removerole.name:
        const desired_roles_to_leave = args.toString().split(',').filter((role) => { return role }); // filter empty spaces
        const roles_to_leave = [];

        desired_roles_to_leave.forEach((desired_role) => {
          // check that role exists
          const guild_role = guild.roles.filter(role => role.hexColor === Config.game_role_hex_color).find(r => r.name.toLowerCase() === desired_role.toLowerCase());
          if (!guild_role) {
            message.channel.send(`The role '${desired_role}' does not exist`);
            return;
          }

          roles_to_leave.push(guild_role);
        });

        if (roles_to_leave.length) {
          member.removeRoles(roles_to_leave).then(() => {
            message.channel.send(`Removed role(s) for ${member}: ${roles_to_leave.map(role => role.name).join(', ')}`);
          }).catch((error) => {
            message.channel.send(`Failed to remove roles for ${member}. ${error}`);
          });
        }

        break;

      case 'emojis':
        const emojis = Utils.getGameEmojis(guild);
        message.channel.send(`Available emojis are: ${emojis.map(emoji => emoji.name).join(', ')}`).catch((error) => {
          console.error(error);
        });
        break;

      default:
        message.channel.send(`Unknown command '${command}'. Try ${Config.command_prefix}help`).catch((error) => {
          console.error(error);
        });
        break;
    }
  }
  catch (e) {
    console.error(e.stack);
  }
  finally {
    console.log(`${message.author.tag} used '${command}' command`);
  }
});

client.on('messageReactionAdd', (message_reaction, user) => {
  try {
    if (user.bot) {
      return;
    }

    const guild = message_reaction.message.guild ? message_reaction.message.guild : client.guilds.first();
    const member = guild.members.find(m => m.user.id === user.id);

    if (!message_reaction.message.embeds.find(embed => embed.title.toLowerCase() === 'a new user has joined')) {
      return;
    }

    const game_emoji = guild.emojis.find(emoji => emoji.id === message_reaction.emoji.id);
    if (!game_emoji) {
      return;
    }

    const game_role = guild.roles.find(role => role.hexColor === Config.game_role_hex_color && game_emoji.name.toLowerCase() === role.name.toLowerCase());
    if (!game_role) {
      return;
    }

    member.addRole(game_role).then(() => {
      message_reaction.message.channel.send(`Added ${member} to role ${game_role.name}`).then((message) => {
        setTimeout(() => { message.delete() }, 2000);
      });
    }).catch((error) => {
      message_reaction.message.channel.send(`Failed to add role ${game_role.name}. ${error}`);
    });
  }
  catch (e) {
    console.error(e.stack);
  }
});

client.on('messageReactionRemove', (message_reaction, user) => {
  try {
    if (user.bot) {
      return;
    }

    const guild = message_reaction.message.guild ? message_reaction.message.guild : client.guilds.first();
    const member = guild.members.find(m => m.user.id === user.id);

    if (!message_reaction.message.embeds.find(embed => embed.title.toLowerCase() === 'a new user has joined')) {
      return;
    }

    const game_emoji = guild.emojis.find(emoji => emoji.id === message_reaction.emoji.id);
    if (!game_emoji) {
      return;
    }

    const game_role = guild.roles.find(role => role.hexColor === Config.game_role_hex_color && game_emoji.name.toLowerCase() === role.name.toLowerCase());
    if (!game_role) {
      return;
    }

    member.removeRole(game_role).then(() => {
      message_reaction.message.channel.send(`Removed role ${game_role.name} for ${member}`).then((message) => {
        setTimeout(() => { message.delete() }, 2000);
      });
    }).catch((error) => {
      message_reaction.message.channel.send(`Failed to remove role ${game_role.name} for ${member}. ${error}`);
    });
  }
  catch (e) {
    console.error(e.stack);
  }
});

client.on('guildMemberAdd', (guild_member) => {
  try {
    const emojis = Utils.getGameEmojis(guild_member.guild);
    const welcome_channel = Utils.getWelcomeChannel(guild_member.guild);

    const welcome_message = new Discord.RichEmbed()
      .setTitle('A new user has joined')
      .setDescription(`${guild_member} has joined the guild`)
      .setThumbnail(guild_member.user.displayAvatarURL)
      .setTimestamp();

    welcome_channel.send(welcome_message).then((message) => {
      emojis.forEach((emoji) => {
        message.react(emoji);
      });
    });
  }
  catch (e) {
    console.error(e.stack);
  }
});

client.on('presenceUpdate', (old_member, new_member) => {
  try {
    // when a guild member is added it also triggers a presence update of offline to online - ensure it is not a new member joining by checking the time
    if (new Date() < old_member.joinedAt.setMinutes(old_member.joinedAt.getMinutes() + 5)) {
      console.log(`Ignoring presence update of ${old_member.user.tag} due to recently joining the guild`);
      return;
    }

    if (old_member.presence.status === 'offline' && new_member.presence.status === 'online') {
      const channel = new_member.guild.channels.find(c => c.name.toLowerCase() === Config.default_channel);
      channel.send(`Welcome back from being ${old_member.presence.status} ${new_member}`);
    }
  }
  catch (e) {
    console.error(e.stack);
  }
});

client.login(Config.token);