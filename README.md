# Bot de quotes
Um bot simples que grava frases (engraçadas/interessantes) numa coleção do MongoDB, e compartilha quando solicitada.

## Instalação
1. Clone este repositório para a máquina que você vai usar (dá pra usar na EC2 da AWS!)
2. Instale as dependências (eu uso ```npm install```);
3. Renomeie ```env.example``` para ```.env``` e preencha as variáveis:
     MONGODB_URI = (começa com mongodb+srv://)
     BOT_OWNER = (seu número de telefone com DDI e DDD, e termina com @c.us => Ex.: 55119...@c.us)
5. Rode com ```npm start```;
6. Abra seu aplicativo do WhatsApp e conecte o aparelho com a câmera usando o QR Code que vai aparecer no terminal;

## How to use it?
Somente o proprietário pode adicionar novos quotes usando

```!addquote devsakae, 2022: Eu vou criar um bot só de quotes, você vai ver```

```!addquote devsakae, 2023: Criei o meu bot de quotes!```

Pesquise por quotes usando
```!quote devsakae```
ou
```!quote bot```
