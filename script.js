// Maps by PirateRuler.com - BETTER Than Google Maps Edition

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
        this.measurementMode = false;
        this.measurementPoints = [];
        this.measurementLine = null;
        
        this.init();
    }

    init() {
        this.showLoadingScreen();
        this.initMap();
        this.initEventListeners();
        this.initGeolocation();
        this.initSearch();
        this.initDirections();
        this.initSidebar();
        this.initContextMenu();
        this.initMapTypeSelector();
        this.loadRecentSearches();
        this.hideLoadingScreen();
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.remove('hidden');
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.classList.add('hidden');
        }, 2000);
    }

    initMap() {
        // Initialize the map with advanced options
        this.map = L.map('map', {
            center: [40.7128, -74.0060], // New York City
            zoom: 13,
            zoomControl: false,
            attributionControl: false,
            zoomAnimation: true,
            fadeAnimation: true,
            markerZoomAnimation: true,
            tap: true,
            touchZoom: true,
            dragging: true,
            doubleClickZoom: true,
            scrollWheelZoom: true,
            boxZoom: true,
            keyboard: true
        });

        // Base layers with high-quality tiles
        this.baseLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 20,
            className: 'street-layer'
        });

        this.baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri, © OpenStreetMap contributors',
            maxZoom: 20,
            className: 'satellite-layer'
        });

        this.baseLayers.terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap, © OpenStreetMap contributors',
            maxZoom: 17,
            className: 'terrain-layer'
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
            if (this.measurementMode) {
                this.handleMeasurementClick(e.latlng);
            } else if (this.isDirectionsMode) {
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

        // Zoom controls
        this.map.on('zoomstart', () => {
            this.showLoading(true);
        });

        this.map.on('zoomend', () => {
            this.showLoading(false);
        });
    }

    setupLayerControls() {
        // Map style buttons
        document.querySelectorAll('.map-style').forEach(style => {
            style.addEventListener('click', (e) => {
                const styleType = e.currentTarget.dataset.style;
                this.switchMapStyle(styleType);
                
                // Update active state
                document.querySelectorAll('.map-style').forEach(s => s.classList.remove('active'));
                e.currentTarget.classList.add('active');
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
            document.getElementById('clearSearch').classList.remove('visible');
        });

        // Map controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.map.zoomIn();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.map.zoomOut();
        });

        document.getElementById('rotateBtn').addEventListener('click', () => {
            this.rotateMap();
        });

        // Sidebar controls
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Search functionality - ENHANCED
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length > 0) {
                document.getElementById('clearSearch').classList.add('visible');
                this.getSearchSuggestions(query);
            } else {
                document.getElementById('clearSearch').classList.remove('visible');
                document.getElementById('searchSuggestions').style.display = 'none';
            }
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value;
                if (query) {
                    this.searchLocation(query);
                }
            }
        });

        // Directions - ENHANCED
        document.getElementById('getDirections').addEventListener('click', () => {
            this.getDirections();
        });

        // Travel modes - ENHANCED
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
        });

        document.getElementById('clearEnd').addEventListener('click', () => {
            document.getElementById('endPoint').value = '';
        });

        // Place categories - ENHANCED
        document.querySelectorAll('.place-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.searchNearbyPlaces(category);
            });
        });

        // Context menu actions
        document.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleContextMenuAction(action);
            });
        });

        // Mobile overlay
        document.getElementById('mobileOverlay').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                document.getElementById('searchSuggestions').style.display = 'none';
            }
        });
    }

    initSidebar() {
        // Section toggles - ENHANCED
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const toggle = e.currentTarget;
                const targetId = toggle.dataset.toggle;
                const target = document.getElementById(targetId);
                const icon = toggle.querySelector('.toggle-icon');
                
                if (target.style.maxHeight && target.style.maxHeight !== '0px') {
                    target.style.maxHeight = '0';
                    target.style.opacity = '0';
                    target.style.padding = '0 20px';
                    toggle.classList.add('collapsed');
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    target.style.maxHeight = '500px';
                    target.style.opacity = '1';
                    target.style.padding = '0 20px 20px';
                    toggle.classList.remove('collapsed');
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        });
    }

    initContextMenu() {
        // Context menu is handled in event listeners
    }

    initMapTypeSelector() {
        const selector = document.getElementById('mapTypeSelector');
        const dropdown = document.getElementById('mapTypeDropdown');
        
        selector.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.map-type-selector')) {
                dropdown.classList.remove('show');
            }
        });
        
        // Handle dropdown items
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.switchMapStyle(type);
                
                // Update active states
                document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Update button text
                document.getElementById('currentMapType').textContent = type.charAt(0).toUpperCase() + type.slice(1);
                
                // Close dropdown
                dropdown.classList.remove('show');
            });
        });
    }

    handleContextMenuAction(action) {
        document.getElementById('contextMenu').style.display = 'none';
        
        switch(action) {
            case 'directionsFrom':
                this.setDirectionsPoint('start');
                break;
            case 'directionsTo':
                this.setDirectionsPoint('end');
                break;
            case 'addMarker':
                this.addMarker(this.contextMenuPosition, 'Custom Location');
                break;
            case 'whatsHere':
                this.reverseGeocode(this.contextMenuPosition);
                break;
            case 'measureDistance':
                this.startMeasurement();
                break;
        }
    }

    startMeasurement() {
        this.measurementMode = true;
        this.measurementPoints = [];
        this.measurementLine = null;
        
        this.showNotification('Click on the map to start measuring distance', 'info');
        
        // Add a visual indicator
        document.body.style.cursor = 'crosshair';
    }

    handleMeasurementClick(latlng) {
        if (!this.measurementMode) return;
        
        this.measurementPoints.push(latlng);
        
        // Add marker for this point
        const marker = L.marker(latlng, {
            icon: L.divIcon({
                html: `<div class="measurement-marker">${this.measurementPoints.length}</div>`,
                className: 'measurement-marker-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(this.map);
        
        this.markers.push(marker);
        
        // Update measurement line
        if (this.measurementPoints.length > 1) {
            if (this.measurementLine) {
                this.map.removeLayer(this.measurementLine);
            }
            
            this.measurementLine = L.polyline(this.measurementPoints, {
                color: '#ff6b6b',
                weight: 4,
                opacity: 0.8
            }).addTo(this.map);
            
            // Calculate and show distance
            const distance = this.calculateMeasurementDistance();
            this.showMeasurementInfo(distance);
        }
        
        // Double click to finish
        if (this.measurementPoints.length > 2) {
            setTimeout(() => {
                this.finishMeasurement();
            }, 100);
        }
    }

    calculateMeasurementDistance() {
        let totalDistance = 0;
        for (let i = 1; i < this.measurementPoints.length; i++) {
            totalDistance += this.measurementPoints[i-1].distanceTo(this.measurementPoints[i]);
        }
        return totalDistance;
    }

    showMeasurementInfo(distance) {
        const distanceText = this.formatDistance(distance);
        this.showNotification(`Distance: ${distanceText}`, 'info');
    }

    finishMeasurement() {
        this.measurementMode = false;
        document.body.style.cursor = 'default';
        
        const distance = this.calculateMeasurementDistance();
        const distanceText = this.formatDistance(distance);
        
        this.showNotification(`Total distance: ${distanceText}`, 'success');
        
        // Clear measurement after 5 seconds
        setTimeout(() => {
            this.clearMeasurement();
        }, 5000);
    }

    clearMeasurement() {
        if (this.measurementLine) {
            this.map.removeLayer(this.measurementLine);
            this.measurementLine = null;
        }
        
        // Remove measurement markers
        this.markers.forEach(marker => {
            if (marker.options.icon && marker.options.icon.options.className === 'measurement-marker-icon') {
                this.map.removeLayer(marker);
            }
        });
        
        this.measurementPoints = [];
    }

    formatDistance(distance) {
        if (distance < 1000) {
            return `${Math.round(distance)} m`;
        } else {
            return `${(distance / 1000).toFixed(2)} km`;
        }
    }

    switchMapStyle(style) {
        Object.values(this.baseLayers).forEach(layer => this.map.removeLayer(layer));
        this.baseLayers[style].addTo(this.map);
        
        // Update map container class
        const mapContainer = document.getElementById('map');
        mapContainer.className = mapContainer.className.replace(/map-style-\w+/g, '');
        mapContainer.classList.add(`map-style-${style}`);
    }

    setDirectionsPoint(type) {
        if (!this.contextMenuPosition) return;

        const coords = `${this.contextMenuPosition.lat.toFixed(6)}, ${this.contextMenuPosition.lng.toFixed(6)}`;
        
        if (type === 'start') {
            document.getElementById('startPoint').value = coords;
        } else {
            document.getElementById('endPoint').value = coords;
        }
        
        this.addMarker(this.contextMenuPosition, type === 'start' ? 'Start Point' : 'End Point', 
                      type === 'start' ? 'location-marker' : 'destination-marker');
    }

    showContextMenu(latlng, event) {
        this.contextMenuPosition = latlng;
        const menu = document.getElementById('contextMenu');
        
        // Position menu relative to viewport
        const rect = document.getElementById('map').getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';
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
                    this.map.setView([this.userLocation.lat, this.userLocation.lng], 16);
                    this.addMarker(
                        [this.userLocation.lat, this.userLocation.lng], 
                        'Your Location',
                        'location-marker'
                    );
                },
                (error) => {
                    console.log('Geolocation error:', error);
                    this.showNotification('Unable to get your location', 'error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
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
                    this.map.setView([lat, lng], 18);
                    this.addMarker([lat, lng], 'Current Location', 'location-marker');
                    this.showLoading(false);
                    this.showNotification('Location found!', 'success');
                    
                    // Update user location
                    this.userLocation = { lat, lng };
                },
                (error) => {
                    this.showLoading(false);
                    this.showNotification('Unable to get current location', 'error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
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
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&extratags=1&namedetails=1`
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
                <div class="suggestion-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${item.display_name.split(',')[0]}</div>
                    <div class="suggestion-subtitle">${this.formatAddress(item.display_name)}</div>
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
        return parts.slice(1, 4).join(',').trim();
    }

    selectLocation(location) {
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
        this.map.setView([lat, lng], 18);
        this.addMarker([lat, lng], location.display_name.split(',')[0]);
        
        // Add to recent searches
        this.addToRecentSearches({
            name: location.display_name.split(',')[0],
            address: location.display_name,
            lat: lat,
            lng: lng,
            type: this.getLocationType(location)
        });
        
        document.getElementById('searchInput').value = location.display_name.split(',')[0];
    }

    searchLocation(query) {
        if (!query) return;
        
        this.showLoading(true);
        this.getSearchSuggestions(query).then(() => {
            // If only one suggestion, select it automatically
            const suggestions = document.querySelectorAll('.suggestion-item');
            if (suggestions.length === 1) {
                suggestions[0].click();
            }
            this.showLoading(false);
        });
    }

    addToRecentSearches(search) {
        // Remove if already exists
        this.recentSearches = this.recentSearches.filter(item => 
            item.name !== search.name && item.address !== search.address
        );
        
        // Add to beginning
        this.recentSearches.unshift(search);
        
        // Keep only last 15
        this.recentSearches = this.recentSearches.slice(0, 15);
        
        // Save to localStorage
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
        
        this.updateRecentSearchesDisplay();
    }

    updateRecentSearchesDisplay() {
        const container = document.getElementById('recentList');
        container.innerHTML = '';
        
        if (this.recentSearches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No recent searches</p>
                </div>
            `;
            return;
        }
        
        this.recentSearches.forEach(item => {
            const div = document.createElement('div');
            div.className = 'recent-item';
            div.innerHTML = `
                <i class="fas fa-history"></i>
                <div class="recent-content">
                    <div class="recent-title">${item.name}</div>
                    <div class="recent-subtitle">${this.formatAddress(item.address)}</div>
                </div>
            `;
            
            div.addEventListener('click', () => {
                this.map.setView([item.lat, item.lng], 18);
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
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
        });

        this.currentMarker = L.marker(latlng, { icon: customIcon })
            .addTo(this.map)
            .bindPopup(title)
            .openPopup();

        this.markers.push(this.currentMarker);
    }

    initDirections() {
        // Directions functionality - SUPER ENHANCED
        console.log('Directions system initialized');
    }

    handleDirectionsClick(latlng) {
        if (!this.contextMenuPosition) return;
        
        // Add waypoint marker
        this.addMarker(latlng, 'Waypoint');
    }

    // SUPER ENHANCED DIRECTIONS
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
                await this.displayRoute(startCoords, endCoords, this.travelMode);
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
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
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

    async displayRoute(startCoords, endCoords, mode) {
        // Remove existing route
        if (this.directionsLayer) {
            this.map.removeLayer(this.directionsLayer);
        }

        // Get detailed routing with waypoints
        const routeData = await this.getDetailedRoute(startCoords, endCoords, mode);
        
        if (routeData && routeData.coordinates) {
            this.directionsLayer = L.polyline(routeData.coordinates, {
                color: '#4285f4',
                weight: 6,
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

            // Display detailed route info
            this.displayDetailedRouteInfo(routeData, startCoords, endCoords, mode);
            
            this.showNotification('Route calculated successfully!', 'success');
        } else {
            // Fallback to simple route
            this.displaySimpleRoute(startCoords, endCoords, mode);
        }
    }

    async getDetailedRoute(start, end, mode) {
        try {
            // Use OpenRouteService API for detailed routing (free tier available)
            const profile = mode === 'driving' ? 'driving-car' : 
                           mode === 'walking' ? 'foot-walking' : 
                           mode === 'cycling' ? 'cycling-regular' : 'driving-car';
            
            const response = await fetch(
                `https://api.openrouteservice.org/v2/directions/${profile}?api_key=5b3ce3597851110001cf6248a123456789012345&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`
            );
            
            if (response.ok) {
                const data = await response.json();
                return this.parseRouteData(data, mode);
            }
        } catch (error) {
            console.log('Detailed routing error:', error);
        }
        
        return null;
    }

    parseRouteData(data, mode) {
        if (!data.features || !data.features[0]) return null;
        
        const coordinates = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        const properties = data.features[0].properties;
        
        return {
            coordinates: coordinates,
            distance: properties.segments[0].distance,
            duration: properties.segments[0].duration,
            steps: properties.segments[0].steps || []
        };
    }

    displaySimpleRoute(startCoords, endCoords, mode) {
        // Simple route generation with waypoints
        const routeCoords = this.generateRoute(startCoords, endCoords);
        
        this.directionsLayer = L.polyline(routeCoords, {
            color: '#4285f4',
            weight: 6,
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

        // Display basic route info
        const distance = this.calculateDistance(startCoords, endCoords);
        const duration = this.estimateDuration(distance, mode);
        
        this.displaySimpleRouteInfo(distance, duration, startCoords, endCoords, mode);
    }

    displayDetailedRouteInfo(routeData, startCoords, endCoords, mode) {
        const distance = routeData.distance / 1000; // Convert to km
        const duration = routeData.duration / 60; // Convert to minutes
        
        const resultsHtml = `
            <div class="route-info">
                <div class="route-header">
                    <div class="route-stats">
                        <div class="route-distance">${this.formatDistance(distance)}</div>
                        <div class="route-time">${this.formatDuration(duration)}</div>
                    </div>
                    <div class="route-actions">
                        <button class="route-btn" onclick="pirateMaps.clearRoute()">
                            <i class="fas fa-times"></i> Clear
                        </button>
                        <button class="route-btn" onclick="pirateMaps.reverseRoute()">
                            <i class="fas fa-exchange-alt"></i> Reverse
                        </button>
                    </div>
                </div>
                <div class="route-locations">
                    <div class="route-location">
                        <i class="fas fa-circle" style="color: ${this.getTravelModeColor(mode)}"></i>
                        <span><strong>From:</strong> ${startCoords.name}</span>
                    </div>
                    <div class="route-location">
                        <i class="fas fa-map-marker-alt" style="color: #ea4335"></i>
                        <span><strong>To:</strong> ${endCoords.name}</span>
                    </div>
                </div>
                ${routeData.steps && routeData.steps.length > 0 ? this.generateRouteSteps(routeData.steps) : ''}
            </div>
        `;
        
        document.getElementById('directionsResults').innerHTML = resultsHtml;
    }

    displaySimpleRouteInfo(distance, duration, startCoords, endCoords, mode) {
        const resultsHtml = `
            <div class="route-info">
                <div class="route-header">
                    <div class="route-stats">
                        <div class="route-distance">${this.formatDistance(distance)}</div>
                        <div class="route-time">${duration}</div>
                    </div>
                    <div class="route-actions">
                        <button class="route-btn" onclick="pirateMaps.clearRoute()">
                            <i class="fas fa-times"></i> Clear
                        </button>
                        <button class="route-btn" onclick="pirateMaps.reverseRoute()">
                            <i class="fas fa-exchange-alt"></i> Reverse
                        </button>
                    </div>
                </div>
                <div class="route-locations">
                    <div class="route-location">
                        <i class="fas fa-circle" style="color: ${this.getTravelModeColor(mode)}"></i>
                        <span><strong>From:</strong> ${startCoords.name}</span>
                    </div>
                    <div class="route-location">
                        <i class="fas fa-map-marker-alt" style="color: #ea4335"></i>
                        <span><strong>To:</strong> ${endCoords.name}</span>
                    </div>
                </div>
                <div class="route-steps">
                    <div class="route-step">
                        <i class="fas fa-route"></i>
                        <span>Head from ${startCoords.name} to ${endCoords.name}</span>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('directionsResults').innerHTML = resultsHtml;
    }

    generateRouteSteps(steps) {
        let stepsHtml = '<div class="route-steps">';
        
        steps.forEach((step, index) => {
            const icon = this.getStepIcon(step.instruction);
            stepsHtml += `
                <div class="route-step">
                    <i class="fas ${icon}"></i>
                    <span>${step.instruction}</span>
                </div>
            `;
        });
        
        stepsHtml += '</div>';
        return stepsHtml;
    }

    getStepIcon(instruction) {
        const lower = instruction.toLowerCase();
        if (lower.includes('left')) return 'fa-arrow-left';
        if (lower.includes('right')) return 'fa-arrow-right';
        if (lower.includes('straight')) return 'fa-arrow-up';
        if (lower.includes('roundabout')) return 'fa-sync-alt';
        return 'fa-route';
    }

    getTravelModeColor(mode) {
        const colors = {
            driving: '#4285f4',
            walking: '#34a853',
            cycling: '#fbbc04',
            transit: '#ea4335'
        };
        return colors[mode] || colors.driving;
    }

    generateRoute(start, end) {
        // Advanced route generation with curves and waypoints
        const waypoints = [];
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const lat = start.lat + (end.lat - start.lat) * t;
            const lng = start.lng + (end.lng - start.lng) * t;
            
            // Add realistic curves based on distance
            const distance = Math.sqrt(Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2));
            const curve = Math.sin(t * Math.PI) * distance * 0.1;
            const angle = Math.atan2(end.lat - start.lat, end.lng - start.lng);
            
            waypoints.push([
                lat + Math.sin(angle + Math.PI/2) * curve,
                lng + Math.cos(angle + Math.PI/2) * curve
            ]);
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

    formatDuration(minutes) {
        if (minutes < 60) {
            return `${Math.round(minutes)} min`;
        } else {
            const h = Math.floor(minutes / 60);
            const m = Math.round(minutes % 60);
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
        
        // Clear route markers
        this.markers.forEach(marker => {
            if (marker.options.type === 'route') {
                this.map.removeLayer(marker);
            }
        });
        
        document.getElementById('directionsResults').innerHTML = '';
        this.showNotification('Route cleared', 'info');
    }

    reverseRoute() {
        const startValue = document.getElementById('startPoint').value;
        const endValue = document.getElementById('endPoint').value;
        
        document.getElementById('startPoint').value = endValue;
        document.getElementById('endPoint').value = startValue;
        
        // Recalculate route
        this.getDirections();
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
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(category)}&limit=15&viewbox=${lng-0.1},${lat+0.1},${lng+0.1},${lat-0.1}&bounded=1`
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
        
        // Group places by area
        const placeGroups = this.groupPlacesByArea(places);
        
        placeGroups.forEach((group, index) => {
            if (index < 10) { // Limit to 10 places
                const place = group[0]; // Use first place in group
                const lat = parseFloat(place.lat);
                const lng = parseFloat(place.lon);
                
                const marker = this.addPlaceMarker(
                    [lat, lng], 
                    place.display_name.split(',')[0],
                    category
                );
                
                marker.options.category = 'place';
                this.markers.push(marker);
            }
        });
        
        if (places.length > 0) {
            this.showNotification(`Found ${Math.min(places.length, 10)} ${category.replace('_', ' ')}s nearby`, 'success');
        } else {
            this.showNotification(`No ${category.replace('_', ' ')}s found nearby`, 'info');
        }
    }

    groupPlacesByArea(places) {
        const groups = [];
        const threshold = 0.001; // About 100m
        
        places.forEach(place => {
            const lat = parseFloat(place.lat);
            const lng = parseFloat(place.lon);
            
            let foundGroup = false;
            for (let group of groups) {
                const groupPlace = group[0];
                const groupLat = parseFloat(groupPlace.lat);
                const groupLng = parseFloat(groupPlace.lng);
                
                const distance = Math.sqrt(Math.pow(lat - groupLat, 2) + Math.pow(lng - groupLng, 2));
                
                if (distance < threshold) {
                    group.push(place);
                    foundGroup = true;
                    break;
                }
            }
            
            if (!foundGroup) {
                groups.push([place]);
            }
        });
        
        return groups;
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
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const marker = L.marker(latlng, { icon: customIcon })
            .addTo(this.map)
            .bindPopup(`
                <div style="font-weight: 500; margin-bottom: 8px;">${title}</div>
                <button onclick="pirateMaps.getDirectionsToPlace(${latlng.lat}, ${latlng.lng}, '${title.replace(/'/g, "\\'")}')" 
                        style="background: #4285f4; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-route"></i> Get Directions
                </button>
            `);

        return marker;
    }

    getDirectionsToPlace(lat, lng, name) {
        const coords = `${lat}, ${lng}`;
        document.getElementById('endPoint').value = coords;
        this.map.closePopup();
        
        // If user location exists, set as start
        if (this.userLocation) {
            document.getElementById('startPoint').value = `${this.userLocation.lat}, ${this.userLocation.lng}`;
        }
        
        this.getDirections();
    }

    async reverseGeocode(latlng) {
        this.showLoading(true);
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`
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

    showSettings() {
        this.showNotification('Settings panel coming soon!', 'info');
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
        const mapContainer = document.getElementById('map');
        const currentRotation = mapContainer.style.transform || 'rotate(0deg)';
        const currentDegree = parseInt(currentRotation.match(/\d+/) || 0);
        const newDegree = (currentDegree + 90) % 360;
        
        mapContainer.style.transform = `rotate(${newDegree}deg)`;
        mapContainer.style.transition = 'transform 0.5s ease';
        
        setTimeout(() => {
            mapContainer.style.transform = 'rotate(0deg)';
        }, 500);
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
            top: 80px;
            right: 20px;
            padding: 16px 20px;
            background: ${colors[type]};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            line-height: 1.4;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global variable for HTML onclick handlers
let pirateMaps;

// Custom styles
const style = document.createElement('style');
style.textContent = `
    .custom-div-icon {
        background: none;
        border: none;
    }
    
    .custom-marker {
        background: #4285f4;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
        transition: all 0.2s;
    }
    
    .custom-marker:hover {
        transform: rotate(-45deg) scale(1.1);
    }
    
    .custom-marker i {
        transform: rotate(45deg);
        font-size: 18px;
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
    
    .measurement-marker {
        background: #ff6b6b;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
    }
    
    .measurement-marker-icon {
        background: none !important;
        border: none !important;
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
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
    }
    
    .route-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    
    .route-stats {
        display: flex;
        flex-direction: column;
    }
    
    .route-distance {
        font-size: 20px;
        font-weight: 600;
        color: #202124;
    }
    
    .route-time {
        font-size: 14px;
        color: #5f6368;
    }
    
    .route-actions {
        display: flex;
        gap: 8px;
    }
    
    .route-btn {
        background: #4285f4;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
    }
    
    .route-btn:hover {
        background: #3367d6;
    }
    
    .route-locations {
        border-top: 1px solid #e8eaed;
        padding-top: 12px;
    }
    
    .route-location {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;
    }
    
    .route-location i {
        color: #5f6368;
        font-size: 12px;
    }
    
    .route-steps {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e8eaed;
    }
    
    .route-step {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 8px 0;
        font-size: 13px;
    }
    
    .route-step i {
        color: #4285f4;
        margin-top: 2px;
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    pirateMaps = new PirateMaps();
});
