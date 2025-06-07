const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST } = require('discord.js');
const axios = require('axios'); // Make sure axios is installed with: npm install axios

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const pasteApiKey = process.env.PASTEEE_API_KEY;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const command = new SlashCommandBuilder()
  .setName('generate')
  .setDescription('Generates a Roblox webhook sender script.')
  .addStringOption(option =>
    option.setName('webhook')
      .setDescription('The Discord webhook URL to send to')
      .setRequired(true)
  );

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registering slash command...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: [command.toJSON()] },
    );
    console.log('Slash command registered.');
  } catch (err) {
    console.error('Error registering command:', err);
  }
})();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'generate') {
    const webhook = interaction.options.getString('webhook');

    // Basic webhook validation
    if (!webhook.startsWith('https://discord.com/api/webhooks/')) {
      await interaction.reply({ content: '❌ Invalid webhook URL.', ephemeral: true });
      return;
    }

    const robloxScript = `
local response = request({
    Url = "${webhook}",
    Method = "POST",
    Headers = {
        ["Content-Type"] = "application/json"
    },
    Body = game:GetService("HttpService"):JSONEncode({
        content = "Hello, subscribe to Viper on YT!"
    })
})
`;

    try {
      const pasteRes = await axios.post('https://api.paste.ee/v1/pastes', {
        description: "Webhook Script by Viper Bot",
        sections: [
          {
            name: "Roblox Script",
            syntax: "lua",
            contents: robloxScript
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': pasteApiKey
        }
      });

      const pasteLink = pasteRes.data.link;
      const rawLink = pasteLink.replace('/p/', '/r/');

      await interaction.reply({
        content: `✅ Your loadstring:\n\`\`\`lua\nloadstring(game:HttpGet("${rawLink}"))()\n\`\`\``,
        ephemeral: true
      });

    } catch (err) {
      console.error('Paste.ee error:', err);
      await interaction.reply({
        content: '❌ Failed to upload to Paste.ee. Please try again later.',
        ephemeral: true
      });
    }
  }
});

client.login(token);