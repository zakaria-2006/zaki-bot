const Discord = require('discord.js');
const perspective = require('./perspective.js');

require('dotenv').config();

const botId = '933859017434992672'

const emojiMap = {
  'TOXICITY': '😤',
  'SEVERE_TOXICITY': '😡',
  'IDENTITY_ATTACK': '🙅',
  'INSULT': '🤬',
  'PROFANITY': '😱',
  'THREAT': '❗️',
  'SEXUALLY_EXPLICIT': '🔞',
  'FLIRTATION': '💕',
  'SPAM': '👻',
  'INCOHERENT': '❔',
  'INFLAMMATORY': '🔥',
  'OBSCENE': '😯',
};

const users = {};

async function kickBaddie(user, guild) {
  const member = guild.member(user);
  if (!member) return;
  try {
    await member.kick('was bad :(');
  } catch (err) {
    console.log(`Could not kick user ${user.username}: ${err}`);
  }
}

async function evaluateMessage(message) {
  let scores;
  try {
    scores = await perspective.analyzeText(message.content);
  } catch (err) {
    console.log(err);
    return false;
  }

  const userid = message.author.id;

  let shouldDelete = false

  for (const attribute in emojiMap) {
    if (scores[attribute]) {
      shouldDelete = true;

      users[userid][attribute] =
        users[userid][attribute] ?
          users[userid][attribute] + 1 : 1;
    }

    if (shouldDelete) {
      message.delete()//(emojiMap[attribute]);
      shouldDelete = false;
    }

  }


  // Return whether or not we should kick the user
  return (users[userid]['TOXICITY'] > process.env.KICK_THRESHOLD);
}

function getSentiment() {
  const scores = [];
  for (const user in users) {
    if (!Object.keys(users[user]).length) continue;
    let score = `<@${user}> - `;
    for (const attr in users[user]) {
      score += `${emojiMap[attr]} : ${users[user][attr]}\t`;
    }
    scores.push(score);
  }
  console.log(scores);
  if (!scores.length) {
    return '';
  }
  return scores.join('\n');
}

const client = new Discord.Client();

console.log('connecting...')

client.on('ready', () => {
  console.log('client ready!');
});

async function moderateMessage(message) {
  if (!message.guild || message.author.bot) return;

  // Clear previous reactions
  const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(botId));

  try {
    for (const reaction of userReactions.values()) {
      await reaction.users.remove(botId);
    }
  } catch (error) {
    console.error('Failed to remove reactions.');
  }

  // If we've never seen a user before, add them to memory
  const userid = message.author.id;
  if (!users[userid]) {
    users[userid] = [];
  }

  let shouldKick = false;
  try {
    shouldKick = await evaluateMessage(message);
  } catch (err) {
    console.log(err);
  }

  if (shouldKick) {
    kickBaddie(message.author, message.guild);
    delete users[message.author.id];
    message.channel.send(`Kicked user ${message.author.username} from channel`);
    return;
  }

  message.delete()//(emojiMap[attribute]);
}

client.on('messageUpdate', async (oldMessage, message) => {
  moderateMessage(message)
});

client.on('message', async (message) => {
  moderateMessage(message)
});

client.login(process.env.DISCORD_TOKEN);
