import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../Ui/Button';
import { useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import { reactLocalStorage } from 'reactjs-localstorage';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import io from "socket.io-client";

const socket = io("http://localhost:3000");

// Helper function to calculate the number of days between two dates
const calculateDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDifference = end - start;
  return Math.ceil(timeDifference / (1000 * 3600 * 24)); // Convert time difference to days
};


export default function OwnerBookedVehicleDetails() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  const [baseCost, setBaseCost] = useState(0);
  const [addOnsCost, setAddOnsCost] = useState(0);
  const [searchParams] = useSearchParams();
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [contractUrl, setContractUrl] = useState(null);
  
  
  const [totalCost, setTotalCost] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  // Form field states
  const [updatedPickAndDropLocation, setUpdatedPickAndDropLocation] = useState("");
  const [updatedStartDate, setUpdatedStartDate] = useState("");
  const [updatedEndDate, setUpdatedEndDate] = useState("");
  const [updatedPickUpTime, setUpdatedPickUpTime] = useState("");
  const [updatedDropTime, setUpdatedDropTime] = useState("");

   const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState("");
  const [userId, setUserId] = useState("");
  const messageContainerRef = useRef(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isCloseRental, setIsCloseRental] = useState(false);



  // Function to check if rental can be started
  const checkIfButtonDisabled = () => {
    if(booking)
      {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to midnight

    const startDate = new Date(booking.startDate);
    startDate.setHours(0, 0, 0, 0); // Reset time to midnight

    const oneDayAfterStart = new Date(startDate);
    oneDayAfterStart.setDate(oneDayAfterStart.getDate() + 1);

    // Disable button if the current date is before the start date or more than one day after start date
    if (currentDate < startDate || currentDate > oneDayAfterStart) {
      setIsButtonDisabled(true);
    } else {
      setIsButtonDisabled(false);
    }
  }
  };

  // Function to check if rental can be closed
  const checkIfRentalClose = () => {
    if(booking)
      {
    const currentDate = new Date();
    // currentDate.setHours(0, 0, 0, 0); // Reset time to midnight

    const endDate = new Date(booking.endDate);
    // endDate.setHours(0, 0, 0, 0); // Reset time to midnight

    if (currentDate < endDate) {
      setIsCloseRental(true);
    }else{
      setIsCloseRental(false);
    }
  }
  };

  useEffect(() => {
    checkIfButtonDisabled();
    checkIfRentalClose();

  }, [booking]);
  
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
            `http://localhost:3000/api/owner/booking/getOwnerBooking/${bookingId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setBooking(response.data.booking);
          if(response.data.booking.bookingStatus === "Confirmed" || response.data.booking.bookingStatus === "Active"){
            setContractUrl(`http://localhost:3000/api/owner/booking/contract/${bookingId}`);
          }
          // console.log("booking", response.data.booking);

        //   console.log(response.data);
        } catch (err) {
          console.log("Failed to fetch booking details.");
        }
      };
      fetchBooking();
    }
  }, [bookingId, token]);

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
  
          // Calculate base vehicle cost
          // const onlyVehicleCost = booking.vehicleId.dailyPrice * numDays;
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
              setUserId(booking.ownerId._id);
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
                // try {
                //   if (chatId) {
                //     await axios.put(
                //       `http://localhost:3000/api/auth/chat/mark-seen`,
                //       { chatId, userId: booking.renterId },
                //       { headers: { Authorization: `Bearer ${token}` } }
                //     );
                //   }
                // } catch (error) {
                //   console.error("Failed to mark messages as seen:", error);
                // }
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

  const handleAcceptBooking = async () => {
    try {
      const response = await axios.put('http://localhost:3000/api/owner/booking/acceptBooking', {
        bookingId,
        approvedAddOns: selectedAddOns
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking accepted successfully");
      // console.log('Booking updated successfully:', response.data);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Error accepting booking:', error.response?.data || error.message);
      toast.error("Error accepting booking.");
    }
  };

  const handleConfirmBooking = async () => {
    try {
      const response = await axios.put('http://localhost:3000/api/owner/booking/confirmBooking', {
        bookingId,
        approvedAddOns: selectedAddOns
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking confirmed successfully");
      // console.log('Booking updated successfully:', response.data);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Error accepting booking:', error.response?.data || error.message);
      toast.error("Error confirming booking.");
    }
  };

  const handleStartRental = async () => {
    try {
      const response = await axios.put('http://localhost:3000/api/owner/booking/startRental', {
        bookingId
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Rental has started.");
      // console.log('Starting rental:', response.data);
      setBooking(response.data.booking);

    } catch (error) {
      console.error('Error starting rental:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Error starting rental.");
    }
  };

  const handleCashPayment = async () => {
    try {
      const response = await axios.put('http://localhost:3000/api/owner/booking/settocash', {
        bookingId
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Selected Cash as mode of payment.");
      // console.log('Starting rental:', response.data);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Error starting rental:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Error setting mode of payment to cash.");
    }
  };

  const handleCloseRental = async () => {
    try {
      const response = await axios.put('http://localhost:3000/api/owner/booking/closeRental', {
        bookingId
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Rental has closed.");
      // console.log('Closed rental:', response.data);
      setBooking(response.data.booking);

    } catch (error) {
      console.error('Error closing rental:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Error closing rental.");
    }
  };

  const handleCancelBooking = async () => {
    try {
      const response = await axios.put('http://localhost:3000/api/owner/booking/cancelBooking', {
        bookingId
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking cancelled successfully");
      // console.log('Booking updated successfully:', response.data);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Error cancelling booking:', error.response?.data || error.message);
      toast.error("Error cancelling booking.");
    }
  };

  const handleRefund = async () => {
    if (!booking) return;
    try {
      const response = await axios.post("http://localhost:3000/api/auth/payment/initiaterefund", {
        purchase_order_id: bookingId,
        purchase_order_name: booking.vehicleId.name,
        return_url: `http://localhost:5173/ownerVehicleDetails/${bookingId}`, // Redirect URL after payment
        website_url: `http://localhost:5173/ownerVehicleDetails/${bookingId}`,
        totalAmount: totalCost,
        ownerId: booking.ownerId._id
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
      window.location.href = response.data.payment_url; // Redirect to Khalti
    } catch (error) {
      console.error("Payment initiation failed:", error.response?.data);
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
          const response = await axios.post("http://localhost:3000/api/auth/payment/verifyrefund", { 
            pidx
           },
          {
            headers: { Authorization: `Bearer ${token}` },
          });
          // console.log("Payment data: ", response.data.data.status);
          if (response.data.data.status === "Completed") {
            toast.success('Payment successful!');
            setReceiptUrl(`http://localhost:3000/api/auth/payment/receipt?pidx=${pidx}`);
            setBooking(response.data.booking);
          } else {
            toast.error('Payment verification failed. Please try again.');
          }
        } catch (error) {
          toast.error('Payment verification failed. Please try again.');
        } finally {
          navigate(`/ownerVehicleDetails/${bookingId}`, { replace: true });
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
          onClick={() => navigate("/ownerbookings")}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Back
        </button>
        <h2 className="font-bold text-xl text-gray-800 ml-6">Booking Details</h2>
      </div>
     
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
                        <span className="ml-1 text-gray-600">4.5</span>
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
        {(booking.bookingStatus === "Accepted" || booking.bookingStatus === "Confirmed" || booking.bookingStatus === "RevisionRequired" || booking.bookingStatus === "Active") && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">Chat with User</h3>
            
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
                    const isSender = message.senderId === booking.ownerId._id;
                    const isUnseen = !message.seen;

                    return (
                      <div key={index} className={`flex ${message.senderId === booking.ownerId._id ? 'justify-end' : 'justify-start'} mb-3`}>
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

            <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200 mx-auto mt-6">
            <div className="flex items-center mb-4">
                <div className="bg-yellow-200 p-2 rounded-full">
                  <i className="fa-solid fa-circle-info text-yellow-600"></i>
                </div>
                <h2 className="text-xl font-semibold ml-2">Rental Details</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t pt-4 text-sm text-gray-700">
                <div>
                    <h3 className="font-medium">Dates & Times</h3>
                    <p>{new Date(booking.startDate).toLocaleDateString()}{booking.pickupTime && (", "+booking.pickupTime)}</p>
                    <p>{new Date(booking.endDate).toLocaleDateString()}{booking.dropTime && (", "+booking.dropTime)}</p>
                </div>
                <div>
                    <h3 className="font-medium">Pick-up & Return Location</h3>
                    <p>{booking.pickAndDropLocation || 'N/A'}</p>
                </div>
                <div>
                    <h3 className="font-medium">Renter's Details</h3>
                    <p>Name: {booking.renterId.name}</p>
                    <p>Email: {booking.renterId.email}</p>
                </div>
                <div>
                    <h3 className="font-medium">Add-Ons Selected</h3>
                    <ul className="list-disc list-inside text-gray-600">
                        {booking.addOns.map((addOn) => (
                            <li key={addOn._id} className="text-sm">
                                {addOn.name}
                            </li>
                        ))}
                    </ul>
                </div>
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
          <h3 className="font-semibold text-lg text-gray-800">Requested Add-Ons</h3>
          <ul className="mt-4 text-gray-700">
            {booking.addOns?.map((addon, index) => (
              <li key={index} className="flex justify-between py-2">
                <span>{addon.name} - {addon.pricePerDay} NPR/day</span>
                <div className="flex items-center">
                {booking.bookingStatus === "Pending" &&(
                  <button
                    onClick={() => handleAddOnToggle(addon)}
                    className={`ml-4 text-blue-500 ${selectedAddOns.some((item) => item.name === addon.name) ? 'text-red-500' : ''}`}
                  >
                    {selectedAddOns.some((item) => item.name === addon.name) ? 'Decline' : 'Undo'}
                  </button>)}
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
              <p className="mt-2 flex justify-between "><span>{calculateDaysDifference(booking.startDate, booking.endDate)} Days - {booking.vehicleId.dailyPrice} NPR/day</span> <span>Rs {baseCost}</span></p>
              
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

              {!(booking.paymentStatus === "Pending") &&(<div>
                <p className="font-bold mt-4 flex justify-between"><span>Paid</span> <span>-Rs {booking.amountPaid}</span></p>
                <p className="font-bold mt-4 flex justify-between"><span>Remaining</span> <span>Rs {parseFloat(totalCost-booking.amountPaid).toFixed(2)}</span></p>
              </div>
              )}
            </div>

           
          
            {booking.bookingStatus==="Pending" && ( 
              <div>
                <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg" onClick={()=>handleAcceptBooking()}>
                    Accept Booking
                </Button>
                <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg" onClick={()=>handleCancelBooking()}>
                    Decline Booking
                </Button>
              </div>
          )}

{booking.bookingStatus==="Accepted" && ( 
              <div>
                <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg" onClick={()=>handleConfirmBooking()}>
                    Direct Confirm Booking
                </Button>
                <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg" onClick={()=>handleCancelBooking()}>
                    Decline Booking
                </Button>
              </div>
          )}

        {booking.bookingStatus==="Confirmed" && ( 
              <div>
                <button 
               className={`w-full mt-4 py-2 rounded-lg text-white font-bold ${
                isButtonDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
                onClick={()=>handleStartRental()}
                disabled={isButtonDisabled}>
                    Start Rental
                </button>
                {/* Show message when the button is disabled */}
                {isButtonDisabled && (
                  <p className="mt-2 text-sm text-red-500">
                    *You can only start the rental within one day after the start date.
                  </p>
                )}
                <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg" onClick={()=>handleCancelBooking()}>
                    Decline Booking
                </Button>
              </div>
          )}

        {((booking.bookingStatus==="Confirmed" || booking.bookingStatus==="Active") && (booking.paymentStatus==="Pending")) && (
          <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg" onClick={()=>handleCashPayment()}>
            Set Payment to CASH
          </Button>
        )} 

        {(booking.bookingStatus==="Active" && booking.rentalStartConfirmed) && ( 
              <div>
                <button 
                className={`w-full mt-4 py-2 rounded-lg text-white font-bold ${
                  isCloseRental
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                onClick={()=>handleCloseRental()}
                disabled={isCloseRental}>
                    Close Rental
                </button>
                {/* Show message when the button is disabled */}
                {isCloseRental && (
                  <p className="mt-2 text-sm text-red-500">
                    *You can only close the rental at the end date.
                  </p>
                )}
              </div>
          )}


        {receiptUrl && (
            <button 
              onClick={() => window.open(receiptUrl, "_blank")} 
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
              Download Receipt
            </button>
          )}

        {(contractUrl && (booking.bookingStatus === "Confirmed" || booking.bookingStatus === "Active")) && (
            <button 
              onClick={() => window.open(contractUrl, "_blank")} 
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg"
            >
              Download Contract
            </button>
          )}

        {(booking.bookingStatus === "Cancelled" && (booking.paymentStatus === "Partial" || booking.paymentStatus === "Full")) && 
            (<>
            {booking.refundRequest.requested ? (
                <div>
                    <Button 
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
                        onClick={handleRefund} 
                    >
                        Refund User
                    </Button>
                </div>
            ) : (
                <p className="mt-4 text-green-600 font-semibold">Refund Details Not provided</p>
              )}
          </>)}

          {(booking.bookingStatus === "Cancelled" && booking.paymentStatus === "Refunded") && (
            <div>
              <p className="mt-4 text-green-600 font-semibold">Booking Refunded</p>
            </div>
          )}

          </div>
        </div>

       
      </div>
    </div>
  );
}
