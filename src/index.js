import Discord from 'discord.js';
import config from './config';
import commands from './commands';

const client = new Discord.Client();

client.on('ready', () => {
  console.log('Bot started!');
  client.user.setStatus('dnd').catch((error) => console.error(error));
});

client.on('message', (message) => {
  if (message.author.bot) {
    return;
  }

  if (!message.content.startsWith(config.prefix)) {
    return;
  }

  const args = message.content.slice(config.prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  const guild = message.guild ? message.guild : client.guilds.first();
  const member = guild.members.find(m => m.user.id === message.author.id);

  try {
    switch (command) {
      case commands.help.name:
        let help_msg = '';
        for (const key in commands) {
          if (commands.hasOwnProperty(key)) {
            help_msg += `\`\`\`\n${config.prefix}${commands[key].name}, ${commands[key].description}\`\`\``;
          }
        }

        message.author.send(help_msg);
        break;

      case commands.ping.name:
        message.channel.send('Pinging...').then((msg) => {
          msg.edit(`Ping: ${Date.now() - msg.createdTimestamp}ms`);
        });
        break;

      case commands.roll.name:
        const rolled_number = 1 + Math.floor(Math.random() * 100);
        message.channel.send(`${member} rolled a ${rolled_number}`);
        break;

      case commands.roles.name:
        const roles = guild.roles.filter(role => role.hexColor === config.game_role_hex_color).map(role => role.name);
        message.channel.send(`Roles available are: ${roles.join(', ')}`);
        break;

      case commands.addrole.name:
        const desired_roles_to_join = args.toString().split(',').filter((role) => { return role }); // filter empty spaces
        const roles_to_join = [];

        desired_roles_to_join.forEach((desired_role) => {
          // check that role exists
          const guild_role = guild.roles.filter(role => role.hexColor === config.game_role_hex_color).find(r => r.name.toLowerCase() === desired_role.toLowerCase());
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

      case commands.removerole.name:
        const desired_roles_to_leave = args.toString().split(',').filter((role) => { return role }); // filter empty spaces
        const roles_to_leave = [];

        desired_roles_to_leave.forEach((desired_role) => {
          // check that role exists
          const guild_role = guild.roles.filter(role => role.hexColor === config.game_role_hex_color).find(r => r.name.toLowerCase() === desired_role.toLowerCase());
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
        const games = guild.roles.filter(role => role.hexColor === config.game_role_hex_color).map(role => role.name.toLowerCase());
        const emojis = guild.emojis.filter(emoji => games.indexOf(emoji.name.toLowerCase()) > -1).map(emoji => emoji.name);
        message.channel.send(`Available emojis are: ${emojis.join(', ')}`);
        break;

      default:
        message.channel.send(`Unknown command '${command}'. Try ${config.prefix}help`);
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

    if (message_reaction.message.content.indexOf("Welcome to the guild") < 0 && message_reaction.message.content.indexOf("-test-") < 0) {
      return;
    }

    const game_emoji = guild.emojis.find(emoji => emoji.id === message_reaction.emoji.id);
    if (!game_emoji) {
      return;
    }

    const game_role = guild.roles.find(role => role.hexColor === config.game_role_hex_color && game_emoji.name.toLowerCase() === role.name.toLowerCase());
    if (!game_role) {
      return;
    }

    member.addRole(game_role).then(() => {
      message_reaction.message.channel.send(`Added ${member} to role ${game_role.name}`);
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

    if (message_reaction.message.content.indexOf("Welcome to the guild") < 0 && message_reaction.message.content.indexOf("-test-") < 0) {
      return;
    }

    const game_emoji = guild.emojis.find(emoji => emoji.id === message_reaction.emoji.id);
    if (!game_emoji) {
      return;
    }

    const game_role = guild.roles.find(role => role.hexColor === config.game_role_hex_color && game_emoji.name.toLowerCase() === role.name.toLowerCase());
    if (!game_role) {
      return;
    }

    member.removeRole(game_role).then(() => {
      message_reaction.message.channel.send(`Removed role ${game_role.name} for ${member}`);
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
    const games = guild_member.guild.roles.filter(role => role.hexColor === config.game_role_hex_color).map(role => role.name.toLowerCase());
    const emojis = guild_member.guild.emojis.filter(emoji => games.indexOf(emoji.name.toLowerCase()) > -1);

    const channel = guild_member.guild.channels.find(c => c.name.toLowerCase() === config.default_channel);
    channel.send(`Welcome to the guild ${guild_member}`).then((message) => {
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
    const now = new Date();
    if (now.getFullYear() === new_member.joinedAt.getFullYear() && now.getMonth() === new_member.joinedAt.getMonth() && now.getDate() === new_member.joinedAt.getDate()) {
      return;
    }

    if (old_member.presence.status === 'offline' && new_member.presence.status === 'online') {
      const channel = new_member.guild.channels.find(c => c.name.toLowerCase() === config.default_channel);
      channel.send(`Welcome back from being ${old_member.presence.status} ${new_member}`);
    }
  }
  catch (e) {
    console.error(e.stack);
  }
});

client.login(config.token);