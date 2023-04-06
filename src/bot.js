require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

const botToken = process.env.TOKEN;
const prefix = process.env.PREFIX;
const channelId = process.env.CHANNEL_ID;
const openaiApiKey = process.env.API_KEY;

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

//Keep Alive
const express = require('express');
const app = express();
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Running on port ${ PORT }`);
});
app.get('/',(req ,res) => {
    return res.send('Hello. I am awake.');
});

client.on('ready', () => {
  console.log('The bot is online!');
});

const configuration = new Configuration({
  apiKey: openaiApiKey,
});
const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== channelId) return;
  if (message.content.startsWith(prefix)) return;

  let conversationLog = [{ role: 'system', content: 'You are a friendly chatbot.' }];

  try {
    await message.channel.sendTyping();

    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
      if (message.content.startsWith(prefix)) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id !== message.author.id) return;

      conversationLog.push({
        role: 'user',
        content: msg.content,
      });
    });

    const result = await openai
      .createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
        max_tokens: 256, // limit token usage
      })
      .catch((error) => {
        console.error(`OPENAI ERR: ${error}`);
      });

    message.reply(result.data.choices[0].message);
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});

client.login(botToken);