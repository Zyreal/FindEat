"use client"
import React, {useState} from 'react'
import axios from 'axios'

export default function Home() {
  const [search, setSearch] = useState('')
  const [restaurant, setRestaurant] = useState([])
  const [message, setMessage] = useState('Search for restaurants to see results')

  const handleSearch = async (searchQuery = search) => {
    try {
      console.log(search)
      const res = await axios.post('http://localhost:5000/get_reviews', {
        restaurant: search
      })
      console.log(res)
      if ('error' in res.data[0]) {
        setRestaurant([])
        setMessage('Invalid address')
      }
      else {
        setRestaurant(res.data)
      }
    } catch (err) {
      console.log(err)  
    }
    setSearch('')
  }

  async function currLocation() {
    const getCoords = async () => {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
  
      return {
        long: pos.coords.longitude,
        lat: pos.coords.latitude,
      };
  };
  
  const coords = await getCoords();
  try {
    const location = coords['lat'] + ", " + coords['long']
    const res = await axios.post('http://localhost:5000/get_reviews', {
      restaurant: location
    })
    console.log(res)
    if ('error' in res.data[0]) {
      setRestaurant([])
      setMessage('Invalid address')
    }
    else {
      setRestaurant(res.data)
    }
  } catch (err) {
    console.log(err)  
  }
  setSearch('')
  }

  return (
   <div className="flex flex-col justify-center items-center w-full  mx-auto">
    <div className="text-center mt-7 text-3xl">
      Welcome to FindEat
    </div>
    <div className="relative w-full max-w-md mt-3 flex">
      <input className="flex-grow pl-4 pr-2 py-2 border border-r-0 border-amber-700 rounded-l-lg overflow-ellipsis" placeholder="Enter location"
        value={search} 
        onChange={(e) => setSearch(e.target.value)}
      />
      <button className="right-0 top-0 bottom-0 px-4 bg-gray-600 text-white hover:bg-gray-700 cursor-pointer whitespace-nowrap text-sm"
      onClick={() => handleSearch()}>
        Search
      </button>
      <button className="right-0 top-0 bottom-0 px-4 bg-red-600 text-white rounded-r-lg hover:bg-red-700 cursor-pointer whitespace-nowrap text-sm"
      onClick={() => currLocation()}>
        Current Location</button>
    </div>
    <div className="mt-8 w-full max-w-4xl bg-white rounded-lg shadow-md overflow-hidden">
        {restaurant.length > 0 ? (
          <div>
            <div className="bg-amber-500 text-white px-6 py-3 font-medium">
              Restaurants
            </div>
            {restaurant.map((review) => (
              <div
                key={review['place_id']}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 p-4 font-medium text-amber-700 border-b md:border-b-0 md:border-r border-gray-200">
                    {review['name']}
                  </div>
                  <div className="w-full md:w-2/3 p-4 text-gray-700">
                    {review['review']}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 text-center text-gray-500">
            {message}
          </div>
        )}
    </div>
   </div>
  );
}
