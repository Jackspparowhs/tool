// Global variables
let map;
let currentMarker;
let searchTimeout;
let userLocationMarker;

// Initialize the map
function initMap() {
    // Create map centered on a default location (New York City)
    map = L.map('map', {
        center: [40.7128, -74.0060],
        zoom: 13,
        zoomControl: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Add click event to place markers
    map.on('click', function(e) {
        placeMarker(e.latlng);
    });

    // Initialize search functionality
    initSearch();
    
    // Initialize location button
    initLocationButton();
    
    // Initialize mobile controls
    initMobileControls();
}

// Place a marker on the map
function placeMarker(latlng, title = 'Dropped Pin') {
    // Remove existing marker if any
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    // Create new marker
    currentMarker = L.marker(latlng, {
        draggable: true
    }).addTo(map);

    // Add popup
    const popupContent = `
        <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">${title}</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #5f6368;">
                Lat: ${latlng.lat.toFixed(6)}<br>
                Lng: ${latlng.lng.toFixed(6)}
            </p>
            <button onclick="removeMarker()" style="
                background: #1a73e8;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">Remove</button>
        </div>
    `;
    
    currentMarker.bindPopup(popupContent).openPopup();

    // Handle marker drag
    currentMarker.on('dragend', function(e) {
        const newLatLng = e.target.getLatLng();
        updateMarkerPopup(newLatLng);
    });
}

// Remove current marker
function removeMarker() {
    if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
    }
}

// Update marker popup with new coordinates
function updateMarkerPopup(latlng) {
    if (currentMarker) {
        const popupContent = `
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">Dropped Pin</h3>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #5f6368;">
                    Lat: ${latlng.lat.toFixed(6)}<br>
                    Lng: ${latlng.lng.toFixed(6)}
                </p>
                <button onclick="removeMarker()" style="
                    background: #1a73e8;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">Remove</button>
            </div>
        `;
        currentMarker.setPopupContent(popupContent);
    }
}

// Initialize search functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    const searchResults = document.getElementById('searchResults');

    // Handle search input
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length > 0) {
            clearBtn.classList.remove('hidden');
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchLocations(query);
            }, 300);
        } else {
            clearBtn.classList.add('hidden');
            searchResults.classList.add('hidden');
        }
    });

    // Clear search
    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        clearBtn.classList.add('hidden');
        searchResults.classList.add('hidden');
        searchInput.focus();
    });

    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            searchResults.classList.add('hidden');
        }
    });
}

// Search locations using Nominatim API
async function searchLocations(query) {
    const searchResults = document.getElementById('searchResults');
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        
        if (data.length > 0) {
            displaySearchResults(data);
        } else {
            searchResults.innerHTML = '<div class="search-result-item"><p style="color: #5f6368;">No results found</p></div>';
            searchResults.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="search-result-item"><p style="color: #ea4335;">Search failed. Please try again.</p></div>';
        searchResults.classList.remove('hidden');
    }
}

// Display search results
function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <div class="result-title">${result.display_name.split(',')[0]}</div>
            <div class="result-address">${result.display_name}</div>
        `;
        
        resultItem.addEventListener('click', function() {
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            const latLng = L.latLng(lat, lng);
            
            // Move map to location
            map.setView(latLng, 16);
            
            // Place marker
            placeMarker(latLng, result.display_name.split(',')[0]);
            
            // Hide results
            searchResults.classList.add('hidden');
            document.getElementById('searchInput').value = result.display_name.split(',')[0];
            document.getElementById('clearSearch').classList.remove('hidden');
        });
        
        searchResults.appendChild(resultItem);
    });
    
    searchResults.classList.remove('hidden');
}

// Initialize location button
function initLocationButton() {
    const locationBtn = document.getElementById('myLocationBtn');
    
    locationBtn.addEventListener('click', function() {
        getUserLocation();
    });
}

// Get user's current location
function getUserLocation() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    loadingSpinner.classList.remove('hidden');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const latLng = L.latLng(lat, lng);
            
            // Remove existing user location marker
            if (userLocationMarker) {
                map.removeLayer(userLocationMarker);
            }
            
            // Create user location marker with special icon
            const userIcon = L.divIcon({
                html: '<div style="background: #1a73e8; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [16, 16],
                className: 'user-location-marker'
            });
            
            userLocationMarker = L.marker(latLng, { icon: userIcon }).addTo(map);
            userLocationMarker.bindPopup('Your Location').openPopup();
            
            // Move map to user location
            map.setView(latLng, 16);
            
            loadingSpinner.classList.add('hidden');
        },
        function(error) {
            loadingSpinner.classList.add('hidden');
            let errorMessage = 'Unable to get your location';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied by user';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out';
                    break;
            }
            
            alert(errorMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

// Initialize mobile controls
function initMobileControls() {
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileLocationBtn = document.getElementById('mobileLocationBtn');
    const searchInput = document.getElementById('searchInput');
    
    mobileSearchBtn.addEventListener('click', function() {
        searchInput.focus();
        // Scroll to top to show search bar
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    mobileLocationBtn.addEventListener('click', function() {
        getUserLocation();
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});

// Handle window resize
window.addEventListener('resize', function() {
    if (map) {
        map.invalidateSize();
    }
});
