# Importing necessary libraries
import xml.etree.ElementTree as ET
from lxml import etree
from flask import Flask, request, Response
from flask_cors import CORS
import requests

# Initializing Flask app
app = Flask(__name__)
CORS(app)

@app.route('/silverrail-shop-tickets', methods=['POST'])
def silverrail_shop_tickets():
    headers = {
        "Content-Type": "text/xml"
    }
    cert_path = "combined_unencrypted.pem"
    ns = {
        "soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
        "v2": "http://www.railgds.net/shopping-ws/services/Shopping/v2",
    }
    xml_input = etree.fromstring(request.data)
    origin_nodes = xml_input.xpath("//v2:originTravelPoint/text()", namespaces=ns)
    destination_nodes = xml_input.xpath("//v2:destinationTravelPoint/text()", namespaces=ns)
    departure_datetime_nodes = xml_input.xpath("//v2:departureDateTimeWindow/text()", namespaces=ns)
    age_nodes = xml_input.xpath("//v2:age/text()", namespaces=ns)
    origin = origin_nodes[0]
    destination = destination_nodes[0]
    age = age_nodes[0]
    departure_datetime = departure_datetime_nodes[0]
    departure_date, departure_time = departure_datetime.split("T")
    xml_payload = f"""
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:shop="http://railgds.net/ws/shopping" xmlns="http://railgds.net/ws/commontypes">
            <soapenv:Header/>
            <soapenv:Body>
                <shop:pointToPointShoppingRequest>
                    <context>
                        <distributorCode>TRAPI</distributorCode>
                        <pointOfSaleCode>GB</pointOfSaleCode>
                        <channelCode>WEB</channelCode>
                    </context>
                    <shop:pointToPointShoppingQuery>
                        <shop:travelPointPairs>
                            <shop:travelPointPair>
                                <originTravelPoint type="STATION">{origin}</originTravelPoint>
                                <destinationTravelPoint type="STATION">{destination}</destinationTravelPoint>
                                <departureDateTimeWindow>
                                    <date>{departure_date}</date>
                                    <time>{departure_time}</time>
                                </departureDateTimeWindow>
                            </shop:travelPointPair>
                        </shop:travelPointPairs>
                        <shop:passengerSpecs>
                            <shop:passengerSpec>
                                <age>{age}</age>
                            </shop:passengerSpec>
                        </shop:passengerSpecs>
                    </shop:pointToPointShoppingQuery>
                </shop:pointToPointShoppingRequest>
            </soapenv:Body>
        </soapenv:Envelope>
    """
    try:
        response = requests.post('https://xml-cert-nex.railgds.net/shopping-ws/services/Shopping/v2', data=xml_payload, headers=headers, cert=cert_path)
        response.raise_for_status()
        print(f"Response: {response.text}")
        response_xml = etree.fromstring(response.content)
        price_elements = response_xml.xpath("//shop:pointToPointPrice", namespaces={"shop": "http://railgds.net/ws/shopping"})
        new_response = etree.Element("Prices")
        for elem in price_elements:
            new_response.append(elem)
        return Response(etree.tostring(new_response), mimetype="text/xml")
    except requests.exceptions.RequestException as e:
        error_message = f"<error>Failed to fetch data from SilverRail API: {e}</error>"
        print(error_message)
        return Response(error_message, status=500, mimetype="text/xml")

# Running the app
if __name__ == "__main__":
    app.run(port=5000, debug=True)
