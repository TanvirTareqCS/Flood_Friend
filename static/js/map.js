// Initialize the map
console.log('Initializing map...');

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    const map = L.map('map').setView([20, 0], 2);

    console.log('Map container found:', document.getElementById('map'));
    console.log('Leaflet available:', typeof L !== 'undefined');

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    console.log('Map initialized successfully');
    console.log('Alerts data:', alertsData);
    console.log('Resources data:', resourcesData);

    // Define icons for different alert severities
    const alertIcons = {
        critical: L.divIcon({
            html: '🚨',
            className: 'alert-icon critical',
            iconSize: [30, 30]
        }),
        high: L.divIcon({
            html: '⚠️',
            className: 'alert-icon high',
            iconSize: [25, 25]
        }),
        medium: L.divIcon({
            html: '🔶',
            className: 'alert-icon medium',
            iconSize: [20, 20]
        }),
        low: L.divIcon({
            html: '🔷',
            className: 'alert-icon low',
            iconSize: [15, 15]
        })
    };

    const resourceIcon = L.divIcon({
        html: '🏥',
        className: 'resource-icon',
        iconSize: [25, 25]
    });

    // Add alerts to map
    console.log('Adding alerts to map:', alertsData);
    alertsData.forEach(alert => {
        try {
            const icon = alertIcons[alert.severity.toLowerCase()] || alertIcons.low;
            const marker = L.marker([alert.latitude, alert.longitude], { icon: icon })
                .addTo(map)
                .bindPopup(`
                    <div class="map-popup">
                        <h3>${alert.title}</h3>
                        <p><strong>Severity:</strong> <span class="severity-${alert.severity.toLowerCase()}">${alert.severity}</span></p>
                        <p><strong>Location:</strong> ${alert.location}</p>
                        <p><strong>Description:</strong> ${alert.description}</p>
                        <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                `);
            console.log('Added alert marker:', alert.title);
        } catch (error) {
            console.error('Error adding alert marker:', error, alert);
        }
    });

    // Add resources to map
    console.log('Adding resources to map:', resourcesData);
    resourcesData.forEach(resource => {
        try {
            const marker = L.marker([resource.latitude, resource.longitude], { icon: resourceIcon })
                .addTo(map)
                .bindPopup(`
                    <div class="map-popup">
                        <h3>${resource.name}</h3>
                        <p><strong>Type:</strong> ${resource.type}</p>
                        <p><strong>Location:</strong> ${resource.location}</p>
                        <p><strong>Description:</strong> ${resource.description || 'No description'}</p>
                        ${resource.capacity ? `<p><strong>Capacity:</strong> ${resource.capacity}</p>` : ''}
                        ${resource.contact ? `<p><strong>Contact:</strong> ${resource.contact}</p>` : ''}
                    </div>
                `);
            console.log('Added resource marker:', resource.name);
        } catch (error) {
            console.error('Error adding resource marker:', error, resource);
        }
    });

    // Add click event for adding new markers (if logged in)
    let addingAlert = false;
    let addingResource = false;

    const addAlertBtn = document.getElementById('addAlertBtn');
    const addResourceBtn = document.getElementById('addResourceBtn');

    if (addAlertBtn) {
        addAlertBtn.addEventListener('click', () => {
            addingAlert = true;
            addingResource = false;
            alert('Click on the map to add an alert. After clicking, you will be prompted for alert details.');
        });
    }

    if (addResourceBtn) {
        addResourceBtn.addEventListener('click', () => {
            addingResource = true;
            addingAlert = false;
            alert('Click on the map to add a resource. After clicking, you will be prompted for resource details.');
        });
    }

    map.on('click', function(e) {
        if (addingAlert) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            const title = prompt('Enter alert title:');
            if (!title) {
                addingAlert = false;
                return;
            }

            const location = prompt('Enter location name:');
            if (!location) {
                addingAlert = false;
                return;
            }

            const severity = prompt('Enter severity (Critical/High/Medium/Low):');
            if (!severity) {
                addingAlert = false;
                return;
            }

            const description = prompt('Enter description:');
            if (!description) {
                addingAlert = false;
                return;
            }

            if (title && location && severity && description) {
                fetch('/alerts/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: title,
                        location: location,
                        severity: severity,
                        description: description,
                        latitude: lat,
                        longitude: lng
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert('Alert added successfully!');
                        location.reload();
                    } else {
                        alert('Error: ' + data.error);
                    }
                })
                .catch(error => {
                    alert('Error adding alert: ' + error);
                });
            }

            addingAlert = false;
        }

        if (addingResource) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            const name = prompt('Enter resource name:');
            if (!name) {
                addingResource = false;
                return;
            }

            const type = prompt('Enter resource type (shelter/food/medicine/water/clothing/rescue):');
            if (!type) {
                addingResource = false;
                return;
            }

            const locationName = prompt('Enter location name:');
            if (!locationName) {
                addingResource = false;
                return;
            }

            const description = prompt('Enter description:');
            const capacity = prompt('Enter capacity (optional):');
            const contact = prompt('Enter contact information (optional):');

            if (name && type && locationName) {
                fetch('/resources/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        type: type,
                        location: locationName,
                        description: description || '',
                        latitude: lat,
                        longitude: lng,
                        capacity: capacity ? parseInt(capacity) : null,
                        contact: contact || ''
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert('Resource added successfully!');
                        location.reload();
                    } else {
                        alert('Error: ' + data.error);
                    }
                })
                .catch(error => {
                    alert('Error adding resource: ' + error);
                });
            }

            addingResource = false;
        }
    });

    // Add some debug info
    console.log('Map script loaded successfully');
    console.log('Number of alerts:', alertsData.length);
    console.log('Number of resources:', resourcesData.length);

    // Force map to invalidate size in case it was hidden initially
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
});