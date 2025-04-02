from google import genai
import requests
import os
from dotenv import load_dotenv
import json

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy

from flask_cors import CORS, cross_origin

load_dotenv()

maps_key = os.getenv("MAPS_API_KEY")
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = f"mysql+pymysql://{os.getenv("DB_USER")}:{os.getenv("DB_PASSWORD")}@localhost/{os.getenv("DB_NAME")}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # turns off SQLAlchemy event system
db = SQLAlchemy(app)


CORS(app)

# name | place_id | lat | long | review | timestamp
# might be able to remove lat and long
class Reviews(db.Model):
    name = db.Column(db.String(100), nullable=False)
    place_id = db.Column(db.String(100), primary_key = True)
    lat = db.Column(db.Float, nullable=False)
    long = db.Column(db.Float, nullable=False)
    review = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        return {
            'name': self.name,
            'place_id': self.place_id,
            'lat': self.lat,
            'long': self.long,
            'review': self.review
        }

# tries to add row to database
def add_restaurant(name, id, lat, long, rev):
    new_place = Reviews(
        name=name,
        place_id=id,
        lat=lat,
        long=long,
        review=rev
    )
    try:
        db.session.add(new_place)  
        db.session.commit()
        return new_place.to_dict()
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


# changes address to latitude and longitude
def get_long_lat(address): # limit api calls to maps api
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"""Generate the longitude and latitude coordinates of the address or 'latitude,longitude' {address} in the exact json format structure with no additional markdown formatting, explanations, code blocks, and None if not able to be found, follow this exact structure:
        {{
            "latitude": "latitude number here...",
            "longitude": "longitude number here..."
        }}
        """
    )
    process = response.text
    print(process)

    # clean up response so it can be read as json
    if "```json" in process:
        process = process.split("```json")[1].split("```")[0].strip()
    elif "```" in process:
        process = process.split("```")[1].strip()
    
    if process.startswith("`") and process.endswith("`"):
        process = process[1:-1].strip()


    processed = json.loads(process)

    if not processed["latitude"] or not processed["longitude"]:
        return None, None

    return processed["latitude"], processed["longitude"]


# get all nearby restaurants within a radius
def get_nearby_places(location, radius=1000): #2000 might be too big
    """Fetch nearby places using Google Places API"""
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        'location': location,  # "latitude,longitude"
        'radius': radius,  # Search within 2km
        'type': "restaurant",
        'key': os.getenv("MAPS_API_KEY")
    }
    response = requests.get(url, params=params)
    data = response.json()
    restaurants = []
    print(data)
    for place in data['results']:
        restaurant_info = {
            'name': place['name'],
            'place_id': place['place_id'],
            'latitude': place['geometry']['location']['lat'],
            'longitude': place['geometry']['location']['lng'],
        }
        restaurants.append(restaurant_info)
    return restaurants # gives an array of dict


# get rating of a restaurant
def get_place_rating(name, place_id, lat, long):
    # check if place_id is in database
    rating = db.session.query(Reviews).filter(Reviews.place_id == place_id).first()
    if rating:
        return rating.to_dict()
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"""Summarize in strictly under 250 characters the cuisine and ratings of the restaurant {name} at {lat},{long}.
        Do not include the longitude and latitude, or city.
        If you cannot find the restaurant or any reviews, only output "No reviews found" and nothing else: no explanation or reason
        """
    )
    return add_restaurant(name, place_id, lat, long, response.text)

@app.route('/get_reviews', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def get_all_ratings():
    address = request.get_json()['restaurant']
    print('hi')
    print(address)
    lat, long = get_long_lat(address)

    if not lat or not long:
        return [{'error': 'Invalid address'}]
    
    restaurants = get_nearby_places(f'{lat},{long}')

    ratings = []
    for r in restaurants:
        ratings.append(get_place_rating(r['name'], r['place_id'], r['latitude'], r['longitude']))
    return ratings

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=5000)