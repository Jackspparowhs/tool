// API Configuration
const API_BASE_URL = 'https://api.xhamsterapi.com/videos';
const MOCK_VIDEOS = [
    {
        id: 12345,
        title: "Amazing Nature Documentary",
        thumbnail: "https://picsum.photos/400/300?random=1",
        duration: "12:34",
        views: "1.2M",
        likes: "15.3K",
        quality: "HD",
        category: "nature"
    },
    {
        id: 12346,
        title: "Technology Review 2024",
        thumbnail: "https://picsum.photos/400/300?random=2",
        duration: "08:45",
        views: "890K",
        likes: "12.1K",
        quality: "4K",
        category: "technology"
    },
    {
        id: 12347,
        title: "Cooking Masterclass",
        thumbnail: "https://picsum.photos/400/300?random=3",
        duration: "25:12",
        views: "2.5M",
        likes: "28.7K",
        quality: "HD",
        category: "cooking"
    },
    {
        id: 12348,
        title: "Travel Vlog Europe",
        thumbnail: "https://picsum.photos/400/300?random=4",
        duration: "18:56",
        views: "567K",
        likes: "8.9K",
        quality: "HD",
        category: "travel"
    },
    {
        id: 12349,
        title: "Fitness Workout Routine",
        thumbnail: "https://picsum.photos/400/300?random=5",
        duration: "30:22",
        views: "3.1M",
        likes: "45.2K",
        quality: "4K",
        category: "fitness"
    },
    {
        id: 12350,
        title: "Music Production Tips",
        thumbnail: "https://picsum.photos/400/300?random=6",
        duration: "15:18",
        views: "445K",
        likes: "6.7K",
        quality: "HD",
        category: "music"
    }
];

const CATEGORIES = [
    'All', 'Nature', 'Technology', 'Cooking', 'Travel', 'Fitness', 
    'Music', 'Gaming', 'Education', 'Entertainment', 'Sports', 'News'
];

// State Management
let currentCategory = 'all';
let currentView = 'grid';
let currentVideos = [];

// DOM Elements
const videoGrid = document.getElementById('video-grid');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sectionTitle = document.getElementById('section-title');
const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const modalVideoTitle = document.getElementById('modal-video-title');
const modalVideoViews = document.getElementById('modal-video-views');
const modalVideoLikes = document.getElementById('modal-video-likes');
const modalVideoDuration = document.getElementById('modal-video-duration');
const closeModal = document.querySelector('.close-modal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeCategories();
    loadVideos();
    setupEventListeners();
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
        link.innerHTML = `<i class="fas fa-tag"></i> ${category}`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            filterByCategory(category.toLowerCase());
            setActiveNavLink(link);
        });
        li.appendChild(link);
        categoriesList.appendChild(li);
    });
}

// Load Videos
async function loadVideos() {
    showLoading();
    try {
        // In a real implementation, you would fetch from the API
        // const response = await fetch(`${API_BASE_URL}/popular`);
        // const data = await response.json();
        
        // For now, using mock data
        setTimeout(() => {
            currentVideos = MOCK_VIDEOS;
            renderVideos(currentVideos);
            hideLoading();
        }, 1000);
    } catch (error) {
        console.error('Error loading videos:', error);
        showError('Failed to load videos');
        hideLoading();
    }
}

// Render Videos
function renderVideos(videos) {
    videoGrid.innerHTML = '';
    
    if (videos.length === 0) {
        videoGrid.innerHTML = '<div class="no-results">No videos found</div>';
        return;
    }

    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        videoGrid.appendChild(videoCard);
    });
}

// Create Video Card
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}">
            <span class="video-duration">${video.duration}</span>
            <span class="video-quality">${video.quality}</span>
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.title}</h3>
            <div class="video-meta">
                <span class="video-views">
                    <i class="fas fa-eye"></i> ${video.views}
                </span>
                <span class="video-likes">
                    <i class="fas fa-thumbs-up"></i> ${video.likes}
                </span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => openVideoModal(video));
    return card;
}

// Open Video Modal
function openVideoModal(video) {
    // In a real implementation, you would fetch the actual video URL
    // fetch(`${API_BASE_URL}/${video.id}`)
    //     .then(response => response.json())
    //     .then(data => {
    //         videoPlayer.src = data.video_url;
    //     });
    
    modalVideoTitle.textContent = video.title;
    modalVideoViews.textContent = `${video.views} views`;
    modalVideoLikes.textContent = `${video.likes} likes`;
    modalVideoDuration.textContent = video.duration;
    
    // Mock video source - in real implementation, this would come from API
    videoPlayer.src = "https://www.w3schools.com/html/mov_bbb.mp4";
    
    videoModal.style.display = 'flex';
    videoPlayer.play();
}

// Close Video Modal
function closeVideoModal() {
    videoModal.style.display = 'none';
    videoPlayer.pause();
    videoPlayer.src = '';
}

// Filter by Category
function filterByCategory(category) {
    currentCategory = category;
    sectionTitle.textContent = category === 'all' ? 'Featured Videos' : `${category.charAt(0).toUpperCase() + category.slice(1)} Videos`;
    
    if (category === 'all') {
        currentVideos = MOCK_VIDEOS;
    } else {
        currentVideos = MOCK_VIDEOS.filter(video => 
            video.category.toLowerCase() === category.toLowerCase()
        );
    }
    
    renderVideos(currentVideos);
}

// Search Videos
function searchVideos(query) {
    if (!query.trim()) {
        currentVideos = MOCK_VIDEOS;
    } else {
        currentVideos = MOCK_VIDEOS.filter(video =>
            video.title.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    sectionTitle.textContent = query ? `Search Results for "${query}"` : 'Featured Videos';
    renderVideos(currentVideos);
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
    videoGrid.className = view === 'list' ? 'video-grid list-view' : 'video-grid';
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.view-btn').classList.add('active');
}

// Show/Hide Loading
function showLoading() {
    loading.style.display = 'block';
    videoGrid.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
    videoGrid.style.display = 'grid';
}

// Show Error
function showError(message) {
    videoGrid.innerHTML = `<div class="error-message">${message}</div>`;
}

// Setup Event Listeners
function setupEventListeners() {
    // Search
    searchBtn.addEventListener('click', () => {
        searchVideos(searchInput.value);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchVideos(searchInput.value);
        }
    });
    
    // View Toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggleView(btn.getAttribute('data-view'));
        });
    });
    
    // Modal
    closeModal.addEventListener('click', closeVideoModal);
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
        }
    });
}

// Real API Integration Example (commented out for safety)
/*
async function fetchVideoFromAPI(videoId) {
    try {
        const response = await fetch(`${API_BASE_URL}/${videoId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching video:', error);
        throw error;
    }
}

async function fetchPopularVideos() {
    try {
        const response = await fetch(`${API_BASE_URL}/popular`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.videos;
    } catch (error) {
        console.error('Error fetching popular videos:', error);
        throw error;
    }
}
*/
