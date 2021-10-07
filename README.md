# Bot-Garlicoin-JS
Discord bot that sends info about garlicoin and user's wallets.
Make transactions on the GRLC testnet using slash commands.

# Commands
- `!prefix` --> Changes the prefix of commands. ("!" by default) (Only triggerable by Server Admins)
- `!price` --> Current price of GRLC. Also accepts !price {other currency} --> !price eur
- `!register {Address}` --> Saves user address to userWallets.json (!register forget --> to remove the address from the file)
- `!info` --> Info about pool / (pool+user if registered)
- `!balance` --> Balance of registered wallet. Also accepts !balance {other currency} --> !balance eur
- `/wallet` --> Send tGRLC (testnet) using slash commands.More info `/wallet help`

# SETUP
- install node.js >= 16.6.0
  - Windows/macOS: https://nodejs.org/es/download/current/
  - Linux:
    ```
    sudo apt update
    sudo apt install nodejs
    sudo apt install npm
    sudo npm cache clean -f
    sudo npm install -g n
    sudo n latest
    ```
- clone repository: `git clone https://github.com/MaxPuig/Bot-Garlicoin-JS.git`
- Download needed packages: `npm install`
- create ".env" file like follows:
  ```
  # Discord Token
  TOKEN = 'Your.Discord.Token'

  # CoinMarketCap Token
  TOKENCMC = 'CoinMarketCapToken'
  
  # RPC config
  USER = 'user'
  PASSWORD = 'password'
  HOST_IP = '127.0.0.1'
  PORT = '42068
  ```
-  Run bot `node index.js`