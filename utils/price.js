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
        let price = formatCurrency(info.price, info.currency, 4)
        let volume_24h = formatCurrency(info.volume_24h, info.currency, 2)
        let market_cap = formatCurrency(info.market_cap, info.currency, 2)
        let hr1_change = formatNumber(info.percent_change_1h, 2)
        let hr24_change = formatNumber(info.percent_change_24h, 2)
        let d7_change = formatNumber(info.percent_change_7d, 2)
        let embed = new MessageEmbed()
            .setColor('#E67E22')
            .setTitle('CoinMarketCap Garlicoin Info')
            .setURL('https://coinmarketcap.com/currencies/garlicoin/')
            .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
            .addFields(
                { name: 'Price', value: price },
                { name: 'Volume 24h', value: volume_24h },
                { name: 'Market Cap', value: market_cap },
                { name: '1hr Price Change', value: formatLossGain(hr1_change), inline: true },
                { name: '24hr Price Change', value: formatLossGain(hr24_change), inline: true },
                { name: '7d Price Change', value: formatLossGain(d7_change), inline: true },
            )
            .setFooter('Last Updated: ' + info.lastUpdate);
        msg.channel.send({ embeds: [embed] });
    }

}

/*
    Values starting with "-" will be red
    values starting with "+" turn green
    values without either are white
 */
function formatLossGain(value){
    if(value>0) value = "+" + value
    value = value + "%"
    return "```diff\n"+value+"\n```"
}

function formatCurrency(value, currency, minimumFractionDigits){
    try{
        return value.toLocaleString(number_format, { style: 'currency', currency: currency, minimumFractionDigits: minimumFractionDigits });
    }catch(error){
        return formatNumber(value, minimumFractionDigits) + " " + currency;
    }
}

function formatNumber(value, minimumFractionDigits){
    return value.toLocaleString(number_format, { minimumFractionDigits: minimumFractionDigits });
}

export { price };