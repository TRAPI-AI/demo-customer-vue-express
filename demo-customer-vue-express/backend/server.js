javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.text({ type: 'text/xml' }));

app.post('/silverrail-shop-tickets', async (req, res) => {
  const headers = {
    'Content-Type': 'text/xml',
  };
  const certPath = 'combined_unencrypted.pem';

  try {
    const response = await axios.post(
      'https://xml-cert-nex.railgds.net/shopping-ws/services/Shopping/v2',
      req.body,
      {
        headers: headers,
        httpsAgent: new https.Agent({
          cert: fs.readFileSync(certPath),
        }),
      }
    );

    const responseXml = response.data;
    const priceElements = responseXml.match(/<shop:pointToPointPrice[^>]*>[\s\S]*?<\/shop:pointToPointPrice>/g);

    let newResponse = '<Prices>';
    if (priceElements) {
      newResponse += priceElements.join('');
    }
    newResponse += '</Prices>';

    res.set('Content-Type', 'text/xml');
    res.send(newResponse);
  } catch (error) {
    console.error(`Failed to fetch data from SilverRail API: ${error}`);
    res.status(500).send(`<error>Failed to fetch data from SilverRail API: ${error}</error>`);
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
