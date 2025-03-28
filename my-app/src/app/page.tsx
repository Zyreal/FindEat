"use client"
import React, {useState} from 'react'
import axios from 'axios'

export default function Home() {
  const [search, setSearch] = useState('')
  const [restaurant, setRestaurant] = useState([])

  const handleSearch = async () => {
    try {
      const res = await axios.post('http://localhost:5000/get_reviews', {
        restaurant: search
      })
      console.log(res)
      if ('error' in res.data[0]) {
        setRestaurant([])
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
      WELCOME TO FINDEAT
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
      <button className="right-0 top-0 bottom-0 px-4 bg-red-600 text-white rounded-r-lg hover:bg-red-700 cursor-pointer whitespace-nowrap text-sm">
        Current Location</button>
    </div>
    <div className='mt-5 pl-3 w-full max-w-6xl'>
      {
        restaurant.map((review) => (
          <div
          key={review['place_id']}
          className=''>
            <div className='flex'>
              <div className='w-full max-w-1/3 border-r-2 border-b-2 pl-2'>
                {review['name']}
              </div>
              <div className='w-full pl-3 border-b-2'>
                {review['review']}
              </div>
            </div>


          </div>

        ))
      }
    </div>
   </div>
  );
}
