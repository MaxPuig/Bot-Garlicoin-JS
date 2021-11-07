import { saveUser } from './utils.js';
import { MessageEmbed } from 'discord.js';


async function register(msg, prefix) {
    let answer = await saveUser(msg.author.id, msg.content, prefix);
    let embed = new MessageEmbed()
        .setColor('#E67E22')
        .setTitle('Wallet registration')
        .setThumbnail('https://s2.coinmarketcap.com/static/img/coins/200x200/2475.png')
        .setDescription(answer)
    msg.channel.send({ embeds: [embed] });
}


export { register };