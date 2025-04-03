import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OwnerVehicleReviews = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);

  useEffect(() => {
    // Fetch reviews for the vehicle
    axios.get(`http://localhost:3000/api/owner/vehicle/${vehicleId}/reviews`)
      .then(response => {
        setReviews(response.data.reviews);
        setAverageRating(response.data.averageRating);
      })
      .catch(error => {
        console.error('Error fetching reviews:', error);
      });
  }, [vehicleId]);

  // Function to render stars
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <i key={index} 
         className={`fa-star ${index < rating ? 'fas' : 'far'} text-yellow-400`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <div className="bg-white shadow-md py-4 px-6 mb-6 mt-6">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <button
          onClick={() => navigate('/ownervehicle')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                   shadow hover:bg-blue-700 transition-all transform hover:scale-105"
        >
          <i className="fas fa-arrow-left"></i>
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Vehicle Reviews</h1>
      </div>
    </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Average Rating Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Average Rating</h2>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-4xl font-bold text-blue-600">
                  {averageRating || 'N/A'}
                </span>
                <div className="flex gap-1">
                  {averageRating && renderStars(Math.round(averageRating))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-800">{reviews.length}</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <i className="far fa-comment-dots text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-semibold text-gray-700">No Reviews Yet</h2>
            <p className="text-gray-500 mt-2">This vehicle hasn't received any reviews yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reviews.map(review => (
              <div key={review._id} 
                   className="bg-white rounded-xl shadow-lg p-6 transform transition-all 
                            hover:shadow-xl hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {review.userId.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {review.userId.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <div className="ml-13">
                  <p className="text-gray-600 leading-relaxed">
                    {review.comment}
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-gray-400">
                    <p className="text-sm">
                      Status: <span className={`font-medium ${
                        review.status === 'Approved' ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {review.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerVehicleReviews;