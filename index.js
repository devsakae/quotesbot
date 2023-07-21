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

async function start(client) {
  client.onAnyMessage((message) => {
    if (message.body.startsWith('!')) {
      if (message.groupInfo.id === process.env.GROUP_1_ID) return commands(client, message, process.env.GROUP_1_NAME);
      if (message.groupInfo.id === process.env.GROUP_2_ID) return commands(client, message, process.env.GROUP_2_NAME);
      if (message.groupInfo.id === process.env.GROUP_3_ID) return commands(client, message, process.env.GROUP_3_NAME);
    }
    return;
  });
}

async function commands(client, message, collection) {
  // Verifica se é pedido de quote aleatória e entrega
  if (message.body === '!quote') {
    const allquotes = await db.collection(collection).find({}).toArray();
    const randomNum = Math.floor(Math.random() * allquotes.length);
    return client.sendText(message.from, `"${allquotes[randomNum].quote}" (${allquotes[randomNum].autor}, ${allquotes[randomNum].data})`)
  }
  
  // Não é aleatória? Bora ver o que é
  const firstWord = message.body.substring(0, message.body.indexOf(' ')).toLowerCase();
  const content = message.body.substring(message.body.indexOf(' ')).trim();

  // Switch/case para verificar !quote, !addquote e !delquote
  switch (firstWord) {
    case '!quote':
      // Busca na database
      const foundquote = await db.collection(collection).find({ $or: [{ quote: { $regex: content, $options: 'i' } }, { autor: { $regex: content, $options: 'i' } }] }).toArray();

      // Não achou nada
      if (foundquote.length === 0) return client.sendText(message.from, 'Tem nada disso aí aqui 😫');

      // Achou mais de 1
      if (foundquote.length > 1) {
        client.sendText(message.from, `Essa é uma das ${foundquote.length} quotes que encontrei`)
        // Achou mais de 3
        if (foundquote.length > 5) {
          client.sendText(message.from, 'Refina sua pesquisa porque eu não vou me dar ao luxo de fazer o papel que cabe à tua memória')
          break;
        }
      }
      // Devolve uma quote (a única, ou aleatória se houverem 5)
      client.sendText(message.from, `"${foundquote[Math.floor(Math.random() * foundquote.length)].quote}" (${foundquote[0].autor}, ${foundquote[0].data})`)
      break;

    // Adiciona uma quote nova na coleção do grupo
    case '!addquote':
      const knife = content.indexOf(':');
      if (knife === -1 || content.substring(0, knife).indexOf(',') === -1) return client.sendText(message.from, 'Aprende a adicionar quote seu burro 🙈');
      // Adiciona mais 1 na conta da coleção config
      const autor = content.substring(0, knife).trim().split(',')[0];
      const data = content.substring(content.indexOf(',') + 2, knife).trim();
      const newcontent = content.substring(knife + 2);
      const quote = {
        quote: newcontent,
        autor: autor,
        data: data,
      }
      await db.collection('config_database').updateOne({}, { $inc: { [collection]: 1 } })
      const result = await db.collection(collection).insertOne(quote);
      client.sendText(message.from, `✔️ Quote salva (id: ${result.insertedId})`)
      break;

    // Apaga quotes por meio do id
    case '!delquote':
      if (message.author !== process.env.BOT_OWNER) return;
      try {
        await db.collection(collection).deleteOne({ id: content })
        await db.collection('config_database').updateOne({}, { $inc: { [collection]: -1 } })
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
    await mongoclient.db("admin").command({ ping: 1 }).then((response) => {
      if (response) console.log('MongoDB: Conexão realizada, aguarde...')
    });
    const totalquotesgroup1 = await mongoclient.db('quotes').collection(process.env.GROUP_1_NAME).countDocuments() || 0;
    const totalquotesgroup2 = await mongoclient.db('quotes').collection(process.env.GROUP_2_NAME).countDocuments() || 0;
    const totalquotesgroup3 = await mongoclient.db('quotes').collection(process.env.GROUP_3_NAME).countDocuments() || 0;
    await mongoclient.db('quotes').collection('config_database').replaceOne(
      {},
      {
        owner: process.env.BOT_OWNER,
        [process.env.GROUP_1_NAME]: totalquotesgroup1,
        [process.env.GROUP_2_NAME]: totalquotesgroup2,
        [process.env.GROUP_3_NAME]: totalquotesgroup3,
      },
      {
        upsert: true
      }
    )
    console.log("MongoDB: Configurações feitas");
  } catch (err) {
    console.error(err);
  }
}
run();