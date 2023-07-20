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
  const firstWord = message.body.substring(0, message.body.indexOf(' ')).toLowerCase();
  const content = message.body.substring(message.body.indexOf(' ')).trim();
  
  // Tem mais grupos? Adiciona mais linhas!
  if (message.groupInfo.id === process.env.GROUP_1_ID) collection = process.env.GROUP_1_NAME;
  if (message.groupInfo.id === process.env.GROUP_2_ID) collection = process.env.GROUP_2_NAME;
  console.log('content ->', content, '<- deu algo?')

  // Switch/case para verificar !quote, !addquote e !delquote
  switch (firstWord) {
    case '!quote':
      if (!content) {
        // const randomQuote = await db.collection(collection).aggregate([{ $sample: { size: 1 } }]);
        // console.log(randomQuote);
        client.sendText(message.from, `"${randomQuote.quote}" (${randomQuote.autor}, ${randomQuote.data})
      
Tenho ${foundquote.length} quotes guardadas, essa aqui supera T-O-D-A-S 😜`)
      }
      const foundquote = await db.collection(collection).find({ $or: [{ quote: { $regex: content, $options: 'i' } }, { autor: { $regex: content, $options: 'i' } }] }).toArray();
      if (foundquote.length === 0) return client.sendText(message.from, 'Não achei nada, dotô 😫');
      if (foundquote.length > 1) {
        client.sendText(message.from, `Encontrei ${foundquote.length} quotes buscando por _${content}_`)
        if (foundquote.length > 3) {
          client.sendText(message.from, 'Refina sua pesquisa porque eu não vou me dar ao luxo de fazer o papel que cabe à tua memória')
          break;
        }
      }
      client.sendText(message.from, `"${foundquote[Math.floor(Math.random() * foundquote.length)].quote}" (${foundquote[0].autor}, ${foundquote[0].data})
      
▪️ id: ${foundquote._id}
▪️ coleção: #${collection}`)
      break;

    // !addquote Rodrigo Sakae, 2023: Estou criando um bot novo de quote no whatsapp.
    case '!addquote':
      if (message.author !== process.env.BOT_OWNER) return;
      await db.collection('config_database').updateOne({ $inc: { [collection]: 1 } })
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
      client.sendText(message.from, `✔️ Quote anotada! ENTROU PROS ANAIS

${quote.autor} disse em ${quote.data}: "${quote.quote}"

▪️ id: ${result.insertedId}
▪️ coleção: #${collection}`)
      break;

    // Apaga quotes por meio do id
    case '!delquote':
      if (message.author !== process.env.BOT_OWNER) return;
      try {
        await db.collection('config_database').updateOne({ $inc: { [collection]: -1 } })
        await db.collection(collection).deleteOne({ id: content })
      } catch {
        client.sendText(message.from, `Erro. Tem certeza que a quote ${content} existe?`)
      } finally {
        client.sendText(message.from, `Quote ${content} deletada com sucesso`)
      }
    default:
      break;
  }
}

async function run() {
  try {
    await mongoclient.connect();
    await mongoclient.db("admin").command({ ping: 1 });
    await mongoclient.db('quotes').collection('config_database').insertOne(
      {
        owner: process.env.BOT_OWNER,
        [process.env.GROUP_1_NAME]: 0,
        [process.env.GROUP_2_NAME]: 0
      }
    )
    console.log("Conexão com MongoDB realizada. Configurações feitas.");
  } catch (err) {
    console.error(err);
  }
}
run();