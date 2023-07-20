import { MongoClient, ServerApiVersion } from 'mongodb';
import { create } from 'venom-bot';
import * as dotenv from 'dotenv';
dotenv.config()

const uri = process.env.MONGODB_URI;

const mongoclient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const db = mongoclient.db('quotes');

create({
  session: 'quotebot',
  multidevice: true
})
  .then((client) => start(client))
  .catch((erro) => console.log(erro))

async function start(client) { client.onAnyMessage((message) => commands(client, message)); }

async function commands(client, message) {
  let collection;
  if (message.author !== process.env.BOT_OWNER) return;
  if (message.groupInfo.id === '554888069696-1503404993@g.us') collection = 'fewk'
  if (message.groupInfo.id === '554896059196-1392584319@g.us') collection = 'tigrelog'
  const firstWord = message.body.substring(0, message.body.indexOf(' ')).toLowerCase();
  const content = message.body.substring(message.body.indexOf(' ')).trim();
  switch (firstWord) {
    case '!quote':
      if (!content) return;
      // Pega as quotes buscando no autor e no conteúdo
      const foundquote = await db.collection(collection).find({ $or: [{ quote: { $regex: content, $options: 'i' } }, { autor: { $regex: content, $options: 'i' } }] }).toArray();
      if (foundquote.length === 0) return client.sendText(message.from, 'Não achei nada, dotô 😫');
      if (foundquote.length > 1) {
        client.sendText(message.from, `Encontrei ${foundquote.length} quotes buscando por "_${content}_"`)
        if (foundquote.length > 3) {
          client.sendText(message.from, 'Refina sua pesquisa porque eu não vou me dar ao luxo de fazer o papel que cabe à tua memória')
          break;
        }
      }
      client.sendText(message.from, `"${foundquote[Math.floor(Math.random() * foundquote.length)].quote}" (${foundquote[0].autor}, ${foundquote[0].data})
      
De todas as minhas ${foundquote.length} quotes guardadas, essa é a melhor 🤣`)
      break;
    case '!addquote':
      // !addquote Rodrigo Sakae, 2023: Estou criando um bot novo de quote no whatsapp.
      const knife = content.indexOf(':');
      const autor = content.substring(0, knife).trim().split(',')[0];
      const data = content.substring(content.indexOf(',') + 2, knife).trim();
      const newcontent = content.substring(knife + 2);
      const quote = {
        quote: newcontent,
        autor: autor,
        data: data,
      }
      const result = await db.collection(collection).insertOne(quote);
      client.sendText(message.from, `✔️ Quote anotada no caderninho 🗒

${quote.autor} disse em ${quote.data}: "${quote.quote}"

Vou lembrar disso pelo tempo em que o Sakae pagar o bot.
▪️ id: ${result.insertedId}
▪️ coleção: #${collection}`)
      break;
    default:
      break;
  }
}

async function run() {
  try {
    await mongoclient.connect();
    await mongoclient.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB sucessfully");
  } catch (err) {
    console.error(err);
  }
}
run();