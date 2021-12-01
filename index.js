import dotenv from 'dotenv';
dotenv.config();
import { Client } from 'discord.js';
const client = new Client({ partials: ['MESSAGE', 'CHANNEL'], intents: 4609 }); // https://ziad87.net/intents/
import { slash_commands, autocomplete_commands, button_interaction } from './utils/slash_commands.js';
import { price } from './utils/price.js';
import { register } from './utils/register.js';
import { balance } from './utils/balance.js';
import { network_miner_info } from './utils/network_miner_info.js';
import { help } from './utils/help.js';
import { set_prefix } from './utils/set_prefix.js';
import { getDatabase } from './utils/database.js';
import { all_commands_array } from './utils/cmds_array.js';
let prefixes = await getDatabase('customPrefix');


client.on('ready', async function () {
    console.log("Bot started!");
    client.user.setActivity('price', { type: 'WATCHING' });
    // await client.guilds.cache.get('123456789')?.commands.set([]);
    // await client.guilds.cache.get('123456789')?.commands.set(all_commands_array);
    // await client.application?.commands.set([]);
    // await client.application?.commands.set(all_commands_array);
});


client.on('messageCreate', async function (msg) {
    if (msg.webhookID != null || msg.author.bot) return;
    let prefix;
    if (msg.channel.type === 'GUILD_TEXT') { // Server
        prefix = "!";
        if (prefixes[msg.guild.id] != undefined) prefix = prefixes[msg.guild.id]; // sets the custom prefix
        if (msg.content.toLowerCase().startsWith(prefix + "price")) {
            await price(msg);
        } else if (msg.content.toLowerCase().startsWith(prefix + "register")) {
            await register(msg, prefix);
        } else if (msg.content.toLowerCase().startsWith(prefix + "bal")) {
            await balance(msg, prefix);
        } else if (msg.content.toLowerCase().startsWith(prefix + "info")) {
            await network_miner_info(msg, prefix);
        } else if (msg.content.toLowerCase().startsWith(prefix + "help")) {
            help(msg, prefix);
        } else if (msg.member.permissions.has("ADMINISTRATOR") && msg.content.toLowerCase().startsWith(prefix + "prefix")) {
            prefixes = await set_prefix(msg, prefixes);
        }
    } else if (msg.channel.type === 'DM') { // DM
        msg.channel.send('Text commands are not supported yet. Use `/` (slash commands)')
    };
});


client.on('interactionCreate', async interaction => {
    if (interaction.isMessageComponent() && interaction.componentType == 'BUTTON') { // buttons
        button_interaction(interaction);
    } else if (interaction.isCommand()) { // slash command
        slash_commands(interaction);
    } else if (interaction.isAutocomplete()) { // autocomplete
        autocomplete_commands(interaction);
    }
});


client.login(process.env.TOKEN);