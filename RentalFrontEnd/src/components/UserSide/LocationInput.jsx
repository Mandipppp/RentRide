import React, { useState, useEffect, useCallback } from "react";

const LocationInput = ({ onSelect }) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null); // Track the selected location
    const cache = new Map(); // Caching previous searches

    const fetchLocations = useCallback(async (input) => {
        if (input.length < 3) return;

        if (cache.has(input)) {
            setSuggestions(cache.get(input));
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${input}&countrycodes=np`);
            const data = await res.json();
            cache.set(input, data);
            setSuggestions(data);
        } catch (error) {
            console.error("Error fetching locations:", error);
        }
        setLoading(false);
    }, []);

    // Debounce effect (waits 300ms after user stops typing)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 3) fetchLocations(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, fetchLocations]);

    const handleSelect = (place) => {
        setSelectedLocation(place); // Set the selected location
        setQuery(place.display_name); // Set the display name in the input box
        setSuggestions([]); // Clear suggestions after selection
        onSelect(place); // Notify parent about the selected location
    };

    const handleRemove = () => {
        setSelectedLocation(null); // Remove the selected location
        setQuery(""); // Clear the input field
        setSuggestions([]); // Clear any existing suggestions
        onSelect(null);
    };

    return (
        <div className="relative">
            {selectedLocation ? (
                <div className="flex items-center bg-blue-100 text-blue-800 p-2 rounded-full mb-2">
                    <span>{selectedLocation.display_name}</span>
                    <button
                        onClick={handleRemove}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                        ✖
                    </button>
                </div>
            ) : (
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter location"
                    className="border p-2 w-full"
                />
            )}
            
            {loading && <p className="text-gray-500 text-sm">Loading...</p>}
            
            {suggestions.length > 0 && !selectedLocation && (
                <ul className="absolute w-full border bg-white mt-1 shadow rounded z-10">
                    {suggestions.map((place) => (
                        <li
                            key={place.place_id}
                            className="p-2 cursor-pointer hover:bg-gray-200"
                            onClick={() => handleSelect(place)}
                        >
                            {place.display_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LocationInput;
