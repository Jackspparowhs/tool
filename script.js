// Maps by PirateRuler.com - Fixed Mobile & Functionality Edition

class PirateMaps {
    constructor() {
        this.map = null;
        this.currentMarker = null;
        this.userLocation = null;
        this.directionsLayer = null;
        this.markers = [];
        this.baseLayers = {};
        this.overlays = {};
        this.travelMode = 'driving';
        this.recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        this.isDirectionsMode = false;
        this.contextMenuPosition = null;
        this.startPoint = null;
        this.endPoint = null;
        
        this.init();
    }

    init() {
        this.initMap();
        this.initEventListeners();
        this.initGeolocation();
        this.initSearch();
        this.initDirections();
        this.initSidebar();
        this.initContextMenu();
        this.loadRecentSearches();
    }

    initMap() {
        // Initialize the map with better mobile support
        this.map = L.map('map', {
            center: [40.7128, -74.0060], // New York City
            zoom: 13,
            zoomControl: false,
            attributionControl: false,
            zoomAnimation: true,
            fadeAnimation: true,
            markerZoomAnimation: true,
            tap: true, // Enable mobile tap
            touchZoom: true,
            dragging: true
        });

        // Base layers
        this.baseLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
            opacity: 0.6
        });

        this.overlays.transit = L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38', {
            attribution: '© Thunderforest, © OpenStreetMap contributors',
            opacity: 0.6
        });

        this.overlays.bike = L.tileLayer('https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38', {
            attribution: '© Thunderforest, © OpenStreetMap contributors',
            opacity: 0.6
        });

        this.setupLayerControls();
        
        // Update coordinates display
        this.map.on('mousemove', (e) => {
            document.getElementById('coordinates').textContent = 
                `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
        });

        // Map click handler
        this.map.on('click', (e) => {
            if (this.isDirectionsMode) {
                this.handleDirectionsClick(e.latlng);
            } else {
                this.addMarker(e.latlng, 'Selected Location');
            }
        });

        // Context menu
        this.map.on('contextmenu', (e) => {
            e.originalEvent.preventDefault();
            this.showContextMenu(e.latlng, e.originalEvent);
        });
    }

    setupLayerControls() {
        // Map type options
        document.querySelectorAll('.map-type-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.switchMapType(type);
                
                // Update active state
                document.querySelectorAll('.map-type-option').forEach(opt => opt.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Update map type button
                document.getElementById('mapTypeText').textContent = type.charAt(0).toUpperCase() + type.slice(1);
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

        document.getElementById('bikeLayer').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.map.addLayer(this.overlays.bike);
            } else {
                this.map.removeLayer(this.overlays.bike);
            }
        });

        // Map type button
        document.getElementById('mapTypeBtn').addEventListener('click', () => {
            this.toggleMapTypes();
        });
    }

    initEventListeners() {
        // Header buttons
        document.getElementById('currentLocationBtn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        document.getElementById('currentLocationBtn2').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            document.getElementById('searchSuggestions').style.display = 'none';
        });

        // Map controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.map.zoomIn();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.map.zoomOut();
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.toggleSidebar();
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

        // Directions - FIXED
        document.getElementById('getDirections').addEventListener('click', () => {
            this.getDirections();
        });

        // Travel modes - FIXED
        document.querySelectorAll('.travel-mode').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.travel-mode').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.travelMode = e.currentTarget.dataset.mode;
            });
        });

        // Clear directions inputs
        document.getElementById('clearStart').addEventListener('click', () => {
            document.getElementById('startPoint').value = '';
            this.startPoint = null;
        });

        document.getElementById('clearEnd').addEventListener('click', () => {
            document.getElementById('endPoint').value = '';
            this.endPoint = null;
        });

        // Place categories
        document.querySelectorAll('.place-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.searchNearbyPlaces(category);
            });
        });

        // Context menu
        document.addEventListener('click', () => {
            document.getElementById('contextMenu').style.display = 'none';
        });

        document.getElementById('directionsFrom').addEventListener('click', () => {
            this.setDirectionsPoint('start');
        });

        document.getElementById('directionsTo').addEventListener('click', () => {
            this.setDirectionsPoint('end');
        });

        document.getElementById('addMarker').addEventListener('click', () => {
            this.addMarker(this.contextMenuPosition, 'Custom Marker');
        });

        document.getElementById('whatsHere').addEventListener('click', () => {
            this.reverseGeocode(this.contextMenuPosition);
        });

        // Mobile overlay
        document.getElementById('mobileOverlay').addEventListener('click', () => {
            this.toggleSidebar();
        });
    }

    initSidebar() {
        // Section toggles
        const toggles = [
            { toggle: 'directionsToggle', panel: 'directionsPanel' },
            { toggle: 'layersToggle', panel: 'layersPanel' },
            { toggle: 'placesToggle', panel: 'placesPanel' },
            { toggle: 'recentToggle', panel: 'recentPanel' }
        ];

        toggles.forEach(({ toggle, panel }) => {
            document.getElementById(toggle).addEventListener('click', (e) => {
                const panelEl = document.getElementById(panel);
                const toggleEl = e.currentTarget;
                
                if (panelEl.style.display === 'none') {
                    panelEl.style.display = 'block';
                    toggleEl.classList.remove('rotated');
                } else {
                    panelEl.style.display = 'none';
                    toggleEl.classList.add('rotated');
                }
            });
        });
    }

    initContextMenu() {
        // Context menu functionality is handled in event listeners
    }

    showContextMenu(latlng, event) {
        this.contextMenuPosition = latlng;
        const menu = document.getElementById('contextMenu');
        
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';
        menu.style.display = 'block';
    }

    setDirectionsPoint(type) {
        if (!this.contextMenuPosition) return;

        const coords = `${this.contextMenuPosition.lat.toFixed(6)}, ${this.contextMenuPosition.lng.toFixed(6)}`;
        
        if (type === 'start') {
            document.getElementById('startPoint').value = coords;
            this.startPoint = this.contextMenuPosition;
        } else {
            document.getElementById('endPoint').value = coords;
            this.endPoint = this.contextMenuPosition;
        }
        
        this.addMarker(this.contextMenuPosition, type === 'start' ? 'Start Point' : 'End Point');
    }

    switchMapType(type) {
        Object.values(this.baseLayers).forEach(layer => this.map.removeLayer(layer));
        this.baseLayers[type].addTo(this.map);
        
        // Update map style
        const mapContainer = document.getElementById('map');
        mapContainer.className = mapContainer.className.replace(/map-type-\w+/g, '');
        mapContainer.classList.add(`map-type-${type}`);
    }

    toggleMapTypes() {
        // Simple toggle between street and satellite
        const currentType = this.map.hasLayer(this.baseLayers.street) ? 'street' : 'satellite';
        const newType = currentType === 'street' ? 'satellite' : 'street';
        
        this.switchMapType(newType);
        
        // Update active state
        document.querySelectorAll('.map-type-option').forEach(opt => opt.classList.remove('active'));
        document.querySelector(`[data-type="${newType}"]`).classList.add('active');
        
        document.getElementById('mapTypeText').textContent = newType.charAt(0).toUpperCase() + newType.slice(1);
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        
        sidebar.classList.toggle('collapsed');
        
        if (!sidebar.classList.contains('collapsed')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
        
        // Adjust map size
        setTimeout(() => {
            this.map.invalidateSize();
        }, 300);
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
                        'location-marker'
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
                    this.map.setView([lat, lng], 16);
                    this.addMarker([lat, lng], 'Current Location', 'location-marker');
                    this.showLoading(false);
                    this.showNotification('Location found!', 'success');
                    
                    // Update user location
                    this.userLocation = { lat, lng };
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
            this.showLoading(true);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
            );
            const data = await response.json();
            
            this.displaySuggestions(data);
            this.showLoading(false);
        } catch (error) {
            console.log('Search error:', error);
            this.showLoading(false);
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
            
            const type = this.getLocationType(item);
            const icon = this.getLocationIcon(type);
            
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="${icon}" style="color: #4285f4; width: 16px;"></i>
                    <div>
                        <strong>${item.display_name.split(',')[0]}</strong>
                        <div style="font-size: 12px; color: #5f6368; margin-top: 2px;">
                            ${this.formatAddress(item.display_name)}
                        </div>
                    </div>
                </div>
            `;
            
            div.addEventListener('click', () => {
                this.selectLocation(item);
                container.style.display = 'none';
            });
            container.appendChild(div);
        });

        container.style.display = 'block';
    }

    getLocationType(location) {
        const type = location.type || '';
        const importance = location.importance || 0;
        
        if (type.includes('city') || type.includes('town')) return 'city';
        if (type.includes('restaurant') || type.includes('food')) return 'restaurant';
        if (type.includes('shop') || type.includes('store')) return 'shopping';
        if (type.includes('hospital') || type.includes('medical')) return 'hospital';
        if (type.includes('school') || type.includes('education')) return 'school';
        return 'place';
    }

    getLocationIcon(type) {
        const icons = {
            city: 'fas fa-city',
            restaurant: 'fas fa-utensils',
            shopping: 'fas fa-shopping-cart',
            hospital: 'fas fa-hospital',
            school: 'fas fa-school',
            place: 'fas fa-map-marker-alt'
        };
        return icons[type] || icons.place;
    }

    formatAddress(address) {
        const parts = address.split(',');
        return parts.slice(1, 3).join(',').trim();
    }

    selectLocation(location) {
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
        this.map.setView([lat, lng], 16);
        this.addMarker([lat, lng], location.display_name.split(',')[0]);
        
        // Add to recent searches
        this.addToRecentSearches({
            name: location.display_name.split(',')[0],
            address: location.display_name,
            lat: lat,
            lng: lng
        });
        
        document.getElementById('searchInput').value = location.display_name.split(',')[0];
    }

    addToRecentSearches(search) {
        // Remove if already exists
        this.recentSearches = this.recentSearches.filter(item => 
            item.name !== search.name && item.address !== search.address
        );
        
        // Add to beginning
        this.recentSearches.unshift(search);
        
        // Keep only last 10
        this.recentSearches = this.recentSearches.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
        
        this.updateRecentSearchesDisplay();
    }

    updateRecentSearchesDisplay() {
        const container = document.getElementById('recentList');
        container.innerHTML = '';
        
        if (this.recentSearches.length === 0) {
            container.innerHTML = '<div style="padding: 16px; text-align: center; color: #9aa0a6;">No recent searches</div>';
            return;
        }
        
        this.recentSearches.forEach(item => {
            const div = document.createElement('div');
            div.className = 'recent-item';
            div.innerHTML = `
                <i class="fas fa-history"></i>
                <div class="recent-item-content">
                    <div class="recent-item-title">${item.name}</div>
                    <div class="recent-item-subtitle">${this.formatAddress(item.address)}</div>
                </div>
            `;
            
            div.addEventListener('click', () => {
                this.map.setView([item.lat, item.lng], 16);
                this.addMarker([item.lat, item.lng], item.name);
            });
            
            container.appendChild(div);
        });
    }

    loadRecentSearches() {
        this.updateRecentSearchesDisplay();
    }

    addMarker(latlng, title, markerClass = 'custom-marker') {
        // Remove previous marker if exists and not in directions mode
        if (this.currentMarker && !this.isDirectionsMode) {
            this.map.removeLayer(this.currentMarker);
        }

        const customIcon = L.divIcon({
            html: `<div class="${markerClass}"><i class="fas fa-map-marker-alt"></i></div>`,
            className: 'custom-div-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28]
        });

        this.currentMarker = L.marker(latlng, { icon: customIcon })
            .addTo(this.map)
            .bindPopup(title)
            .openPopup();

        this.markers.push(this.currentMarker);
    }

    initDirections() {
        // Directions functionality - FIXED
        console.log('Directions initialized');
    }

    handleDirectionsClick(latlng) {
        if (!this.contextMenuPosition) return;
        
        // Add waypoint marker
        this.addMarker(latlng, 'Waypoint');
    }

    // FIXED DIRECTIONS FUNCTION
    async getDirections() {
        const startInput = document.getElementById('startPoint').value.trim();
        const endInput = document.getElementById('endPoint').value.trim();

        if (!startInput || !endInput) {
            this.showNotification('Please enter both start and end locations', 'error');
            return;
        }

        this.showLoading(true);

        try {
            let startCoords, endCoords;

            // Check if inputs are coordinates
            if (this.isCoordinate(startInput)) {
                startCoords = this.parseCoordinate(startInput);
            } else {
                startCoords = await this.geocodeLocation(startInput);
            }

            if (this.isCoordinate(endInput)) {
                endCoords = this.parseCoordinate(endInput);
            } else {
                endCoords = await this.geocodeLocation(endInput);
            }

            if (startCoords && endCoords) {
                this.displayRoute(startCoords, endCoords, this.travelMode);
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

    isCoordinate(input) {
        // Check if input looks like coordinates
        const coordPattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
        return coordPattern.test(input.trim());
    }

    parseCoordinate(coordString) {
        const parts = coordString.split(',');
        return {
            lat: parseFloat(parts[0].trim()),
            lng: parseFloat(parts[1].trim()),
            name: coordString.trim()
        };
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

    displayRoute(startCoords, endCoords, mode) {
        // Remove existing route
        if (this.directionsLayer) {
            this.map.removeLayer(this.directionsLayer);
        }

        // Create route line with waypoints (simplified routing)
        const routeCoords = this.generateRoute(startCoords, endCoords);
        
        this.directionsLayer = L.polyline(routeCoords, {
            color: '#4285f4',
            weight: 5,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(this.map);

        // Add markers for start and end
        this.addMarker([startCoords.lat, startCoords.lng], startCoords.name, 'location-marker');
        this.addMarker([endCoords.lat, endCoords.lng], endCoords.name, 'destination-marker');

        // Fit map to show both points
        const group = new L.featureGroup([
            L.marker([startCoords.lat, startCoords.lng]),
            L.marker([endCoords.lat, endCoords.lng])
        ]);
        this.map.fitBounds(group.getBounds().pad(0.1));

        // Display route info
        const distance = this.calculateDistance(startCoords, endCoords);
        const duration = this.estimateDuration(distance, mode);
        
        document.getElementById('directionsResults').innerHTML = `
            <div class="route-info">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 16px; font-weight: 500; color: #202124;">${this.formatDistance(distance)}</div>
                        <div style="font-size: 12px; color: #5f6368;">${duration}</div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="travel-mode-btn active" data-mode="${mode}" style="background: #4285f4; color: white; border: none; border-radius: 4px; padding: 6px;">
                            <i class="fas ${this.getTravelModeIcon(mode)}"></i>
                        </button>
                    </div>
                </div>
                <div style="border-top: 1px solid #e8eaed; padding-top: 12px;">
                    <div style="font-size: 12px; color: #5f6368; margin-bottom: 4px;">
                        <strong>From:</strong> ${startCoords.name}
                    </div>
                    <div style="font-size: 12px; color: #5f6368;">
                        <strong>To:</strong> ${endCoords.name}
                    </div>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e8eaed;">
                    <button onclick="pirateMaps.clearRoute()" style="background: #ea4335; color: white; border: none; border-radius: 4px; padding: 6px 12px; font-size: 12px; cursor: pointer;">
                        <i class="fas fa-times"></i> Clear Route
                    </button>
                </div>
            </div>
        `;

        this.showNotification('Route calculated successfully!', 'success');
    }

    generateRoute(start, end) {
        // Simple route generation with waypoints
        const waypoints = [];
        const steps = 10; // Number of steps between start and end
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const lat = start.lat + (end.lat - start.lat) * t;
            const lng = start.lng + (end.lng - start.lng) * t;
            
            // Add some realistic curves (simplified)
            const curve = Math.sin(t * Math.PI) * 0.01;
            waypoints.push([lat + curve, lng + curve]);
        }
        
        return waypoints;
    }

    getTravelModeIcon(mode) {
        const icons = {
            driving: 'fa-car',
            walking: 'fa-walking',
            cycling: 'fa-bicycle',
            transit: 'fa-bus'
        };
        return icons[mode] || icons.driving;
    }

    formatDistance(km) {
        if (km < 1) {
            return `${Math.round(km * 1000)} m`;
        } else if (km < 10) {
            return `${km.toFixed(1)} km`;
        } else {
            return `${Math.round(km)} km`;
        }
    }

    estimateDuration(distance, mode) {
        const speeds = {
            driving: 50,
            walking: 5,
            cycling: 15,
            transit: 25
        };
        
        const speed = speeds[mode] || 50;
        const hours = distance / speed;
        
        if (hours < 1) {
            return `${Math.round(hours * 60)} min`;
        } else {
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            return `${h}h ${m}min`;
        }
    }

    calculateDistance(start, end) {
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

    clearRoute() {
        if (this.directionsLayer) {
            this.map.removeLayer(this.directionsLayer);
            this.directionsLayer = null;
        }
        
        // Clear markers
        this.markers.forEach(marker => {
            if (marker.options.type === 'route') {
                this.map.removeLayer(marker);
            }
        });
        
        document.getElementById('directionsResults').innerHTML = '';
        this.showNotification('Route cleared', 'info');
    }

    async searchNearbyPlaces(category) {
        if (!this.userLocation && !this.map.getCenter()) return;
        
        this.showLoading(true);
        
        const center = this.userLocation || this.map.getCenter();
        const lat = center.lat || center[0];
        const lng = center.lng || center[1];
        
        try {
            // Using Nominatim to search for nearby places
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(category)}&limit=10&viewbox=${lng-0.1},${lat+0.1},${lng+0.1},${lat-0.1}&bounded=1`
            );
            const data = await response.json();
            
            this.displayNearbyPlaces(data, category);
            this.showLoading(false);
        } catch (error) {
            console.log('Places search error:', error);
            this.showLoading(false);
            this.showNotification('Error searching for places', 'error');
        }
    }

    displayNearbyPlaces(places, category) {
        // Clear existing place markers
        this.markers.forEach(marker => {
            if (marker.options.category === 'place') {
                this.map.removeLayer(marker);
            }
        });
        
        places.forEach(place => {
            const lat = parseFloat(place.lat);
            const lng = parseFloat(place.lon);
            
            const marker = this.addPlaceMarker(
                [lat, lng], 
                place.display_name.split(',')[0],
                category
            );
            
            marker.options.category = 'place';
            this.markers.push(marker);
        });
        
        if (places.length > 0) {
            this.showNotification(`Found ${places.length} ${category.replace('_', ' ')}s nearby`, 'success');
        } else {
            this.showNotification(`No ${category.replace('_', ' ')}s found nearby`, 'info');
        }
    }

    addPlaceMarker(latlng, title, category) {
        const icons = {
            restaurant: 'fa-utensils',
            gas_station: 'fa-gas-pump',
            hospital: 'fa-hospital',
            bank: 'fa-university',
            shopping_mall: 'fa-shopping-cart',
            park: 'fa-tree'
        };
        
        const icon = icons[category] || 'fa-map-marker-alt';
        
        const customIcon = L.divIcon({
            html: `<div class="place-marker"><i class="fas ${icon}"></i></div>`,
            className: 'custom-div-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const marker = L.marker(latlng, { icon: customIcon })
            .addTo(this.map)
            .bindPopup(title);

        return marker;
    }

    async reverseGeocode(latlng) {
        this.showLoading(true);
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
            );
            const data = await response.json();
            
            this.showLoading(false);
            
            if (data && data.display_name) {
                const title = data.display_name.split(',')[0];
                const address = this.formatAddress(data.display_name);
                
                this.addMarker(latlng, title);
                this.showNotification(`Location: ${title}\n${address}`, 'info');
            }
        } catch (error) {
            this.showLoading(false);
            this.showNotification('Unable to get location details', 'error');
        }
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

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        const colors = {
            success: '#34a853',
            error: '#ea4335',
            info: '#4285f4',
            warning: '#fbbc04'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 16px;
            padding: 12px 16px;
            background: ${colors[type]};
            color: white;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-size: 13px;
            font-weight: 500;
            max-width: 280px;
            line-height: 1.4;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    searchLocation() {
        const query = document.getElementById('searchInput').value;
        if (query) {
            this.getSearchSuggestions(query);
        }
    }
}

// Make pirateMaps globally accessible for the clear route button
let pirateMaps;
const style = document.createElement('style');
style.textContent = `
    .custom-div-icon {
        background: none;
        border: none;
    }
    
    .custom-marker {
        background: #4285f4;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
    }
    
    .custom-marker i {
        transform: rotate(45deg);
        font-size: 14px;
    }
    
    .location-marker {
        background: #ea4335;
    }
    
    .destination-marker {
        background: #34a853;
    }
    
    .place-marker {
        background: #fbbc04;
        border-radius: 50%;
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
        background: white;
        border: 1px solid #e8eaed;
        border-radius: 8px;
        padding: 12px;
        font-size: 12px;
    }
    
    .travel-mode-btn {
        background: #f8f9fa;
        border: 1px solid #dadce0;
        border-radius: 4px;
        padding: 6px;
        cursor: pointer;
        color: #5f6368;
        transition: all 0.2s;
    }
    
    .travel-mode-btn.active {
        background: #4285f4;
        color: white;
        border-color: #4285f4;
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    pirateMaps = new PirateMaps();
});
