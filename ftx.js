const { RestClient } = require('ftx-api')
const config = require("./config.json")

const client = new RestClient(config.creds.key, config.creds.secret)

async function value() {
  return (await client.getBalances()).result.find(coin => coin.coin === "USD").total
}

async function fee() {
  return (await client.getAccount()).result.takerFee
}

async function price() {
  return (await client.getMarket(config.params.market)).result.price
}

async function open(side) {
  const currentPrice = await price()
  const size = (await value() * config.params.lev) / currentPrice
  const openResult = (await client.placeOrder({
    market: config.params.market,
    side: side,
    price: null,
    type: "market",
    size: size,
  }).catch(e => console.log(e)))?.result

  await stop(side === "buy" ? "sell" : "buy", size, currentPrice)

  return openResult
}

async function position() {
  return (await client.getPositions()).result.find(position => position.future === config.params.market)
}

async function close() {
  const openPosition = await position()
  if (openPosition?.openSize) {
    const closeResult = (await client.placeOrder({
      market: config.params.market,
      side: openPosition.side === "buy" ? "sell" : "buy",
      price: null,
      type: "market",
      size: openPosition.openSize,
    }).catch())?.result
    await cancelTriggers()
    return closeResult
  }
  return  
}

async function stop(side, size, price) {
  return (await client.placeTriggerOrder({
    market: config.params.market,
    side: side,
    size: size,
    type: "stop",
    reduceOnly: true,
    retryUntilFilled: true,
    triggerPrice: price * (side === "buy" ? 1 + config.params.stopLoss : 1 - config.params.stopLoss),
  }).catch(e => console.log(e)))?.result
}

async function cancelTriggers() {
  const openTriggers = (await client.getOpenTriggerOrders()).result.map(order => order.id)
  return await Promise.all(openTriggers.map(orderId => client.cancelOpenTriggerOrder(orderId)))
}

module.exports = {
  client,
  value,
  fee,
  price,
  open,
  close,
  position,
  stop,
  cancelTriggers
}