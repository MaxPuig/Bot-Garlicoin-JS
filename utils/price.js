import { getCMC } from './utils.js';
import { MessageEmbed } from 'discord.js';
const number_format = "en-US";

async function price(msg) {
    let info;
    if (msg.content.split(" ").length > 1) {
        info = await getCMC(msg.content.split(" ")[1]); // different currency
    } else {
        info = await getCMC(); // USD
    }
    if (info == "error ocurred") {
        msg.channel.send(info.toString() + " Maybe wrong currency code?");
    } else {
        let value1, value2, value3;
        try {
            value1 = info.price.toLocaleString(number_format, { style: 'currency', currency: info.currency, minimumFractionDigits: 4 });
            value2 = info.volume_24h.toLocaleString(number_format, { style: 'currency', currency: info.currency, minimumFractionDigits: 2 });
            value3 = info.market_cap.toLocaleString(number_format, { style: 'currency', currency: info.currency, minimumFractionDigits: 2 });
        } catch (error) {
            value1 = info.price.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " " + info.currency;
            value2 = info.volume_24h.toLocaleString(number_format, { minimumFractionDigits: 2 }) + " " + info.currency;
            value3 = info.market_cap.toLocaleString(number_format, { minimumFractionDigits: 2 }) + " " + info.currency;
        }
        let embed = new MessageEmbed()
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
        msg.channel.send({ embeds: [embed] });
    }

}


export { price };