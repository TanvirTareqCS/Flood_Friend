// main.js - General JavaScript functionality

// Format dates nicely
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Handle form validation
function validateForm(formData, requiredFields) {
    for (const field of requiredFields) {
        if (!formData[field] || formData[field].trim() === '') {
            alert(`Please fill in the ${field} field`);
            return false;
        }
    }
    return true;
}

// Show/hide loading spinner
function showLoading() {
    let spinner = document.getElementById('loading-spinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.id = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner-overlay">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
        document.body.appendChild(spinner);
    }
    spinner.style.display = 'block';
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Add spinner styles dynamically
const spinnerStyles = `
    .spinner-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
    }
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 2s linear infinite;
        margin-bottom: 10px;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = spinnerStyles;
document.head.appendChild(styleSheet);

// Handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    alert('An error occurred. Please try again.');
    hideLoading();
}

// Get user's location
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            }
        );
    });
}

// Auto-fill location coordinates when user clicks on map
function setupMapCoordinateFill() {
    const latInputs = document.querySelectorAll('input[id*="Lat"], input[id*="lat"]');
    const lngInputs = document.querySelectorAll('input[id*="Lng"], input[id*="lng"], input[id*="Lon"], input[id*="lon"]');

    if (latInputs.length > 0 && lngInputs.length > 0) {
        document.addEventListener('mapCoordinateSelected', (event) => {
            const { lat, lng } = event.detail;
            latInputs.forEach(input => input.value = lat);
            lngInputs.forEach(input => input.value = lng);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Flood Friend initialized');
    setupMapCoordinateFill();

    // Add any page-specific initializations here
});