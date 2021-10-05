const config = require("./config.json")
const Discord = require("discord.js")
const fetch = require("node-fetch")
const ftx = require("./ftx.js")
const fs = require("fs")
let position = require("./position.json")
let history = require("./history.json")
let fee

function writePosition() {
  fs.writeFileSync("./position.json", JSON.stringify(position))
}

function writeHistory() {
  fs.writeFileSync("./history.json", JSON.stringify(history))
}

Number.prototype.f = function(p) {
  let parts
  if (p) {
    parts = this.toFixed(p).split(".")
  } else {
    parts = this.toString().split(".")
  }
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return parts.join(".")
}

const bot = new Discord.Client()

bot.login(config.token)

bot.on("ready", async () => {
  console.log("ready")
  fee = await ftx.fee()
})

bot.on("message", async (msg) => {
  if (msg.channel.id == config.channels.alert
   && msg.author.id == config.channels.webhook) {
    const alert = JSON.parse(msg.content)
    alert.time = new Date(alert.time).getTime()
    if (alert.period === config.params.period) {
      if ((position.side === "buy" && alert.value < position.ribbon)
       || (position.side === "sell" && alert.value > position.ribbon)) {
        await ftx.close()
        const positionDuration = (alert.time - position.time) / (60 * 1000)
        const pnl = (position.side === "buy" ? 1 : -1) * (((alert.close - position.entry) / position.entry)) - (fee * 2)
        const pnlAbsolute = pnl * position.size * alert.close
        const accValue = await ftx.value()
        const closedEmbed = {
          color: pnl > 0 ? 0x00ff00 : 0xff0000,
          title: `${position.side === "buy" ? "Long" : "Short"} Closed`,
          fields: [
            {name: "Duration", value: `${positionDuration.f()} mins`, inline: true},
            {name: "Size", value: `${position.size.f()} ${config.params.market.split("-")[0]} ($${(position.size * alert.close).f(2)})`, inline: true},
            {name: "Exit", value: alert.close, inline: true},
            {name: "PnL", value: `$${pnlAbsolute.f(2)} (${(pnl * 100).f(1)}%)`, inline: true},
            {name: "Account Value", value: `$${accValue.f(2)}`, inline: true}
          ]
        }
        for (const channel of config.channels.log) {
          bot.channels.cache.get(channel).send({embed: closedEmbed}).catch()
        }
        const openResult = await ftx.open(position.side === "buy" ? "sell" : "buy")
        position = {
          time: alert.time,
          side: position.side === "buy" ? "sell" : "buy",
          entry: alert.close,
          size: openResult.size,
          ribbon: alert.value
        }
        writePosition()
        history.push({
          t: Date.now(),
          v: accValue.toFixed(3)
        })
        writeHistory()
        const openedEmbed = {
          color: position.side === "buy" ? 0x7adbff : 0xfa85af,
          title: `${position.side === "buy" ? "Long" : "Short"} Opened`,
          fields: [
            {name: "Time", value: `${new Date(alert.time).toLocaleString()}`},
            {name: "Entry", value: position.entry, inline: true},
            {name: "Size", value: `${position.size.f()} ${config.params.market.split("-")[0]} ($${(position.size * position.entry).f(2)})`, inline: true}
          ]
        }
        for (const channel of config.channels.log) {
          bot.channels.cache.get(channel).send({embed: openedEmbed}).catch()
        }
      }
      position.ribbon = alert.value
      writePosition()
    } 
  }
  // if (config.channels.log.includes(msg.channel.id)
  //  && config.owner.includes(msg.author.id)) {
  //    if (msg.content.startsWith)
  //  }
})