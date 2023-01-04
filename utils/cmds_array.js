const wallet = {
    name: 'wallet',
    description: 'Send GRLC',
    options: [{
        name: 'send',
        description: 'Send GRLC to someone.',
        type: 'SUB_COMMAND',
        options: [{
            name: 'password',
            description: 'Password you used to create the wallet.',
            type: 'STRING',
            required: true,
        }, {
            name: 'receiver',
            description: 'Address where you want to send the GRLC.',
            type: 'STRING',
            required: true
        }, {
            name: 'amount',
            description: 'How much you want to send. **Dot** for decimal place.',
            type: 'STRING',
            required: true
        }, {
            name: 'op_return',
            description: '(Optional) Message that will be included in the block. (max 80 chars)',
            type: 'STRING',
            required: false
        }, {
            name: 'change_address',
            description: '(Optional) Where the rest of the coins will go. (Blank = Sender)',
            type: 'STRING',
            required: false
        }]
    }, {
        name: 'my_address',
        description: 'Get the address corresponding to your password.',
        type: 'SUB_COMMAND',
        options: [{
            name: 'password',
            description: 'Password you used to create the wallet.',
            type: 'STRING',
            required: true,
        }]
    }, {
        name: 'balance',
        description: 'Get the balance of an address or the one related to your password.',
        type: 'SUB_COMMAND',
        options: [{
            name: 'address_or_password',
            description: 'Will it be an address or a password?',
            type: 'STRING',
            required: true,
            choices: [{
                name: 'address',
                value: 'address'
            }, {
                name: 'password',
                value: 'password'
            }]
        }, {
            name: 'value',
            description: 'The address or your wallet',
            type: 'STRING',
            required: true
        }]
    }, {
        name: 'help',
        description: 'More info on how this works.',
        type: 'SUB_COMMAND'
    }]
}


const all_commands_array = [wallet];
export { all_commands_array }