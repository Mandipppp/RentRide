import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../Ui/Button';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { reactLocalStorage } from 'reactjs-localstorage';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import io from "socket.io-client";
import { Card } from '../Ui/Card';
import car from '../Images/HomeCar.png';


const socket = io("http://localhost:3000");


// Helper function to calculate the number of days between two dates
const calculateDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDifference = end - start;
  return Math.ceil(timeDifference / (1000 * 3600 * 24)); // Convert time difference to days
};


export default function UserBookedVehicleDetails() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  const [baseCost, setBaseCost] = useState(0);
  const [addOnsCost, setAddOnsCost] = useState(0);
  const [existingBookings, setExistingBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isReviewed, setIsReviewed] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isRequestingRefund, setIsRequestingRefund] = useState(false);

  

  const [totalCost, setTotalCost] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  // Form field states
  const [updatedPickAndDropLocation, setUpdatedPickAndDropLocation] = useState("");
  const [updatedStartDate, setUpdatedStartDate] = useState("");
  const [updatedEndDate, setUpdatedEndDate] = useState("");
  const [updatedPickUpTime, setUpdatedPickUpTime] = useState("");
  const [updatedDropTime, setUpdatedDropTime] = useState("");

  const [paymentUrl, setPaymentUrl] = useState("");
  const [status, setStatus] = useState(null); // 'null', 'verifying', 'success', 'failed'
  const [searchParams] = useSearchParams();

  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState("");
  const [userId, setUserId] = useState("");
  const messageContainerRef = useRef(null);
  const [receiptUrl, setReceiptUrl] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletDetails, setWalletDetails] = useState({ name: "", id: "" });
  const [rating, setRating] = useState(0); // Store rating (1-5 stars)
  const [averageRating, setAverageRating] = useState(null);
  const [comment, setComment] = useState(""); // Store comment
  const [isCancelModelOpen, setIsCancelModelOpen] = useState(false);
  const [cancelContent, setCancelContent] = useState("");
  const [agreements, setAgreements] = useState({
    cancellationPolicy: false
  });

  const handleAgreementChange = (e) => {
    setAgreements({ ...agreements, [e.target.name]: e.target.checked });
  };

  const fetchCancellation = async () => {
    try {
      const response = await axios
      .get(`http://localhost:3000/api/admin/page/getpagebyslug/cancellation-policy`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCancelContent(response.data.data.content);
    } catch (error) {
      console.error("Failed to fetch terms:", error);
      setCancelContent("<p>Failed to load terms. Please try again later.</p>");
    }
  };

const handleSubmitReview = async () => {
  if(token && booking){
    setIsSubmittingReview(true);
    try {
      const response = await axios.post('http://localhost:3000/api/user/review/post-review', 
        {
          bookingId,
          rating,
          comment,
        }, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Review Posted Successfully!!");
      setIsReviewed(true);
    }catch (err) {
      console.error("Review post Failed", err);
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setIsSubmittingReview(false);
    }
  }
};

  const handleInputChange = (e) => {
      setWalletDetails({ ...walletDetails, [e.target.name]: e.target.value });
  };

  const handleRefundRequest = async () => {
    if (!walletDetails.name || !walletDetails.id) {
      toast.error("Please enter wallet details.");
      return;
    }
    if (token) {
      setIsRequestingRefund(true);
      try {
        const response = await axios.put(`http://localhost:3000/api/user/booking/request-refund/${bookingId}`,
        {
            walletName: walletDetails.name,
            walletId: walletDetails.id
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
            toast.success("Refund request submitted successfully!");
            setIsModalOpen(false);
            // window.location.reload(); // Refresh to reflect changes
            setBooking(response.data.booking);
        }
      } catch (err) {
          console.error("Refund request failed:", err);
          toast.error(err.response?.data?.message || "Something went wrong.");
      } finally {
        setIsRequestingRefund(false);
      }
    }
  };
  
  
  useEffect(() => {
    const access_token = reactLocalStorage.get("access_token");
    if (access_token) {
      setToken(access_token);
    }
  }, []);

  useEffect(() => {
    if (token) {
      const fetchBooking= async () => {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/user/booking/getBooking/${bookingId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setBooking(response.data.booking);
          // console.log("booking", response.data.booking);

        //   console.log(response.data);
        } catch (err) {
          console.log("Failed to fetch vehicle details.");
        }
      };
      fetchBooking();
    }
  }, [bookingId, token]);

  // Fetch reviews for the vehicle
  useEffect(() => {
    const fetchReviews = async () => {
      if(booking){
      try {
        const response = await axios.get(
          `http://localhost:3000/api/user/review/vehicle/${booking.vehicleId._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setReviews(response.data.reviews);
        setAverageRating(response.data.averageRating);

        // Check if current booking has a review
        const hasReview = response.data.bookingIds.some(
          (review) => review === bookingId
        );
        // console.log(hasReview);
        setIsReviewed(hasReview);

      } catch (err) {
        console.log("Failed to fetch reviews.");
      }
    }
    };
    if (booking) {
      fetchReviews();
    }
  }, [booking, token, isReviewed]);

  useEffect(() => {
    // Recalculate the total cost whenever selected add-ons change
    const addOnsCost = selectedAddOns.reduce(
      (acc, addon) => acc + addon.pricePerDay * calculateDaysDifference(booking.startDate, booking.endDate),
      0
    );
    setAddOnsCost(addOnsCost);
    setTotalCost(baseCost + addOnsCost);
  }, [selectedAddOns, baseCost]);

  useEffect(() => {
      if (booking) {
        let initialAddOns = [];
        if(booking.bookingStatus=="Pending"){
          initialAddOns = booking.addOns || [];
        }else{
          initialAddOns = booking.approvedAddOns || [];

        }
        setSelectedAddOns(initialAddOns);
  
        if (booking.startDate && booking.endDate) {
          // Calculate number of days
          const numDays = calculateDaysDifference(booking.startDate, booking.endDate);
  
          let onlyVehicleCost = 0;
          if(booking.status=="Pending"){
          // Calculate base vehicle cost
            onlyVehicleCost = booking.vehicleId.dailyPrice * numDays;
          }else{
            onlyVehicleCost = booking.amountDue + booking.amountPaid - booking.approvedAddOns.reduce((acc, addon) => acc + addon.totalPrice, 0);
          }
  
          // Set total cost
          setBaseCost(onlyVehicleCost);
          // Set initial values for editing
        setUpdatedPickAndDropLocation(booking.pickAndDropLocation);
        setUpdatedStartDate(booking.startDate);
        setUpdatedEndDate(booking.endDate);
        setUpdatedPickUpTime(booking.pickupTime);
        setUpdatedDropTime(booking.dropTime);
        }
      }
    }, [booking]);

    

    useEffect(() => {
    if (booking) {
        const fetchExistingBookings = async () => {
        try {
            const response = await axios.get(
            `http://localhost:3000/api/user/booking/getVehicleBookings/${booking.vehicleId._id}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
            );
            setExistingBookings(response.data.bookings); // Store all bookings

        } catch (err) {
            console.error("Failed to fetch existing bookings.");
        }
        };

        fetchExistingBookings();
    }
    }, [booking, token]);

    useEffect(() => {
      if (booking){
      if (booking.bookingStatus=="Accepted" || booking.bookingStatus=="RevisionRequired" || booking.bookingStatus=="Confirmed" || booking.bookingStatus=="Active") {
          const fetchMessages = async () => {
          try {
              const response = await axios.get(
              `http://localhost:3000/api/auth/chat/${booking._id}/messages`,
              {
                  headers: { Authorization: `Bearer ${token}` },
              }
              );
              // console.log("messages: ", response.data);
              setMessages(response.data.messages || []);
              
              setChatId(response.data.chatId);
              setUserId(booking.renterId);
              if (chatId && userId) {
                socket.emit("joinChat", { chatId, userId });
              }
              scrollToBottom();
              const timeoutId = setTimeout(() => scrollToBottom(), 100);
              return () => clearTimeout(timeoutId);
          } catch (err) {
              console.error("Failed to fetch existing bookings.");
          }
          };
  
          fetchMessages();
      }}
      }, [booking, token, chatId, userId]);

      const scrollToBottom = () => {
        if (messageContainerRef.current) {
          messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
      };

      useEffect(() => {
          // Listen for incoming messages from the server
          socket.on("receiveMessage", (newMessage) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            scrollToBottom();
            const timeoutId = setTimeout(() => scrollToBottom(), 100);
            return () => clearTimeout(timeoutId);
          });
      
          // Cleanup on component unmount
          return () => {
            socket.off("receiveMessage");
          };
        }, []);

        useEffect(() => {
        socket.on("messagesSeen", ({ chatId, userId }) => {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.chatId === chatId && msg.senderId !== userId ? { ...msg, seen: true } : msg
            )
          );
        });
      
        return () => {
          socket.off("messagesSeen");
        };
      }, []);   

        const handleSendMessage = () => {
          if (messageInput && chatId && userId) {
            const newMessage = { chatId, senderId: userId, message: messageInput };
            socket.emit("sendMessage", newMessage);
            setMessageInput(""); // Clear input after sending
          }
        };

        const markMessagesAsSeen = async () => {
          if (chatId) {
            socket.emit("markSeen", { chatId, userId }); // Send event to backend
          }
        };
      

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Add padding for months less than 10
        const day = date.getDate().toString().padStart(2, '0'); // Add padding for days less than 10
        return `${year}-${month}-${day}`;
      };
  // Auto change image every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % (booking?.vehicleId?.imageUrls?.length || 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [currentImage, booking?.vehicleId?.imageUrls]);

  const handleAddOnToggle = (addon) => {
    setSelectedAddOns((prevSelected) => {
      if (prevSelected.some((item) => item.name === addon.name)) {
        return prevSelected.filter((item) => item.name !== addon.name); // Remove addon
      } else {
        return [...prevSelected, addon]; // Add addon
      }
    });
  };

  const isDateConflict = (newStartDate, newEndDate) => {
    const newStart = new Date(newStartDate);
    const newEnd = new Date(newEndDate);
  
    return existingBookings.some((existingBooking) => {
      if (existingBooking._id === booking._id) return false; // Ignore current booking
  
      const existingStart = new Date(existingBooking.startDate);
      const existingEnd = new Date(existingBooking.endDate);
  
      return (
        (newStart >= existingStart && newStart <= existingEnd) || // New start date falls within an existing booking
        (newEnd >= existingStart && newEnd <= existingEnd) || // New end date falls within an existing booking
        (newStart <= existingStart && newEnd >= existingEnd) // New range fully covers an existing booking
      );
    });
  };

  const handleDateChange = (e, type) => {
    const newDate = e.target.value;
    let updatedBooking = { ...booking };
  
    if (type === "start") {
      updatedBooking.startDate = newDate;
    } else {
      updatedBooking.endDate = newDate;
    }
  
    if (isDateConflict(updatedBooking.startDate, updatedBooking.endDate)) {
      toast.error("Selected dates conflict with another booking. Please choose different dates.");
      return;
    }
  
    setBooking(updatedBooking);
  };
  
  

  const handleDeleteAddOn = (addon) => {
    setSelectedAddOns((prevSelected) =>
      prevSelected.filter((item) => item.name !== addon.name)
    );
  };

  const handleEditBooking = async () => {
    // Prepare the updated data
    const updatedBookingData = {
      pickAndDropLocation: updatedPickAndDropLocation,
      startDate: updatedStartDate,
      endDate: updatedEndDate,
      pickupTime: updatedPickUpTime,
      dropTime: updatedDropTime,
      addOns: selectedAddOns, // Add any selected add-ons
    };
  
    try {
      const response = await axios.put(
        `http://localhost:3000/api/user/booking/editBooking/${bookingId}`,
        updatedBookingData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.status === 200) {
        // If the update is successful
        toast.success("Booking updated successfully!");
        // setBooking(response.data.booking); // Update the state with the new booking info
        // console.log(response.data.booking);
      }
    // console.log("updated data: ",updatedBookingData);
    } catch (error) {
      // Handle any errors from the API
      toast.error( error.response.data.message || "Failed to update booking. Please try again.");
      console.error("Error updating booking:", error.response?.data || error.message);
    }
  };
  
  
  const handleCancelBooking = async () => {
    // try {
    //   const response = await axios.put(
    //     `http://localhost:3000/api/user/booking/cancel/${bookingId}`,
    //     {},
    //     {
    //       headers: { Authorization: `Bearer ${token}` },
    //     }
    //   );
  
    //   toast.success("Booking cancelled successfully!");
    // } catch (error) {
    //   console.error("Cancellation failed:", error.response?.data || error.message);
    //   toast.error("Failed to cancel booking. Please try again.");
    // }
    fetchCancellation();
    setIsCancelModelOpen(true);
  };

  const proceedWithCancellation = async () => {
    if (!agreements.cancellationPolicy) {
      toast.error("Please accept all terms before continuing.");
      return;
    }
    setIsCancelling(true);

    setIsCancelModelOpen(false);
    try {
      const response = await axios.put(
        `http://localhost:3000/api/user/booking/cancel/${bookingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      toast.success("Booking cancelled successfully!");
      setBooking(response.data.booking);
      // setTimeout(() => {
      //   navigate("/myBookings");
      // }, 1500);
    } catch (error) {
      console.error("Cancellation failed:", error.response?.data || error.message);
      toast.error("Failed to cancel booking. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }


  const handleAcceptBooking = async () =>{
    try {
      const response = await axios.put(
        `http://localhost:3000/api/user/booking/acceptRevision/${bookingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Booking revised successfully!");
      setBooking(response.data.booking);
    } catch (error) {
      console.error("Cancellation failed:", error.response?.data || error.message);
      toast.error("Failed to revise booking. Please try again.");
    }
  } 

  const handlePayment = async (percentage) => {
    if (!booking) return;
    try {
      const amountToPay = parseFloat(((booking.amountDue * (percentage / 100)) * 100).toFixed(2));
      console.log("pay:",amountToPay);
      const response = await axios.post("http://localhost:3000/api/auth/payment/initiate", {
        amount: amountToPay, // Amount in paisa
        purchase_order_id: bookingId,
        purchase_order_name: booking.vehicleId.name,
        return_url: `http://localhost:5173/bookingVehicleDetails/${bookingId}`, // Redirect URL after payment
        website_url: `http://localhost:5173/bookingVehicleDetails/${bookingId}`,
        totalAmount: totalCost,
        ownerId: booking.ownerId._id
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

      setPaymentUrl(response.data.payment_url);
      window.location.href = response.data.payment_url; // Redirect to Khalti
    } catch (error) {
      console.error("Payment initiation failed:", error.response?.data);
      setStatus("failed");
    }
  }

  const handleRemainingPay = async () => {
    if (!booking) return;
    try {
      const amountToPay = parseFloat((booking.amountDue * 100).toFixed(2));
      // console.log("pay:",amountToPay);
      const response = await axios.post("http://localhost:3000/api/auth/payment/initiate", {
        amount: amountToPay, // Amount in paisa
        purchase_order_id: bookingId,
        purchase_order_name: booking.vehicleId.name,
        return_url: `http://localhost:5173/bookingVehicleDetails/${bookingId}`, // Redirect URL after payment
        website_url: `http://localhost:5173/bookingVehicleDetails/${bookingId}`,
        totalAmount: totalCost,
        ownerId: booking.ownerId._id
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

      setPaymentUrl(response.data.payment_url);
      window.location.href = response.data.payment_url; // Redirect to Khalti
    } catch (error) {
      console.error("Payment initiation failed:", error.response?.data);
      setStatus("failed");
    }
  }

  // Verify payment when payment is successful and pidx is available in the URL
  useEffect(() => {
    const verifyPayment = async () => {
      const pidx = searchParams.get("pidx");
      if (!pidx) {
        console.error("Missing pidx in URL parameters");
        return;
      }
  
      if (!token) {
        console.error("Authorization token is missing!");
        return;
      }

      if (pidx) {
        try {
          setStatus("verifying");
          const response = await axios.post("http://localhost:3000/api/auth/payment/verify", { 
            pidx
           },
          {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Payment data: ", response.data.data);
          if (response.data.data.status === "Completed") {
            setStatus("success");
            toast.success('Payment successful!');
            setReceiptUrl(`http://localhost:3000/api/auth/payment/receipt?pidx=${pidx}`);
            setBooking(response.data.booking);
          } else {
            setStatus("failed");
            toast.error('Payment verification failed. Please try again.');
          }
        } catch (error) {
          setStatus("failed");
          toast.error('Payment verification failed. Please try again.');
        } finally {
          navigate(`/bookingVehicleDetails/${bookingId}`, { replace: true });

        }
      }
    };

    verifyPayment();
  }, [searchParams.toString(), token]);
  
  if (!booking) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-2">
      
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
      <ToastContainer />

      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/myBookings")}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Back
        </button>
        <h2 className="font-bold text-xl text-gray-800 ml-6">Booking Details</h2>
      </div>

      {(booking.bookingStatus === "Completed" && !isReviewed) &&
      <div className="flex flex-col mt-8 mb-8 bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      <h3 className="font-semibold text-xl text-gray-900 mb-4">Leave a Review</h3>

      {/* Star Rating */}
      <div className="flex items-center mt-4">
        <span className="text-yellow-500 text-3xl">
          {/* Render 5 stars */}
          {[...Array(5)].map((_, index) => (
            <i
              key={index}
              className={`fa-solid fa-star fa-beat cursor-pointer transition-colors duration-300 mr-4 ${
                rating >= index + 1 ? 'text-yellow-500' : 'text-gray-300'
              }`}
              onClick={() => setRating(index + 1)} // Update rating when star is clicked
            ></i>
          ))}
        </span>
      </div>

      {/* Comment Section */}
      <div className="mt-6">
        <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">
          Your Comment
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your comment..."
          className="w-full p-4 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:outline-none transition-all duration-300 resize-none"
          rows="4"
        />
      </div>

        {/* Review Submit Button */}
        <div className="mt-6 flex justify-end">
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md shadow-md transform transition duration-300 hover:scale-105"
            onClick={handleSubmitReview}
            disabled={isSubmittingReview}
          >
            {isSubmittingReview ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </div>
          ) : (
            "Submit Review"
          )}
          </button>
        </div>
      </div>}


     
        {/* Car Image and Info */}
        <div className="flex flex-col items-left">
            {/* Image Carousel */}
        <div className="relative">
          <img
            src={`http://localhost:3000/${booking?.vehicleId?.imageUrls[currentImage]}`}
            alt="Vehicle"
            className="w-full h-64 object-contain rounded-md transition-opacity duration-500 ease-in-out"
          />
          {/* Next & Previous Buttons */}
          <button
            onClick={() => setCurrentImage((prev) => (prev > 0 ? prev - 1 : booking.vehicleId.imageUrls.length - 1))}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-300 text-white hover:bg-gray-800 px-3 py-1 rounded-full"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            onClick={() => setCurrentImage((prev) => (prev < booking.vehicleId.imageUrls.length - 1 ? prev + 1 : 0))}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-300 text-white hover:bg-gray-800 px-3 py-1 rounded-full"
          >
            <i className="fa-solid fa-chevron-left fa-rotate-180"></i>
          </button>
        </div>

        {/* Thumbnail Selector */}
        <div className="flex gap-2 mt-3 justify-center">
          {booking.vehicleId.imageUrls.map((img, index) => (
            <img
              key={index}
              src={`http://localhost:3000/${img}`}
              alt={`Thumbnail ${img}`}
              className={`w-16 h-16 object-cover cursor-pointer rounded-md ${currentImage === index ? 'border-2 border-green-500' : ''}`}
              onClick={() => setCurrentImage(index)}
            />
          ))}
        </div>

            <div className="flex flex-row justify-between">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold mt-4">{booking.vehicleId.name}</h2>
                    <p className="text-gray-500">{booking.vehicleId.type} - {booking.vehicleId.builtYear || "N\A"}</p>
                    <p className={booking.vehicleId.isVerified ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                      {booking.vehicleId.isVerified ? "Admin Verified" : "Not Admin Verified"}
                    </p>


                </div>
                <div className="flex flex-col">
                    <div className="flex items-center mt-2">
                        <i className="fa-solid fa-star text-yellow-500"></i>
                        <span className="ml-1 text-gray-600">{averageRating || "No reviews yet"}</span>
                    </div>
                    <p className="text-lg font-bold mt-2">{booking.vehicleId.dailyPrice} NPR/day</p>
                </div>
            </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center mt-8 bg-gray-50 p-2 rounded-full shadow-md">
          <img
            src={`http://localhost:3000/${booking.ownerId.kycId.documents.profilePicture.file}`}
            alt="Owner"
            className="w-12 h-12 rounded-full border-gray-300 object-cover"
          />
          <div className="ml-4">
            <p className="text-green-600 font-semibold">Owner</p>
            <p className="text-gray-800 text-lg">{booking.ownerId.name}</p>
          </div>
        </div>

        {/* Conditional Rendering of Message Box */}
        {(booking.bookingStatus === "Accepted" || booking.bookingStatus === "Confirmed" || booking.bookingStatus === "RevisionRequired" || booking.bookingStatus=="Active") && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">Chat with Owner</h3>
            
            <div className="flex flex-col h-72">
              {/* Messages Container */}
              <div ref={messageContainerRef} className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-200">
                {messages.length > 0 ? (
                  messages.map((message, index) => {
                    const messageDate = new Date(message.createdAt);
                    const today = new Date();
                    const isToday = messageDate.toDateString() === today.toDateString();
                    const formattedTime = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                    const formattedDate = messageDate.toLocaleDateString([], { month: 'short', day: '2-digit' });
                    const displayTime = isToday ? `Today at ${formattedTime}` : `${formattedDate}, ${formattedTime}`;
                    const isSender = message.senderId === booking.renterId;
                    const isUnseen = !message.seen;

                    return (
                      <div key={index} className={`flex ${message.senderId === booking.renterId ? 'justify-end' : 'justify-start'} mb-3`}>
                        <div className="max-w-xs">
                        <p 
                          className={`px-4 py-2 rounded-xl shadow-md text-sm 
                            ${isSender ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'}
                            ${!isSender && isUnseen ? 'font-bold border border-gray-500' : ''}`} // Highlight unseen messages
                        >
                            {message.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 text-right">{displayTime}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center mt-4">No messages yet. Start the conversation!</p>
                )}
              </div>
              
             {/* Message Input Box */}
             <div className="flex items-center mt-3 border border-gray-300 rounded-md overflow-hidden bg-gray-100 p-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onFocus={markMessagesAsSeen}
                  placeholder="Type your message..."
                  className="w-full p-3 text-sm border-none focus:outline-none resize-none bg-white rounded-md shadow-sm"
                  rows="2"
                />
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 flex items-center justify-center rounded-md shadow-md transition duration-300 ml-2"
                  onClick={handleSendMessage}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

         {/* Display Booking Criteria */}
         <div className="bg-gray-50 p-4 rounded-lg shadow-md mb-4 mt-6">
        <h3 className="font-semibold text-lg text-gray-800">Your Booking Criteria</h3>
        <div className="overflow-x-auto mt-4">
          <table className="table-auto w-full text-gray-700">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 border-r border-gray-300">Pick-up Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 border-r border-gray-300">Pick-up Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 border-r border-gray-300">Pick-up Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 border-r border-gray-300">Return Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Return Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium border-r border-gray-300">
                    <input
                      type="text"
                      placeholder={!updatedPickAndDropLocation? "N/A":""}
                      value={updatedPickAndDropLocation}
                      onChange={(e) => setUpdatedPickAndDropLocation(e.target.value)}
                      className="border px-3 py-2 rounded-md"
                      disabled={booking.bookingStatus!=="Pending"}
                    />
                </td>
                <td className="px-6 py-4 text-sm font-medium border-r border-gray-300">
                    <input
                    type="date"
                    value={formatDate(booking?.startDate)}
                    onChange={(e) => handleDateChange(e, "start")}
                    disabled={booking.bookingStatus!=="Pending"}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium border-r border-gray-300">
                    <input
                      type="time"
                      value={updatedPickUpTime}
                      onChange={(e) => setUpdatedPickUpTime(e.target.value)}
                      className="border px-3 py-2 rounded-md"
                      disabled={booking.bookingStatus!=="Pending"}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium border-r border-gray-300">
                    <input
                    type="date"
                    value={formatDate(booking?.endDate)}
                    onChange={(e) => handleDateChange(e, "end")}
                    disabled={booking.bookingStatus!=="Pending"}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <input
                      type="time"
                      value={updatedDropTime}
                      onChange={(e) => setUpdatedDropTime(e.target.value)}
                      className="border px-3 py-2 rounded-md"
                      disabled={booking.bookingStatus!=="Pending"}

                    />
                  </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            {/* Car Specifications */}
            <div className="bg-gray-50 grid grid-cols-2 border border-gray-50 rounded-lg shadow-md mt-6 text-center">
              <div className="border-r border-gray-300 p-4">
                  <p className="text-gray-500">Seats</p>
                  <p className="text-lg font-semibold">{booking.vehicleId.seats || "N/A"}</p>
              </div>
              <div className="p-4">
                  <p className="text-gray-500">Fuel Type</p>
                  <p className="text-lg font-semibold">{booking.vehicleId.fuel || "N/A"}</p>
              </div>
              <div className="border-t border-r border-gray-300 p-4">
                  <p className="text-gray-500">Transmission</p>
                  <p className="text-lg font-semibold">{booking.vehicleId.transmission || "N/A"}</p>
              </div>
              <div className="border-t p-4">
                  <p className="text-gray-500">Fuel Usage</p>
                  <p className="text-lg font-semibold">{booking.vehicleId.mileage + "KM/ 1L" || "N/A"}</p>
              </div>
          </div>

 {/* Add-Ons Section */}
 <div className="bg-gray-50 p-6 rounded-lg mt-8 shadow-md">
          <h3 className="font-semibold text-lg text-gray-800">Available Add-Ons</h3>
          <ul className="mt-4 text-gray-700">
            {/* take addons from vehicle's addons only when a vehicle is in pendin stage/editable */}
          {(booking.bookingStatus === "Pending" ? booking.vehicleId.addOns : booking.approvedAddOns)?.map((addon, index) => (
              <li key={index} className="flex justify-between py-2">
                <span>{addon.name}</span>
                <div className="flex items-center">
                  <span className="text-green-600">+{addon.pricePerDay} NPR/day</span>
                  {booking.bookingStatus === "Pending" &&
                  <button
                    onClick={() => handleAddOnToggle(addon)}
                    className={`ml-4 text-blue-500 ${selectedAddOns.some((item) => item.name === addon.name) ? 'text-red-500' : ''}`}
                  >
                    {selectedAddOns.some((item) => item.name === addon.name) ? 'Remove' : 'Add'}
                  </button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
            
            </div>

          <div>
            {/* Features */}
            <div className="bg-gray-50 p-6 rounded-lg mt-8 shadow-md">
              <h3 className="font-semibold text-lg text-gray-800">Features</h3>
              <ul className="mt-4 text-gray-700">
                {booking.vehicleId.features?.map((feature, index) => <li key={index}>{feature}</li>)}
              </ul>
            </div>


            {/* Bill Section */}
            <div className="bg-gray-50 p-6 shadow-md rounded-lg mt-6">
              <h3 className="font-semibold text-lg">Vehicle Cost</h3>
              <p className="mt-2 flex justify-between "><span>{calculateDaysDifference(booking.startDate, booking.endDate)} Days - {booking.bookingStatus==="Pending" ? booking.vehicleId.dailyPrice : baseCost/calculateDaysDifference(booking.startDate, booking.endDate)} NPR/day</span> <span>Rs {baseCost}</span></p>
              
              <h3 className="font-semibold text-lg mt-4">Add Ons</h3>
              {selectedAddOns.length > 0 ? (selectedAddOns.map((addon, index) => (
                <div key={index} className="flex justify-between mt-2">
                  <span>{addon.name} - {addon.pricePerDay} NPR/day</span>
                  <div>
                  <span className='pr-3'>Rs {calculateDaysDifference(booking.startDate, booking.endDate)*addon.pricePerDay}</span>
                  {booking.bookingStatus === "Pending" && (
                  <button
                    onClick={() => handleDeleteAddOn(addon)}
                    className="text-red-500"
                  >
                    Delete
                  </button>)}
                  </div>
                </div>
              ))
            ):(
              <p className="text-gray-500 mt-2">No add-ons selected</p> // Message when no add-ons are selected
            )
            }

              <p className="font-bold mt-4 flex justify-between"><span>Total</span> <span>Rs {totalCost}</span></p>

              {(booking.paymentStatus === "Partial" || booking.paymentStatus === "Full") &&(<div>
                <p className="font-bold mt-4 flex justify-between"><span>Paid</span> <span>-Rs {booking.amountPaid}</span></p>
                <p className="font-bold mt-4 flex justify-between"><span>Remaining</span> <span>Rs {parseFloat(totalCost-booking.amountPaid).toFixed(2)}</span></p>
              </div>
              )}

            </div>

           
           {booking.bookingStatus === "Pending" && <div>
    
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg " onClick={handleEditBooking}>
                Update Booking
            </Button>
            {/* <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg" onClick={handleCancelBooking}>
                Cancel Booking
            </Button> */}
            </div>}

            {booking.bookingStatus === "RevisionRequired" && <div>
    
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg " onClick={handleAcceptBooking}>
                Accept Booking
            </Button>
            {/* <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg" onClick={handleCancelBooking}>
                Cancel Booking
            </Button> */}
            </div>}

            {receiptUrl && (
            <button 
              onClick={() => window.open(receiptUrl, "_blank")} 
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
              Download Receipt
            </button>
          )}
            {((booking.bookingStatus === "Confirmed" || booking.bookingStatus === "Active") && (booking.paymentStatus === "Partial" || booking.paymentStatus === "Pending")) && <div>
    
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg " onClick={handleRemainingPay}>
                Pay Remaining
            </Button>
            {/* <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg" onClick={handleCancelBooking}>
                Cancel Booking
            </Button> */}
            </div>}
            
            {/* For refund */}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                        <h2 className="text-lg font-bold">Refund Form</h2>
                        <p className="text-red-600 text-sm mt-2">
                            *As per the refund policy, a 5% deduction has been applied as compensation for the vehicle owner's time and reservation. The remaining amount will be refunded to your provided Khalti Account.*
                        </p>

                        {/* Input Fields */}
                        <div className="mt-4">
                            <label className="block font-semibold">Name:</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={walletDetails.name} 
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block font-semibold">Id:</label>
                            <input 
                                type="text" 
                                name="id" 
                                value={walletDetails.id} 
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="mt-6 flex justify-between">
                            <button 
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="bg-black text-white px-4 py-2 rounded-lg"
                                onClick={handleRefundRequest}
                                disabled={isRequestingRefund}
                            >
                                {isRequestingRefund ? (
                                  <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                  </div>
                                ) : (
                                  "Request Refund"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {(booking.bookingStatus === "Cancelled" && (booking.paymentStatus === "Partial" || booking.paymentStatus === "Full") && booking.paymentMethod === "Online") && 
            (<>
            {!booking.refundRequest.requested ? (
                <div>
                    <Button 
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg" 
                        onClick={() => setIsModalOpen(true)}
                    >
                        Request Refund
                    </Button>
                </div>
            ) : (
                <p className="mt-4 text-green-600 font-semibold">Booking refund requested</p>
              )}
          </>)}

          {(booking.bookingStatus === "Cancelled" && booking.paymentStatus === "Refunded") && (
            <div>
              <p className="mt-4 text-green-600 font-semibold">Booking Refunded</p>
            </div>
          )}

      {(booking.paymentMethod === "Cash") && (
            <div>
              <p className="mt-4 text-yellow-600 font-semibold">*Your payment method was set to CASH by the owner</p>
            </div>
          )}


            {booking.bookingStatus === "Accepted" && <div>
              <div className='flex flex-row space-x-4'>
            <Button className="w-1/2 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg " onClick={()=>handlePayment(10)}>
                Pay 10%
            </Button>
            <Button className="w-1/2 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg " onClick={()=>handlePayment(100)}>
                Pay Full
            </Button>
            </div>
            <p className="text-red-500 text-sm">*You MUST pay atleast 10% to confirm your Booking.</p>
            {/* <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg" onClick={handleCancelBooking}>
                Cancel Booking
            </Button> */}
            </div>}

            {(booking.bookingStatus != "Active" && booking.bookingStatus != "Completed" && booking.bookingStatus != "Cancelled") && <div>
              <Button 
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg" 
                onClick={handleCancelBooking}
                disabled={isCancelling}
                >
                {isCancelling ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelling...
                  </div>
                ) : (
                  "Cancel Booking"
                )}
            </Button>
              </div>}
          </div>
        </div>

       
      </div>

      {/* Reviews */}
              <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 mt-8">
                <h3 className="font-bold text-xl text-gray-800">Reviews</h3>
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <Card key={review._id} className="p-6 mt-4 bg-green-50 rounded-lg shadow-md">
                      <div className="flex items-center">
                        {[...Array(review.rating)].map((_, index) => (
                          <i key={index} className="fa-solid fa-star text-yellow-500" />
                        ))}
                        {[...Array(5 - review.rating)].map((_, index) => (
                          <i key={index} className="fa-solid fa-star text-gray-300" />
                        ))}
                      </div>
                      <p className="mt-4 text-gray-700">"{review.comment}"</p>
                      <div className="flex items-center mt-4">
                        <img
                          src={car}
                          alt="Reviewer"
                          className="w-8 h-8 rounded-full border-gray-300 object-cover"
                        />
                        <p className="ml-3 text-gray-800">{review.userId.name}</p>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-500 mt-2">No reviews yet</p>
                )}
              </div>

              {isCancelModelOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-150 max-h-[80vh] overflow-auto">
                  <h2 className="text-lg font-bold mb-4">Cancellation Policy</h2>

                  {/* Render Terms & Conditions dynamically */}
                  <div className="mb-4 text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: cancelContent }} />

                  {/* Agreement Checkboxes */}
                  <div className="mb-4">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="cancellationPolicy" checked={agreements.cancellationPolicy} onChange={handleAgreementChange} />
                      <span>I understand the cancellation policy.</span>
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-3">
                    <button className="bg-gray-300 px-4 py-2 rounded-md" onClick={() => setIsCancelModelOpen(false)}>Cancel</button>
                    <button 
                      className={`px-4 py-2 rounded-md ${agreements.cancellationPolicy ? 'bg-green-600 text-white' : 'bg-gray-400 cursor-not-allowed'}`}
                      onClick={proceedWithCancellation}
                    >
                      Accept & Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
}
