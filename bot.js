const fs = require('fs');
require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const searchInfo = require('./utils.js');
let prefixes = JSON.parse(fs.readFileSync('./data/customPrefix.json', 'utf-8'));


client.on('ready', () => {
    console.log("Bot started!");
    client.user.setActivity('price', { type: 'WATCHING' }).catch(console.error);
});


client.on('message', async function (msg) {
    if (msg.webhookID != null || msg.author.bot) return;
    const number_format = "en-US";
    let prefix = "!";
    if (prefixes[msg.guild.id] != undefined) { prefix = prefixes[msg.guild.id]; } // sets the custom prefix


    if (msg.member.permissions.has("ADMINISTRATOR") && msg.content.toLowerCase().startsWith(prefix + "prefix")) { // change prefix (only admin)
        let newPrefix = msg.content.split(" ")[1];
        prefixes[msg.guild.id] = newPrefix;
        fs.writeFileSync('./data/customPrefix.json', JSON.stringify(prefixes));
        msg.channel.send("Prefix changed to " + newPrefix + "\nCommands now trigger like this: `" + newPrefix + "help`");
    }


    if (msg.content.toLowerCase().startsWith(prefix + "price")) {
        let info;
        if (msg.content.split(" ").length > 1) {
            info = await searchInfo.getCMC(msg.content.split(" ")[1]); // different currency
        } else {
            info = await searchInfo.getCMC(); // USD
        }
        if (info == "error ocurred") {
            msg.channel.send(info + " Maybe wrong currency code?");
        } else {
            let value1;
            let value2;
            let value3;
            try {
                value1 = info.price.toLocaleString(number_format, { style: 'currency', currency: info.currency, minimumFractionDigits: 4 });
                value2 = info.volume_24h.toLocaleString(number_format, { style: 'currency', currency: info.currency, minimumFractionDigits: 2 });
                value3 = info.market_cap.toLocaleString(number_format, { style: 'currency', currency: info.currency, minimumFractionDigits: 2 });
            } catch (error) {
                value1 = info.price.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " " + info.currency;
                value2 = info.volume_24h.toLocaleString(number_format, { minimumFractionDigits: 2 }) + " " + info.currency;
                value3 = info.market_cap.toLocaleString(number_format, { minimumFractionDigits: 2 }) + " " + info.currency;
            }
            let embed = new Discord.MessageEmbed()
                .setColor('#E67E22')
                .setTitle('CoinMarketCap Garlicoin Info')
                .setURL('https://coinmarketcap.com/currencies/garlicoin/')
                .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
                .addFields(
                    { name: 'Price', value: value1 },
                    { name: 'Volume 24h', value: value2 },
                    { name: 'Market Cap', value: value3 }
                )
                .setFooter('Last Updated: ' + info.lastUpdate);
            msg.channel.send(embed);
        }


    } else if (msg.content.toLowerCase().startsWith(prefix + "register")) {
        let answer = await searchInfo.saveUser(msg.author.id, msg.content, prefix);
        let embed = new Discord.MessageEmbed()
            .setColor('#E67E22')
            .setTitle('Wallet registration')
            .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
            .setDescription(answer)
        msg.channel.send(embed);


    } else if (msg.content.toLowerCase().startsWith(prefix + "bal")) {
        let answer = await searchInfo.sendBalance(msg.author.id, msg.content, prefix);
        if (answer == "no_registration") {
            let embed = new Discord.MessageEmbed()
                .setColor('#E67E22')
                .setTitle('Balance')
                .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
                .setDescription("No wallet registered. Use `" + prefix + "register <wallet_address>`")
            msg.channel.send(embed);
        } else if (answer == "error") {
            let embed = new Discord.MessageEmbed()
                .setColor('#E67E22')
                .setTitle('Balance')
                .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
                .setDescription("Something went wrong with CoinMarketCap")
            msg.channel.send(embed);
        } else if (answer.address == undefined) {
            let embed = new Discord.MessageEmbed()
                .setColor('#E67E22')
                .setTitle('Balance')
                .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
                .setDescription("Something went wrong. Try to re-register your address.  Use `" + prefix + "register <wallet_address>`")
            msg.channel.send(embed);
        } else {
            let value4;
            let value5;
            try {
                value4 = answer.value.toLocaleString(number_format, { style: 'currency', currency: answer.currency, minimumFractionDigits: 2 });
                value5 = answer.price.toLocaleString(number_format, { style: 'currency', currency: answer.currency, minimumFractionDigits: 4 });
            } catch (error) {
                value4 = answer.value.toLocaleString(number_format, { minimumFractionDigits: 2 }) + " " + answer.currency;
                value5 = answer.price.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " " + answer.currency;
            }
            let embed = new Discord.MessageEmbed()
                .setColor('#E67E22')
                .setTitle('Balance')
                .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
                .addFields(
                    { name: 'Address', value: answer.address },
                    { name: 'Balance', value: answer.balance.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " 🧄" },
                    { name: 'Total value', value: value4 },
                    { name: '1 GRLC🧄', value: value5 }
                )
                .setFooter('Last Updated: ' + answer.lastUpdate);
            msg.channel.send(embed);
        }


    } else if (msg.content.toLowerCase().startsWith(prefix + "info")) {
        let info = await searchInfo.sendInfo(msg.author.id, prefix);
        if (info.type == "no_wallet") {
            let embed = new Discord.MessageEmbed()
                .setColor('#E67E22')
                .setTitle('FreshGarlicBlocks Info')
                .setURL('https://www.freshgarlicblocks.net/')
                .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
                .addFields(
                    { name: "FreshG's Pool", value: info.poolAvgHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                    { name: 'Network', value: info.totalHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                    { name: 'Workers', value: info.workers },
                    { name: 'Difficulty', value: info.diff },
                    { name: 'Block Reward', value: info.reward + " 🧄" }
                )
                .setFooter(info.error);
            msg.channel.send(embed);
        } else if (info.type == "instant") {
            let embed = new Discord.MessageEmbed()
                .setColor('#E67E22')
                .setTitle('FreshGarlicBlocks Info')
                .setURL('https://www.freshgarlicblocks.net/')
                .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
                .addFields(
                    { name: 'Payout Address', value: info.payout_address },
                    { name: 'Payout Type', value: info.payout_type },
                    { name: 'Next Payout', value: info.payout.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " 🧄" },
                    { name: 'Your Current Hashrate', value: info.currHashUser.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " MH/s" },
                    { name: "FreshG's Pool", value: info.poolAvgHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                    { name: 'Network', value: info.totalHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                    { name: 'Workers', value: info.workers },
                    { name: 'Difficulty', value: info.diff },
                    { name: 'Block Reward', value: info.reward + " 🧄" }
                )
            msg.channel.send(embed);
        } else if (info.type == "daily") {
            let embed = new Discord.MessageEmbed()
                .setColor('#E67E22')
                .setTitle('FreshGarlicBlocks Info')
                .setURL('https://www.freshgarlicblocks.net/')
                .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
                .addFields(
                    { name: 'Payout Address', value: info.payout_address },
                    { name: 'Payout Type', value: info.payout_type },
                    { name: 'Next Payout', value: info.payout.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " 🧄" },
                    { name: 'Awaiting Payout', value: info.awaitingPayout.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " 🧄" },
                    { name: 'Your Current Hashrate', value: info.currHashUser.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " MH/s" },
                    { name: "FreshG's Pool", value: info.poolAvgHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                    { name: 'Network', value: info.totalHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                    { name: 'Workers', value: info.workers },
                    { name: 'Difficulty', value: info.diff },
                    { name: 'Block Reward', value: info.reward + " 🧄" }
                )
            msg.channel.send(embed);
        } else if (info.type == "error") {
            let embed = new Discord.MessageEmbed()
                .setColor('#E67E22')
                .setTitle('FreshGarlicBlocks Info')
                .setURL('https://www.freshgarlicblocks.net/')
                .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
                .addFields(
                    { name: "FreshG's Pool", value: info.poolAvgHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                    { name: 'Network', value: info.totalHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                    { name: 'Workers', value: info.workers },
                    { name: 'Difficulty', value: info.diff },
                    { name: 'Block Reward', value: info.reward + " 🧄" }
                )
                .setFooter(info.error);
            msg.channel.send(embed);
        }


    } else if (msg.content.toLowerCase().startsWith(prefix + "help")) {
        let embed = new Discord.MessageEmbed()
            .setColor('#E67E22')
            .setTitle('Garlicoin Bot Commands')
            .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
            .addFields(
                { name: prefix + 'price', value: "Current Garlicoin Value in USD.\nAlso accepts `" + prefix + "price <optional:custom_currency_code>`\nExample: `" + prefix + "price eur`\nCurrency codes: [Fiat Codes.](https://imgur.com/a/O3avEXm) `EUR, USD, HKD, ...`\nAlso accepts codes like `BTC, ETH, DOGE, ...`" },
                { name: prefix + 'register <Address>', value: "Address must start with `G, M, W or grlc` and be 34/44 characters long.\nExample: `" + prefix + "register GaaaaaaaaaaaaaaGarlicRandomAddress`\nSave your wallet to use `" + prefix + "balance` and `" + prefix + "info`\n`" + prefix + "register forget` to forget your wallet" },
                { name: prefix + 'info', value: "Info about pool / (pool + user if registered).\nInfo of miner only if you are mining in FreshGarlicBlocks' Pool" },
                { name: prefix + 'balance or ' + prefix + 'bal', value: "Balance of your registered wallet.\nAlso accepts `" + prefix + "balance <optional:custom_currency>`.\nExample: `" + prefix + "balance eur`" },
                { name: 'Want this bot in your server?', value: "[Add the bot](https://discord.com/api/oauth2/authorize?client_id=835398074057883708&permissions=35840&scope=bot) to your server!" },
            )
        msg.channel.send(embed);
    }
});



client.login(process.env.TOKENDISCORD);