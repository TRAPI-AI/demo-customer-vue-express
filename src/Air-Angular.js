typescript
// Import necessary Angular modules and components
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-example',
  template: `
    <div>
      <h1>{{ title }}</h1>
      <p>Welcome to the example component!</p>
      <form [formGroup]="apiForm" (ngSubmit)="onSubmit()">
        <div>
          <label for="origin">Origin:</label>
          <input id="origin" formControlName="origin" type="text" required />
        </div>
        <div>
          <label for="destination">Destination:</label>
          <input id="destination" formControlName="destination" type="text" required />
        </div>
        <div>
          <label for="departureDate">Departure Date:</label>
          <input id="departureDate" formControlName="departureDate" type="date" required />
        </div>
        <div>
          <label for="departureTime">Departure Time:</label>
          <input id="departureTime" formControlName="departureTime" type="time" required />
        </div>
        <div>
          <label for="age">Age:</label>
          <input id="age" formControlName="age" type="number" required />
        </div>
        <button type="submit" [disabled]="loading">Submit</button>
        <div *ngIf="loading">Loading...</div>
      </form>
      <div *ngIf="results.length > 0">
        <h2>Results</h2>
        <ul>
          <li *ngFor="let result of results">
            Price: {{ result.price }} {{ result.currency }}
          </li>
        </ul>
      </div>
    </div>
  `,
  styleUrls: ['./app.component.css'] // Assuming App.css is in the same directory
})
export class ExampleComponent {
  title = 'Example Component';
  apiForm: FormGroup;
  loading = false;
  results: { price: string, currency: string }[] = [];

  constructor(private fb: FormBuilder) {
    this.apiForm = this.fb.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      departureDate: ['', Validators.required],
      departureTime: ['', Validators.required],
      age: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Component initialization logic here
  }

  onSubmit() {
    if (this.apiForm.valid) {
      this.loading = true;
      const { origin, destination, departureDate, departureTime, age } = this.apiForm.value;

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

      fetch('http://localhost:5000/silverrail-shop-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml'
        },
        body: xmlPayload
      })
      .then(response => response.text())
      .then(text => {
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
        this.loading = false;
      })
      .catch((error) => {
        console.error('Error:', error);
        this.loading = false;
      });
    }
  }
}
// 