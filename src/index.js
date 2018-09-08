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
  const member = guild.members.find(m => m.user.id == message.author.id);

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
        message.reply(`rolled a ${rolled_number}`);
        break;

      case commands.roles.name:
        const roles = guild.roles.map(role => role.name);
        message.author.send(`roles available are: ${roles.join(', ')}`);
        break;

      case commands.addrole.name:
        const desired_roles_to_join = args.toString().split(',').filter((role) => { return role }); // filter empty spaces
        const roles_to_join = [];

        desired_roles_to_join.forEach((desired_role) => {
          // check that role exists
          const guild_role = guild.roles.find(r => r.name.toLowerCase() === desired_role.toLowerCase());
          if (!guild_role) {
            message.author.send(`role '${desired_role}' does not exist`);
            return;
          }

          // check permissions
          if (member.highestRole.comparePositionTo(guild_role) < 0) {
            message.author.send(`insufficient permissions for '${guild_role.name}'`);
            return;
          }

          roles_to_join.push(guild_role);
        });

        if (roles_to_join.length) {
          member.addRoles(roles_to_join).then(() => {
            message.author.send(`added role(s): ${roles_to_join.map(role => role.name).join(', ')}`);
          }).catch((error) => {
            message.author.send(`failed to add roles. ${error}`);
          });
        }

        break;

      case commands.removerole.name:
        const desired_roles_to_leave = args.toString().split(',').filter((role) => { return role }); // filter empty spaces
        const roles_to_leave = [];

        desired_roles_to_leave.forEach((desired_role) => {
          // check that role exists
          const guild_role = guild.roles.find(r => r.name.toLowerCase() === desired_role.toLowerCase());
          if (!guild_role) {
            message.author.send(`role '${desired_role}' does not exist`);
            return;
          }

          roles_to_leave.push(guild_role);
        });

        if (roles_to_leave.length) {
          member.removeRoles(roles_to_leave).then(() => {
            message.author.send(`removed roles: ${roles_to_leave.map(role => role.name).join(', ')}`);
          }).catch((error) => {
            message.author.send(`failed to remove roles. ${error}`);
          });
        }

        break;

      default:
        message.channel.send(`Unknown command '${command}'. Try ${config.prefix}help`);
        break;
    }
  }
  catch (e) {
    console.log(e.stack);
  }
  finally {
    console.log(`${message.author.tag} used '${command}' command`);
  }
});

client.on('guildMemberAdd', (guild_member) => {
  try {
    const channel = guild_member.guild.channels.find(c => c.name.toLowerCase() === config.default_channel);
    channel.send(`Welcome to the guild @${guild_member}`);
  }
  catch (e) {
    console.log(e.stack);
  }
});

client.on('presenceUpdate', (old_member, new_member) => {
  try {
    if ((old_member.presence.status === 'offline' || old_member.presence.status === 'idle') && new_member.presence.status === 'online') {
      const channel = new_member.guild.channels.find(c => c.name.toLowerCase() === config.default_channel);
      channel.send(`Welcome back from being ${old_member.presence.status} ${new_member}`);
    }
  }
  catch (e) {
    console.log(e.stack);
  }
});

client.login(config.token);