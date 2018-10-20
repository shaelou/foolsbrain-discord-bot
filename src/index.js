import { Client } from 'discord.js';
import Config from './Config';
import * as Utils from './Utils';
import * as MessageReactionService from './MessageReactionService';
import * as GuildMemberService from './GuildMemberService';
import * as CommandService from './CommandService';
import * as AuditService from './AuditService';
import * as Logger from './Logger';

const client = new Client();

client.on('ready', () => {
  Logger.log('Bot started!');

  try {
    GuildMemberService.initRefreshInviteTask(client);
    MessageReactionService.initPinnedRoleMessages(client);
  }
  catch (e) {
    Logger.error(e);
  }
});

client.on('message', (message) => {
  try {
    if (Utils.isCommand(message)) {
      CommandService.handleCommand(message);
    }
  }
  catch (e) {
    Logger.error(e);
  }
});

client.on('messageDelete', (message) => {
  try {
    AuditService.onMessageDeleted(message);
  }
  catch (e) {
    Logger.error(e);
  }
});

client.on('messageReactionAdd', (message_reaction, user) => {
  try {
    MessageReactionService.handleMessageReactionAdded(message_reaction, user);
  }
  catch (e) {
    Logger.error(e);
  }
});

client.on('messageReactionRemove', (message_reaction, user) => {
  try {
    MessageReactionService.handleMessageReactionRemoved(message_reaction, user);
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

client.on('guildBanAdd', (guild, user) => {
  try {
    GuildMemberService.handleUserBanned(guild, user);
  }
  catch (e) {
    Logger.error(e);
  }
});

client.login(Config.token);