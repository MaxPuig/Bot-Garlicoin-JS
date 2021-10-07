import { setDatabase } from './database.js';


function set_prefix(msg, prefixes) {
    let newPrefix = msg.content.split(" ")[1];
    if (newPrefix === undefined) {
        msg.channel.send("Please specify a prefix.");
        return prefixes;
    }
    prefixes[msg.guild.id] = newPrefix;
    setDatabase('customPrefix', prefixes);
    msg.channel.send("Prefix changed to " + newPrefix + "\nCommands now trigger like this: `" + newPrefix + "help`");
    return prefixes;
}


export { set_prefix };