import { MessageEmbed } from 'discord.js';


function help(msg, prefix) {
    let embed = new MessageEmbed()
        .setColor('#E67E22')
        .setTitle('Garlicoin Bot Commands')
        .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/200x200/2475.png')
        .addFields(
            { name: prefix + 'price', value: "Current Garlicoin Value in USD.\nAlso accepts `" + prefix + "price <optional:custom_currency_code>`\nExample: `" + prefix + "price eur`\nCurrency codes: [Fiat Codes.](https://imgur.com/a/O3avEXm) `EUR, USD, HKD, ...`\nAlso accepts codes like `BTC, ETH, DOGE, SATS, ...`" },
            { name: prefix + 'register <Address>', value: "Address must start with `G, M, W or grlc` and be 34/44 characters long.\nExample: `" + prefix + "register GaaaaaaaaaaaaaaGarlicRandomAddress`\nSave your wallet to use `" + prefix + "balance` and `" + prefix + "info`\n`" + prefix + "register forget` to forget your wallet" },
            { name: prefix + 'info', value: "Info about pool / (pool + user if registered).\nInfo of miner only if you are mining in FreshGarlicBlocks' Pool" },
            { name: prefix + 'balance or ' + prefix + 'bal', value: "Balance of your registered wallet.\nAlso accepts `" + prefix + "balance <optional:custom_currency>`.\nExample: `" + prefix + "balance eur`" },
            { name: prefix + 'op_return', value: "New op_returns on the blockchain will be relayed to that channel. Run again to deactivate" },
            { name: '`/wallet`', value: "Send GRLC using slash commands.\nMore info `/wallet help`" },
            { name: 'Want this bot in your server?', value: "[Add the bot](https://discord.com/api/oauth2/authorize?client_id=835398074057883708&permissions=35840&scope=bot%20applications.commands) to your server!" },
        )
    msg.channel.send({ embeds: [embed] });
}


function help_wallet() {
    let info = '`/Wallet send` is in BETA\n';
    info += '- No passwords are saved\n';
    info += '- You can dm the bot and also make transactions\n'
    info += '- Private keys are currently derived from: <password>\n';
    info += '- All transactions are final, unless an error occurs\n';
    info += '- All messages will be ephemeral (Only you will be able to see them)\n';
    let embed = new MessageEmbed()
        .setColor('#E67E22')
        .setTitle('GRLC')
        .addFields({ name: 'Garlicoin Bot Wallet', value: info },)
    return { embeds: [embed] };
}


export { help, help_wallet };