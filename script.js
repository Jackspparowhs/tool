// Maps by PirateRuler.com - Main JavaScript

class PirateMaps {
    constructor() {
        this.map = null;
        this.currentMarker = null;
        this.userLocation = null;
        this.directionsLayer = null;
        this.markers = [];
        this.baseLayers = {};
        this.overlays = {};
        
        this.init();
    }

    init() {
        this.initMap();
        this.initEventListeners();
        this.initGeolocation();
        this.initSearch();
        this.initDirections();
    }

    initMap() {
        // Initialize the map
        this.map = L.map('map', {
            center: [40.7128, -74.0060], // New York City
            zoom: 13,
            zoomControl: false,
            attributionControl: true
        });

        // Base layers
        this.baseLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });

        this.baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri, © OpenStreetMap contributors',
            maxZoom: 19
        });

        this.baseLayers.terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap, © OpenStreetMap contributors',
            maxZoom: 17
        });

        // Add default layer
        this.baseLayers.street.addTo(this.map);

        // Initialize overlays
        this.overlays.traffic = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            opacity: 0.5
        });

        this.overlays.transit = L.tileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38', {
            attribution: '© Thunderforest, © OpenStreetMap contributors',
            opacity: 0.6
        });

        // Add layer controls
        this.setupLayerControls();

        // Update coordinates display
        this.map.on('mousemove', (e) => {
            document.getElementById('coordinates').textContent = 
                `Lat: ${e.latlng.lat.toFixed(6)}, Lng: ${e.latlng.lng.toFixed(6)}`;
        });

        // Add click handler for adding markers
        this.map.on('click', (e) => {
            this.addMarker(e.latlng, 'Custom Location');
        });
    }

    setupLayerControls() {
        // Base map radio buttons
        document.querySelectorAll('input[name="basemap"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                Object.values(this.baseLayers).forEach(layer => this.map.removeLayer(layer));
                this.baseLayers[e.target.value].addTo(this.map);
            });
        });

        // Overlay checkboxes
        document.getElementById('trafficLayer').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.map.addLayer(this.overlays.traffic);
            } else {
                this.map.removeLayer(this.overlays.traffic);
            }
        });

        document.getElementById('transitLayer').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.map.addLayer(this.overlays.transit);
            } else {
                this.map.removeLayer(this.overlays.transit);
            }
        });
    }

    initEventListeners() {
        // Header buttons
        document.getElementById('currentLocationBtn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Map controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.map.zoomIn();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.map.zoomOut();
        });

        document.getElementById('rotateMap').addEventListener('click', () => {
            this.rotateMap();
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // Search
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.searchLocation();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchLocation();
            }
        });

        // Directions
        document.getElementById('getDirections').addEventListener('click', () => {
            this.getDirections();
        });
    }

    initGeolocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
                    this.addMarker(
                        [this.userLocation.lat, this.userLocation.lng], 
                        'Your Location',
                        'fa-user'
                    );
                },
                (error) => {
                    console.log('Geolocation error:', error);
                    this.showNotification('Unable to get your location', 'error');
                }
            );
        }
    }

    getCurrentLocation() {
        this.showLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.map.setView([lat, lng], 15);
                    this.addMarker([lat, lng], 'Current Location', 'fa-user');
                    this.showLoading(false);
                    this.showNotification('Location found!', 'success');
                },
                (error) => {
                    this.showLoading(false);
                    this.showNotification('Unable to get current location', 'error');
                }
            );
        } else {
            this.showLoading(false);
            this.showNotification('Geolocation is not supported', 'error');
        }
    }

    initSearch() {
        const searchInput = document.getElementById('searchInput');
        const suggestions = document.getElementById('searchSuggestions');

        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value;
            if (query.length > 2) {
                await this.getSearchSuggestions(query);
            } else {
                suggestions.style.display = 'none';
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                suggestions.style.display = 'none';
            }
        });
    }

    async getSearchSuggestions(query) {
        try {
            // Using Nominatim API for geocoding (free, no API key required)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
            );
            const data = await response.json();
            
            this.displaySuggestions(data);
        } catch (error) {
            console.log('Search error:', error);
        }
    }

    displaySuggestions(suggestions) {
        const container = document.getElementById('searchSuggestions');
        container.innerHTML = '';

        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        suggestions.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <strong>${item.display_name.split(',')[0]}</strong><br>
                <small>${item.display_name}</small>
            `;
            div.addEventListener('click', () => {
                this.selectLocation(item);
                container.style.display = 'none';
            });
            container.appendChild(div);
        });

        container.style.display = 'block';
    }

    selectLocation(location) {
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
        this.map.setView([lat, lng], 16);
        this.addMarker([lat, lng], location.display_name.split(',')[0]);
        
        document.getElementById('searchInput').value = location.display_name.split(',')[0];
    }

    searchLocation() {
        const query = document.getElementById('searchInput').value;
        if (query) {
            this.getSearchSuggestions(query);
        }
    }

    addMarker(latlng, title, iconClass = 'fa-map-marker-alt') {
        // Remove previous marker if exists
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
        }

        const customIcon = L.divIcon({
            html: `<div class="custom-marker"><i class="fas ${iconClass}"></i></div>`,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        this.currentMarker = L.marker(latlng, { icon: customIcon })
            .addTo(this.map)
            .bindPopup(title)
            .openPopup();

        this.markers.push(this.currentMarker);
    }

    initDirections() {
        // Directions functionality will be implemented here
        console.log('Directions initialized');
    }

    async getDirections() {
        const start = document.getElementById('startPoint').value;
        const end = document.getElementById('endPoint').value;
        const mode = document.getElementById('travelMode').value;

        if (!start || !end) {
            this.showNotification('Please enter both start and end points', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // Geocode start and end points
            const [startCoords, endCoords] = await Promise.all([
                this.geocodeLocation(start),
                this.geocodeLocation(end)
            ]);

            if (startCoords && endCoords) {
                this.displayRoute(startCoords, endCoords, mode);
            } else {
                this.showNotification('Unable to find one or both locations', 'error');
            }
        } catch (error) {
            console.log('Directions error:', error);
            this.showNotification('Error calculating route', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async geocodeLocation(query) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
            );
            const data = await response.json();
            
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    name: data[0].display_name.split(',')[0]
                };
            }
            return null;
        } catch (error) {
            console.log('Geocoding error:', error);
            return null;
        }
    }

    displayRoute(start, end, mode) {
        // Remove existing route
        if (this.directionsLayer) {
            this.map.removeLayer(this.directionsLayer);
        }

        // Create route line
        const routeCoords = [
            [start.lat, start.lng],
            [end.lat, end.lng]
        ];

        this.directionsLayer = L.polyline(routeCoords, {
            color: '#667eea',
            weight: 4,
            opacity: 0.8
        }).addTo(this.map);

        // Add markers for start and end
        this.addMarker([start.lat, start.lng], start.name, 'fa-play-circle');
        this.addMarker([end.lat, end.lng], end.name, 'fa-stop-circle');

        // Fit map to show both points
        const group = new L.featureGroup([
            L.marker([start.lat, start.lng]),
            L.marker([end.lat, end.lng])
        ]);
        this.map.fitBounds(group.getBounds().pad(0.1));

        // Display route info
        const distance = this.calculateDistance(start, end);
        document.getElementById('directionsResults').innerHTML = `
            <div class="route-info">
                <p><strong>From:</strong> ${start.name}</p>
                <p><strong>To:</strong> ${end.name}</p>
                <p><strong>Distance:</strong> ${distance.toFixed(2)} km</p>
                <p><strong>Mode:</strong> ${mode.charAt(0).toUpperCase() + mode.slice(1)}</p>
            </div>
        `;

        this.showNotification('Route calculated successfully!', 'success');
    }

    calculateDistance(start, end) {
        // Simple distance calculation (Haversine formula)
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(end.lat - start.lat);
        const dLng = this.toRad(end.lng - start.lng);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRad(start.lat)) * Math.cos(this.toRad(end.lat)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(value) {
        return value * Math.PI / 180;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    rotateMap() {
        // Simple rotation effect
        const currentRotation = this.map.getBearing() || 0;
        this.map.setBearing(currentRotation + 90);
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.add('active');
        } else {
            spinner.classList.remove('active');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Custom marker styles
const style = document.createElement('style');
style.textContent = `
    .custom-div-icon {
        background: none;
        border: none;
    }
    
    .custom-marker {
        background: #667eea;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
    }
    
    .custom-marker i {
        font-size: 14px;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .route-info {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 6px;
        font-size: 0.9rem;
    }
    
    .route-info p {
        margin: 0.5rem 0;
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PirateMaps();
});
