import { sendBalance } from './utils.js';
import { MessageEmbed } from 'discord.js';
const number_format = "en-US";

async function balance(msg, prefix) {
    let answer = await sendBalance(msg.author.id, msg.content, prefix);
    if (answer == "no_registration") {
        let embed = new MessageEmbed()
            .setColor('#E67E22')
            .setTitle('Balance')
            .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
            .setDescription("No wallet registered. Use `" + prefix + "register <wallet_address>`")
        msg.channel.send({ embeds: [embed] });
    } else if (answer == "error") {
        let embed = new MessageEmbed()
            .setColor('#E67E22')
            .setTitle('Balance')
            .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
            .setDescription("Something went wrong with CoinMarketCap")
        msg.channel.send({ embeds: [embed] });
    } else if (answer.address == undefined) {
        let embed = new MessageEmbed()
            .setColor('#E67E22')
            .setTitle('Balance')
            .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
            .setDescription("Something went wrong. Try to re-register your address.  Use `" + prefix + "register <wallet_address>`")
        msg.channel.send({ embeds: [embed] });
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
        let embed = new MessageEmbed()
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
        msg.channel.send({ embeds: [embed] });
    }
}


export { balance };