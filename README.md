# tradingview-oscillator-trader
Trades on FTX based on inputs from a TradingView oscillator's slope change, logging in a Discord channel

Requires TradingView Premium for always on indicators.

## Code Config
- `creds`
  - `key`: FTX api key (str)
  - `secret`: FTX secret key (str)
- `params`
  - `market`: The perpetual market you wish to trade on (ex. `"ETH-PERP"`) (str)
  - `lev`: The leverage multiplier you wish to trade on (number)
  - `stopLoss`: The stop loss to set in decimals (2.5% = `0.025`) (number)
  - `period`: The period identifier set in your TradingView alert (read more below) (str)
- `channels`
  - `alert`: The Discord channel id where TradingView alerts will be automatically sent (str)
  - `log`: A list of Discord channel ids where trade alerts and updates will be posted (str)
  - `webhook`: The id of a webhook created in the `alert` channel (str)
- `owner`: The Discord user id of a user which will be the owner of the bot
- `token`: The token of the bot.

## TradingView Config
You will need to create an always on TradingView alert for your oscillator.

It should look like this:
![image](https://user-images.githubusercontent.com/72151847/135940326-4d7fd620-8bfc-41a7-bd44-3d416dbf6ea8.png)
Make sure to pick the correct timeframe while making your indicator.

Entering the correct Discord webhook URL into the alert actions box.

The message:
`{"content": "{\"time\": \"{{time}}\",\"value\":{{plot_0}},\"close\":{{close}},\"period\":\"<EDIT THIS>\"}"}`

Replace `<EDIT THIS>` with a unique identifier for this timeframe and coin. This will be your `period` in `params` in your `config.json`.
