import React, { useContext, useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { reactLocalStorage } from "reactjs-localstorage";
import { UserContext } from "../UserContext/UserContext";

const Login = () => {
  // const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setIsAuthenticated } = useContext(UserContext);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "renter",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = (e) => {
    e.preventDefault();

    axios
      .post("http://localhost:3000/api/auth/login", loginData)
      .then((res) => {
        // toast.success("Login successful!");
        const { token, user, owner } = res.data;
        reactLocalStorage.set("access_token", token);
        // reactLocalStorage.set("role", user.role);
        if (user) {
          if (user.role === "admin" || user.role === "superadmin") {
            if(user.blockStatus === "active") {
              navigate("/admindashboard");
            }else{
              toast.error("Your admin access has been revoked. Please contact the super admin.");
              setError("Your admin access has been revoked. Please contact the super admin.");
            }
          } else if (user.role === "renter") {

            const pendingVehicleString = reactLocalStorage.get("pendingVehicle"); // Get raw string
            let pendingVehicle = {};
            try {
              pendingVehicle = pendingVehicleString ? JSON.parse(pendingVehicleString) : {}; // Parse safely
            } catch (error) {
              console.error("Error parsing pendingVehicle:", error);
            }

            setIsAuthenticated(true);
            
            if (pendingVehicle && pendingVehicle.vehicleId) {
              reactLocalStorage.remove("pendingVehicle"); // Clear storage after use
          
              navigate(`/vehicleDetails/${pendingVehicle.vehicleId}`, {
                state: { filters: pendingVehicle.filters, isRequested: false }
              });
            } else {
              navigate("/home"); // Default redirect if no vehicle was pending
            }
            // navigate("/home");
          }
        } else if (owner) {
          if (owner.role === "owner") {
            navigate("/ownerdashboard");
          }
        }
      })
      .catch((err) => {
        if (err.response) {
          toast.error(err.response.data.message || "Login failed. Please try again.");
          setError(err.response.data.message);
        } else if (err.request) {
          toast.error("Server is not responding. Please try again later.");
        } else {
          toast.error("An error occurred. Please try again.");
        }
        console.error("Error during login:", err);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white-100">
      <ToastContainer />
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-medium mb-6 text-center">LOGIN</h2>
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700">I am a:</label>
            <select
              name="role"
              value={loginData.role}
              onChange={handleInputChange}
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="renter">Renter</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Email"
              value={loginData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Password"
              value={loginData.password}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-600"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <label className="block text-right font-small text-red-600">
          <Link to="/forgot-password" className="text-green-900 ml-1">Forgot Password?</Link>
            </label>
          <label className="flex justify-end items-center font-small">
            <span>Don't have an account?</span>
            <Link to="/signup" className="text-green-900 ml-1">Signup</Link>
          </label>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-800 text-white rounded-full"
          >
            LOGIN
          </button>
          
        </form>
      </div>
    </div>
  );
};

export default Login;
