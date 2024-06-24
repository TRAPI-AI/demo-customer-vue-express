javascript
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const { parseStringPromise } = require('xml2js');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.text({ type: 'text/xml' }));

app.post('/silverrail-shop-tickets', async (req, res) => {
  const headers = {
    'Content-Type': 'text/xml',
  };
  const certPath = 'combined_unencrypted.pem';
  const xmlPayload = req.body;

  try {
    const response = await axios.post(
      'https://xml-cert-nex.railgds.net/shopping-ws/services/Shopping/v2',
      xmlPayload,
      {
        headers: headers,
        httpsAgent: new (require('https').Agent)({
          cert: fs.readFileSync(certPath),
        }),
      }
    );

    const responseXml = await parseStringPromise(response.data);
    const priceElements = responseXml['soapenv:Envelope']['soapenv:Body'][0]['shop:pointToPointShoppingResponse'][0]['shop:pointToPointPrice'];

    let newResponse = '<Prices>';
    priceElements.forEach((elem) => {
      newResponse += new xml2js.Builder().buildObject(elem);
    });
    newResponse += '</Prices>';

    res.set('Content-Type', 'text/xml');
    res.send(newResponse);
  } catch (error) {
    console.error(`Failed to fetch data from SilverRail API: ${error}`);
    res.status(500).send(`<error>Failed to fetch data from SilverRail API: ${error}</error>`);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
