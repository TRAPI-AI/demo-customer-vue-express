
// Import necessary libraries
import React, { useState } from 'react';

// Define the Trains component
const Trains = () => {
  // Define state variables
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  // Define the API call handler
  const handleSearch = async () => {
    setLoading(true);
    const xmlPayload = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://www.railgds.net/shopping-ws/services/Shopping/v2">
        <soapenv:Header>
          <v2:Context>
            <v2:distributorCode></v2:distributorCode>
            <v2:pointOfSaleCode></v2:pointOfSaleCode>
            <v2:channelCode></v2:channelCode>
          </v2:Context>
        </soapenv:Header>
        <soapenv:Body>
          <v2:pointToPointShoppingRequest>
            <v2:pointToPointShoppingQuery>
              <v2:travelPointPairs>
                <v2:travelPointPair>
                  <v2:originTravelPoint>${origin}</v2:originTravelPoint>
                  <v2:destinationTravelPoint>${destination}</v2:destinationTravelPoint>
                  <v2:departureDateTimeWindow>${departureDate}T${departureTime}:00</v2:departureDateTimeWindow>
                </v2:travelPointPair>
              </v2:travelPointPairs>
              <v2:passengerSpecs>
                <v2:passengerSpec>
                  <v2:age>${age}</v2:age>
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
          'Content-Type': 'text/xml',
        },
        body: xmlPayload,
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

      // Adjust the XPath to correctly target the totalPrice element
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
        const price = node.textContent; // Ensure this is the correct node containing the price
        const currency = node.getAttribute("currency"); // Ensure the currency attribute exists

        if (price && currency) {
          extractedPrices.push({ price, currency });
        }
      }

      setResults(extractedPrices);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="search-area">
        <div className="search">
          {/* Input fields */}
          <input
            type="text"
            placeholder="Origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <input
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <input
            type="date"
            placeholder="Departure Date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
          />
          <input
            type="time"
            placeholder="Departure Time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>
        </div>
      </div>
      {/* Loading indicator */}
      {loading && <div>Loading...</div>}
      {/* Response items */}
      <ul>
        {results.map((result, index) => (
          <li key={index} className="offer-item">
            {result.currency} {result.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Trains;
// End of React component
