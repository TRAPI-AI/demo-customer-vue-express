vue
<template>
  <div class="hello">
    <input type="text" placeholder="Distributor Code" v-model="distributorCode" />
    <input type="text" placeholder="Point of Sale Code" v-model="pointOfSaleCode" />
    <input type="text" placeholder="Channel Code" v-model="channelCode" />
    <input type="text" placeholder="Origin" v-model="origin" />
    <input type="text" placeholder="Destination" v-model="destination" />
    <input type="date" placeholder="Departure Date" v-model="departureDate" />
    <input type="time" placeholder="Departure Time" v-model="departureTime" />
    <input type="number" placeholder="Passenger Age" v-model="age" />
    <button @click="search">Search</button>
    <div v-if="loading">Loading...</div>
    <ul>
      <li>{{ item1 }}</li>
      <li>{{ item2 }}</li>
      <li>{{ item3 }}</li>
    </ul>
    <div v-if="results.length">
      <h3>Extracted Prices</h3>
      <ul>
        <li v-for="(result, index) in results" :key="index">
          {{ result.currency }}: {{ result.price }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data() {
    return {
      distributorCode: '',
      pointOfSaleCode: '',
      channelCode: '',
      origin: '',
      destination: '',
      departureDate: '',
      departureTime: '',
      age: '',
      item1: '',
      item2: '',
      item3: '',
      loading: false,
      results: []
    };
  },
  methods: {
    async search() {
      this.loading = true;
      const xmlPayload = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://www.railgds.net/shopping-ws/services/Shopping/v2">
          <soapenv:Header>
            <v2:Context>
              <v2:distributorCode>${this.distributorCode}</v2:distributorCode>
              <v2:pointOfSaleCode>${this.pointOfSaleCode}</v2:pointOfSaleCode>
              <v2:channelCode>${this.channelCode}</v2:channelCode>
            </v2:Context>
          </soapenv:Header>
          <soapenv:Body>
            <v2:pointToPointShoppingRequest>
              <v2:pointToPointShoppingQuery>
                <v2:travelPointPairs>
                  <v2:travelPointPair>
                    <v2:originTravelPoint>${this.origin}</v2:originTravelPoint>
                    <v2:destinationTravelPoint>${this.destination}</v2:destinationTravelPoint>
                    <v2:departureDateTimeWindow>${this.departureDate}T${this.departureTime}:00</v2:departureDateTimeWindow>
                  </v2:travelPointPair>
                </v2:travelPointPairs>
                <v2:passengerSpecs>
                  <v2:passengerSpec>
                    <v2:age>${this.age}</v2:age>
                  </v2:passengerSpec>
                </v2:passengerSpecs>
              </v2:pointToPointShoppingQuery>
            </v2:pointToPointShoppingRequest>
          </soapenv:Body>
        </soapenv:Envelope>
      `;

      try {
        const response = await fetch('http://localhost:5000/silverrail-shop-tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml'
          },
          body: xmlPayload
        });

        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const nsResolver = (prefix) => {
          const ns = {
            ns0: "http://railgds.net/ws/commontypes",
            ns2: "http://railgds.net/ws/shopping",
          };
          return ns[prefix] || null;
        };

        const priceNodes = xmlDoc.evaluate(
          "//ns2:pointToPointPrice/ns0:totalPrice",
          xmlDoc,
          nsResolver,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );

        const extractedPrices = [];
        for (let i = 0; i < priceNodes.snapshotLength; i++) {
          const node = priceNodes.snapshotItem(i);
          const price = node.textContent;
          const currency = node.getAttribute("currency");

          if (price && currency) {
            extractedPrices.push({ price, currency });
          }
        }

        this.results = extractedPrices;
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
/* Add your styles here */
</style>
