import { MessageEmbed } from 'discord.js';
import { sendInfo } from './utils.js';
const number_format = "en-US";

async function network_miner_info(msg, prefix) {
    let info = await sendInfo(msg.author.id, prefix);
    if (info.type == "no_wallet") {
        let embed = new MessageEmbed()
            .setColor('#E67E22')
            .setTitle('FreshGarlicBlocks Info')
            .setURL('https://www.freshgarlicblocks.net/')
            .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
            .addFields(
                { name: "FreshG's Pool", value: info.poolAvgHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                { name: 'Network', value: info.totalHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                { name: 'Workers', value: info.workers.toString() },
                { name: 'Difficulty', value: info.diff.toString() },
                { name: 'Block Reward', value: info.reward + " 🧄" }
            )
            .setFooter(info.error);
        msg.channel.send({ embeds: [embed] });
    } else if (info.type == "instant") {
        let embed = new MessageEmbed()
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
                { name: 'Workers', value: info.workers.toString() },
                { name: 'Difficulty', value: info.diff.toString() },
                { name: 'Block Reward', value: info.reward + " 🧄" }
            )
        msg.channel.send({ embeds: [embed] });
    } else if (info.type == "daily") {
        let embed = new MessageEmbed()
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
                { name: 'Workers', value: info.workers.toString() },
                { name: 'Difficulty', value: info.diff.toString() },
                { name: 'Block Reward', value: info.reward + " 🧄" }
            )
        msg.channel.send({ embeds: [embed] });
    } else if (info.type == "error") {
        let embed = new MessageEmbed()
            .setColor('#E67E22')
            .setTitle('FreshGarlicBlocks Info')
            .setURL('https://www.freshgarlicblocks.net/')
            .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/64x64/2475.png')
            .addFields(
                { name: "FreshG's Pool", value: info.poolAvgHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                { name: 'Network', value: info.totalHash.toLocaleString(number_format, { minimumFractionDigits: 4 }) + " GH/s" },
                { name: 'Workers', value: info.workers.toString() },
                { name: 'Difficulty', value: info.diff.toString() },
                { name: 'Block Reward', value: info.reward + " 🧄" }
            )
            .setFooter(info.error);
        msg.channel.send({ embeds: [embed] });
    }
}


export { network_miner_info };