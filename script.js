// Pexels API Configuration
const API_KEY = 'sCGpOigHSBn3xjOTedMS977vcjXS3bguZuxGIvj6f39tT6LF1xNFkxh3';
const API_BASE_URL = 'https://api.pexels.com/v1';
const API_VIDEOS_URL = 'https://api.pexels.com/videos';

// Stock Media Categories
const CATEGORIES = [
    'All', 'Nature', 'Business', 'Technology', 'People', 'Architecture',
    'Food & Drink', 'Travel', 'Animals', 'Fashion', 'Sports', 'Music',
    'Arts & Culture', 'Abstract', 'Backgrounds', 'Science', 'Education',
    'Health', 'Industry', 'Transportation', 'Landscapes', 'Macro'
];

// State Management
let currentMediaType = 'all'; // all, photos, videos
let currentCollection = 'trending';
let currentCategory = '';
let currentOrientation = '';
let currentColor = '';
let currentQuery = '';
let currentPage = 1;
let currentView = 'grid';
let currentMediaList = [];
let isLoading = false;

// DOM Elements
const mediaGrid = document.getElementById('media-grid');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sectionTitle = document.getElementById('section-title');
const mediaModal = document.getElementById('media-modal');
const modalImage = document.getElementById('modal-image');
const modalVideo = document.getElementById('modal-video');
const modalMediaTitle = document.getElementById('modal-media-title');
const modalPhotographer = document.getElementById('modal-photographer-link');
const modalMediaSize = document.getElementById('modal-media-size');
const modalMediaType = document.getElementById('modal-media-type');
const closeModal = document.querySelector('.close-modal');
const downloadBtn = document.getElementById('download-btn');
const downloadSizeSelect = document.getElementById('download-size-select');
const orientationFilter = document.getElementById('orientation-filter');
const colorFilter = document.getElementById('color-filter');
const loadMoreBtn = document.getElementById('load-more-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const sidebarToggle = document.getElementById('sidebar-toggle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeCategories();
    setupEventListeners();
    loadMedia();
});

// Initialize Categories
function initializeCategories() {
    const categoriesList = document.getElementById('categories-list');
    CATEGORIES.forEach(category => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'nav-link';
        link.setAttribute('data-category', category.toLowerCase());
        const icon = category === 'All' ? 'fas fa-tag' : 
                    category === 'Nature' ? 'fas fa-leaf' :
                    category === 'Business' ? 'fas fa-briefcase' :
                    category === 'Technology' ? 'fas fa-microchip' :
                    category === 'People' ? 'fas fa-users' :
                    category === 'Architecture' ? 'fas fa-building' :
                    category === 'Food & Drink' ? 'fas fa-utensils' :
                    category === 'Travel' ? 'fas fa-plane' :
                    category === 'Animals' ? 'fas fa-paw' :
                    category === 'Fashion' ? 'fas fa-tshirt' :
                    category === 'Sports' ? 'fas fa-running' :
                    category === 'Music' ? 'fas fa-music' :
                    category === 'Arts & Culture' ? 'fas fa-palette' :
                    category === 'Abstract' ? 'fas fa-shapes' :
                    category === 'Backgrounds' ? 'fas fa-image' :
                    category === 'Science' ? 'fas fa-flask' :
                    category === 'Education' ? 'fas fa-graduation-cap' :
                    category === 'Health' ? 'fas fa-heartbeat' :
                    category === 'Industry' ? 'fas fa-industry' :
                    category === 'Transportation' ? 'fas fa-car' :
                    category === 'Landscapes' ? 'fas fa-mountain' :
                    category === 'Macro' ? 'fas fa-search-plus' : 'fas fa-tag';
        
        link.innerHTML = `<i class="${icon}"></i> ${category}`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = category === 'All' ? '' : category;
            currentPage = 1;
            loadMedia();
            setActiveNavLink(link);
        });
        li.appendChild(link);
        categoriesList.appendChild(li);
    });
}

// Load Media from Pexels API
async function loadMedia(loadMore = false) {
    if (isLoading) return;
    
    showLoading();
    isLoading = true;
    
    try {
        let url = '';
        const params = new URLSearchParams();
        
        // Build API URL based on media type
        if (currentMediaType === 'photos' || currentMediaType === 'all') {
            if (currentQuery) {
                url = `${API_BASE_URL}/search`;
                params.append('query', currentQuery);
            } else if (currentCategory) {
                url = `${API_BASE_URL}/search`;
                params.append('query', currentCategory);
            } else {
                url = `${API_BASE_URL}/curated`;
            }
        } else if (currentMediaType === 'videos') {
            if (currentQuery) {
                url = `${API_VIDEOS_URL}/search`;
                params.append('query', currentQuery);
            } else if (currentCategory) {
                url = `${API_VIDEOS_URL}/search`;
                params.append('query', currentCategory);
            } else {
                url = `${API_VIDEOS_URL}/popular`;
            }
        }
        
        // Add filters
        if (currentOrientation) params.append('orientation', currentOrientation);
        if (currentColor) params.append('color', currentColor);
        
        params.append('per_page', 30);
        params.append('page', currentPage);
        
        const fullUrl = `${url}?${params.toString()}`;
        console.log('Fetching:', fullUrl);
        
        const response = await fetch(fullUrl, {
            headers: {
                'Authorization': API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process and render media
        const mediaItems = processMediaData(data);
        
        if (loadMore) {
            currentMediaList = [...currentMediaList, ...mediaItems];
        } else {
            currentMediaList = mediaItems;
        }
        
        renderMedia(currentMediaList);
        
        // Update section title
        updateSectionTitle();
        
        // Update load more button visibility
        if (data.next_page) {
            loadMoreBtn.style.display = 'inline-block';
            loadMoreBtn.disabled = false;
        } else {
            loadMoreBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading media:', error);
        showError('Failed to load stock media. Please try again.');
    } finally {
        hideLoading();
        isLoading = false;
    }
}

// Process API data into unified format
function processMediaData(data) {
    const items = [];
    
    // Handle both photos and videos response
    const mediaArray = data.photos || data.videos || data.media || [];
    
    mediaArray.forEach(item => {
        // Photo item
        if (item.src || item.url) {
            items.push({
                id: item.id,
                type: 'photo',
                title: item.alt || 'Stock Photo',
                photographer: item.photographer || 'Unknown',
                photographer_url: item.photographer_url || '#',
                url: item.src?.original || item.url || '',
                thumbnail: item.src?.medium || item.src?.large || item.url || '',
                width: item.width,
                height: item.height,
                avg_color: item.avg_color || '#000000',
                liked: item.liked || false
            });
        }
        // Video item
        else if (item.video_files) {
            const bestVideo = item.video_files.find(file => file.quality === 'hd') || 
                             item.video_files[0];
            items.push({
                id: item.id,
                type: 'video',
                title: 'Stock Video',
                photographer: item.user?.name || 'Unknown',
                photographer_url: item.user?.url || '#',
                url: bestVideo?.link || '',
                thumbnail: item.image || '',
                width: bestVideo?.width,
                height: bestVideo?.height,
                duration: item.duration,
                liked: false
            });
        }
    });
    
    return items;
}

// Render Media Grid
function renderMedia(mediaItems) {
    mediaGrid.innerHTML = '';
    
    if (mediaItems.length === 0) {
        mediaGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-images"></i>
                <p>No media found matching your criteria</p>
            </div>
        `;
        return;
    }
    
    mediaItems.forEach((media, index) => {
        const mediaCard = createMediaCard(media);
        mediaCard.style.animationDelay = `${index * 0.05}s`;
        mediaGrid.appendChild(mediaCard);
    });
}

// Create Media Card
function createMediaCard(media) {
    const card = document.createElement('div');
    card.className = 'media-card';
    
    const thumbnailUrl = media.thumbnail || media.url;
    const mediaTypeIcon = media.type === 'video' ? 'fas fa-play' : 'fas fa-image';
    const sizeText = media.width && media.height ? `${media.width}×${media.height}` : 'Unknown';
    
    card.innerHTML = `
        <div class="media-thumbnail">
            ${media.type === 'video' ? 
                `<video src="${thumbnailUrl}" muted loop preload="metadata"></video>` :
                `<img src="${thumbnailUrl}" alt="${media.title}" loading="lazy">`
            }
            <span class="media-type-badge"><i class="${mediaTypeIcon}"></i> ${media.type}</span>
            <span class="media-size-badge">${sizeText}</span>
        </div>
        <div class="media-info">
            <h3 class="media-title">${media.title}</h3>
            <div class="media-meta">
                <span class="media-photographer">
                    <i class="fas fa-camera"></i> 
                    <a href="${media.photographer_url}" target="_blank" rel="noopener noreferrer">
                        ${media.photographer}
                    </a>
                </span>
            </div>
        </div>
    `;
    
    // Add hover effect for videos
    if (media.type === 'video') {
        const videoElement = card.querySelector('video');
        card.addEventListener('mouseenter', () => {
            videoElement.play().catch(() => {});
        });
        card.addEventListener('mouseleave', () => {
            videoElement.pause();
            videoElement.currentTime = 0;
        });
    }
    
    card.addEventListener('click', () => openMediaModal(media));
    return card;
}

// Open Media Modal
function openMediaModal(media) {
    // Hide all media first
    modalImage.style.display = 'none';
    modalVideo.style.display = 'none';
    
    // Show appropriate media type
    if (media.type === 'photo') {
        modalImage.src = media.url;
        modalImage.style.display = 'block';
        modalMediaSize.textContent = `${media.width} × ${media.height}px`;
        modalVideo.controls = false;
        
        // Setup download for photo
        downloadBtn.onclick = () => downloadMedia(media);
    } else if (media.type === 'video') {
        modalVideo.src = media.url;
        modalVideo.style.display = 'block';
        modalMediaSize.textContent = `${media.width} × ${media.height} • ${formatDuration(media.duration)}`;
        modalVideo.controls = true;
        
        // Setup download for video
        downloadBtn.onclick = () => downloadMedia(media);
    }
    
    modalMediaTitle.textContent = media.title;
    modalPhotographer.textContent = media.photographer;
    modalPhotographer.href = media.photographer_url;
    modalMediaType.textContent = media.type === 'photo' ? 'Photo' : 'Video';
    
    // Update favorite button state
    updateFavoriteButton(media.liked);
    favoriteBtn.onclick = () => toggleFavorite(media);
    
    // Share button
    shareBtn.onclick = () => shareMedia(media);
    
    mediaModal.style.display = 'flex';
    
    // Pause any playing videos in grid
    document.querySelectorAll('video').forEach(v => v.pause());
}

// Close Media Modal
function closeMediaModal() {
    mediaModal.style.display = 'none';
    modalImage.src = '';
    modalVideo.src = '';
    modalVideo.pause();
}

// Download Media
async function downloadMedia(media) {
    try {
        const selectedSize = downloadSizeSelect.value;
        let downloadUrl = media.url;
        
        // In real Pexels API, you'd get different sizes from media.src
        // For now, we'll use the original URL
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
        downloadBtn.disabled = true;
        
        // Create a temporary anchor element
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${media.id}-${selectedSize}.${media.type === 'video' ? 'mp4' : 'jpg'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Show success message
        downloadBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
        setTimeout(() => {
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Free';
            downloadBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Download failed:', error);
        downloadBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
        setTimeout(() => {
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Free';
            downloadBtn.disabled = false;
        }, 2000);
    }
}

// Toggle Favorite
function toggleFavorite(media) {
    media.liked = !media.liked;
    updateFavoriteButton(media.liked);
    
    // Store in localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (media.liked) {
        favorites.push(media);
    } else {
        const index = favorites.findIndex(f => f.id === media.id);
        if (index > -1) favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Update Favorite Button
function updateFavoriteButton(liked) {
    favoriteBtn.innerHTML = liked ? 
        '<i class="fas fa-heart"></i> Liked' : 
        '<i class="far fa-heart"></i> Favorite';
    favoriteBtn.style.color = liked ? '#ff6b6b' : '';
}

// Share Media
function shareMedia(media) {
    if (navigator.share) {
        navigator.share({
            title: media.title,
            text: `Check out this ${media.type} by ${media.photographer}`,
            url: window.location.href
        }).catch(() => {});
    } else {
        // Fallback: copy to clipboard
        const shareText = `${media.title} by ${media.photographer} - ${window.location.href}`;
        navigator.clipboard.writeText(shareText).then(() => {
            shareBtn.innerHTML = '<i class="fas fa-clipboard-check"></i> Copied!';
            setTimeout(() => {
                shareBtn.innerHTML = '<i class="fas fa-share"></i> Share';
            }, 2000);
        });
    }
}

// Format Duration
function formatDuration(seconds) {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Update Section Title
function updateSectionTitle() {
    let title = '';
    if (currentQuery) {
        title = `Search: "${currentQuery}"`;
    } else if (currentCategory) {
        title = currentCategory;
    } else if (currentCollection === 'favorites') {
        title = 'Favorite Media';
    } else {
        title = 'Featured Stock Media';
    }
    
     (ifcurrentMediaType !== 'all') {
        title += ` (${currentMediaType})`;
    }
    
    sectionTitle.textContent = title;
}

// Show/Hide Loading
function showLoading() {
    loading.style.display = 'block';
    mediaGrid.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
    mediaGrid.style.display = 'grid';
}

// Show Error
function showError(message) {
    mediaGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i> ${message}
        </div>
    `;
}

// Set Active Nav Link
function setActiveNavLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Toggle View
function toggleView(view) {
    currentView = view;
    mediaGrid.className = view === 'list' ? 'media-grid list-view' : 'media-grid';
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.view-btn').classList.add('active');
}

// Setup Event Listeners
function setupEventListeners() {
    // Media type navigation
    document.querySelectorAll('[data-media]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentMediaType = link.getAttribute('data-media');
            currentPage = 1;
            setActiveNavLink(link);
            loadMedia();
        });
    });
    
    // Collection navigation
    document.querySelectorAll('[data-collection]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const collection = link.getAttribute('data-collection');
            
            if (collection === 'favorites') {
                const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
                currentMediaList = favorites;
                renderMedia(currentMediaList);
                setActiveNavLink(link);
                sectionTitle.textContent = 'Favorite Media';
            } else {
                currentCollection = collection;
                currentPage = 1;
                setActiveNavLink(link);
                loadMedia();
            }
        });
    });
    
    // Search
    searchBtn.addEventListener('click', () => performSearch());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Filters
    orientationFilter.addEventListener('change', (e) => {
        currentOrientation = e.target.value;
        currentPage = 1;
        loadMedia();
    });
    
    colorFilter.addEventListener('change', (e) => {
        currentColor = e.target.value;
        currentPage = 1;
        loadMedia();
    });
    
    // View Toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggleView(btn.getAttribute('data-view'));
        });
    });
    
    // Modal
    closeModal.addEventListener('click', closeMediaModal);
    mediaModal.addEventListener('click', (e) => {
        if (e.target === mediaModal) closeMediaModal();
    });
    
    // Load More
    loadMoreBtn.addEventListener('click', () => {
        if (isLoading) return;
        currentPage++;
        loadMedia(true);
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMediaModal();
    });
    
    // Infinite scroll
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            if (loadMoreBtn.style.display !== 'none' && !isLoading) {
                currentPage++;
                loadMedia(true);
            }
        }
    });
    
    // Toggle sidebar
    sidebarToggle.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
}

// Perform Search
function performSearch() {
    currentQuery = searchInput.value.trim();
    currentPage = 1;
    loadMedia();
}

// Initial load
loadMedia();

/* Custom Scrollbar */
.sidebar::-webkit-scrollbar {
    width: 6px;
}

.sidebar::-webkit-scrollbar
