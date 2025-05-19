// DOM Elements - Global
const themeToggle = document.getElementById('themeToggle');
const tabButtons = document.querySelectorAll('.tab-button');
const tabIndicator = document.querySelector('.tab-indicator');
const tabContents = document.querySelectorAll('.tab-content');

// DOM Elements - Encode Tab
const encodeForm = document.getElementById('encode-form');
const encodeImage = document.getElementById('encode-image');
const encodeUploadArea = document.getElementById('encode-upload-area');
const encodeFileName = document.getElementById('encode-file-name');
const encodePreviewContainer = document.getElementById('encode-preview-container');
const encodePreviewImage = document.getElementById('encode-preview-image');
const encodeMessage = document.getElementById('encode-message');
const encodeCharCounter = document.getElementById('encode-char-counter');
const capacityProgress = document.getElementById('capacity-progress');
const encodeUsePassword = document.getElementById('encode-use-password');
const encodePasswordInput = document.getElementById('encode-password-input');
const encodeLoading = document.getElementById('encode-loading');
const encodeResult = document.getElementById('encode-result');
const encodeButton = document.getElementById('encode-button');
const encodeDownload = document.getElementById('encode-download');
const encodeReset = document.getElementById('encode-reset');

// DOM Elements - Decode Tab
const decodeForm = document.getElementById('decode-form');
const decodeImage = document.getElementById('decode-image');
const decodeUploadArea = document.getElementById('decode-upload-area');
const decodeFileName = document.getElementById('decode-file-name');
const decodePreviewContainer = document.getElementById('decode-preview-container');
const decodePreviewImage = document.getElementById('decode-preview-image');
const decodeUsePassword = document.getElementById('decode-use-password');
const decodePasswordInput = document.getElementById('decode-password-input');
const decodeLoading = document.getElementById('decode-loading');
const decodeResult = document.getElementById('decode-result');
const decodeResultContent = document.getElementById('decode-result-content');
const copyMessage = document.getElementById('copy-message');
const decodeReset = document.getElementById('decode-reset');

// Global Variables
let encodedImageBlob = null;

// Initialize animations and theme based on user preference
document.addEventListener('DOMContentLoaded', () => {
    // Set initial tab indicator position
    updateTabIndicator(document.querySelector('.tab-button.active'));
    
    // Add animation delays to form groups
    animateFormGroups();
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Add parallax effect to logo
    addParallaxEffect();
    
    // Start button animations
    animateButtons();
});

// Add animation delay indices to form groups
function animateFormGroups() {
    document.querySelectorAll('.form-group').forEach((group, index) => {
        group.style.setProperty('--item-index', index + 1);
    });
}

// Update tab indicator position
function updateTabIndicator(activeTab) {
    if (!activeTab || !tabIndicator) return;
    
    tabIndicator.style.width = `${activeTab.offsetWidth}px`;
    tabIndicator.style.left = `${activeTab.offsetLeft}px`;
}

// Add parallax effect to logo
function addParallaxEffect() {
    const logo = document.querySelector('.logo');
    if (!logo) return;
    
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.pageX) / 30;
        const y = (window.innerHeight / 2 - e.pageY) / 30;
        
        logo.style.transform = `translateX(${x}px) translateY(${y}px)`;
    });
}

// Animate buttons randomly
function animateButtons() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        const randomDelay = Math.random() * 3;
        button.style.animationDelay = `${randomDelay}s`;
    });
}

// Tab Switching Logic
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Update tab indicator position
        updateTabIndicator(button);
    });
});

// Theme Toggle Logic
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    }
});

// Drag and Drop Logic - Encode
encodeUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    encodeUploadArea.classList.add('dragover');
});

encodeUploadArea.addEventListener('dragleave', () => {
    encodeUploadArea.classList.remove('dragover');
});

encodeUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    encodeUploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
        encodeImage.files = e.dataTransfer.files;
        handleEncodeImageSelect();
    }
});

encodeUploadArea.addEventListener('click', () => {
    encodeImage.click();
});

encodeImage.addEventListener('change', handleEncodeImageSelect);

// Drag and Drop Logic - Decode
decodeUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    decodeUploadArea.classList.add('dragover');
});

decodeUploadArea.addEventListener('dragleave', () => {
    decodeUploadArea.classList.remove('dragover');
});

decodeUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    decodeUploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
        decodeImage.files = e.dataTransfer.files;
        handleDecodeImageSelect();
    }
});

decodeUploadArea.addEventListener('click', () => {
    decodeImage.click();
});

decodeImage.addEventListener('change', handleDecodeImageSelect);

// Handle file selection for encode tab
function handleEncodeImageSelect() {
    if (encodeImage.files && encodeImage.files[0]) {
        const file = encodeImage.files[0];
        
        // Check file type
        if (!file.type.match('image.*')) {
            showAlert('Please select a valid image file.', 'error');
            return;
        }
        
        // Display file name
        encodeFileName.textContent = file.name;
        encodeFileName.style.display = 'block';
        
        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            encodePreviewImage.src = e.target.result;
            encodePreviewContainer.style.display = 'block';
            
            // Check image capacity for message if there's text already
            if (encodeMessage.value.trim().length > 0) {
                checkMessageCapacity();
            }
        };
        reader.readAsDataURL(file);
    }
}

// Handle file selection for decode tab
function handleDecodeImageSelect() {
    if (decodeImage.files && decodeImage.files[0]) {
        const file = decodeImage.files[0];
        
        // Check file type
        if (!file.type.match('image.*')) {
            showAlert('Please select a valid image file.', 'error');
            return;
        }
        
        // Display file name
        decodeFileName.textContent = file.name;
        decodeFileName.style.display = 'block';
        
        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            decodePreviewImage.src = e.target.result;
            decodePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Check message capacity against selected image
function checkMessageCapacity() {
    if (!encodeImage.files[0] || !encodeMessage.value) {
        capacityProgress.style.width = '0%';
        return;
    }
    
    const formData = new FormData();
    formData.append('image', encodeImage.files[0]);
    formData.append('message', encodeMessage.value);
    
    fetch('/api/check-capacity', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showAlert(data.error, 'error');
            return;
        }
        
        // Update capacity progress bar
        const percentage = data.capacityPercent;
        capacityProgress.style.width = `${percentage}%`;
        
        // Color based on capacity
        if (percentage > 85) {
            capacityProgress.className = 'capacity-progress danger';
        } else if (percentage > 60) {
            capacityProgress.className = 'capacity-progress warning';
        } else {
            capacityProgress.className = 'capacity-progress';
        }
        
        // Check if message is too long
        if (!data.canEncode) {
            showAlert(`Message is too long for this image. Maximum: ${data.maxCapacity} characters.`, 'error');
            encodeButton.disabled = true;
        } else {
            encodeButton.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error checking capacity:', error);
        showAlert('Error checking image capacity.', 'error');
    });
}

// Character counter for message input
encodeMessage.addEventListener('input', () => {
    const count = encodeMessage.value.length;
    encodeCharCounter.textContent = `${count} character${count !== 1 ? 's' : ''}`;
    
    if (encodeImage.files && encodeImage.files[0]) {
        checkMessageCapacity();
    }
});

// Password toggle for encode
encodeUsePassword.addEventListener('change', () => {
    encodePasswordInput.style.display = encodeUsePassword.checked ? 'block' : 'none';
});

// Password toggle for decode
decodeUsePassword.addEventListener('change', () => {
    decodePasswordInput.style.display = decodeUsePassword.checked ? 'block' : 'none';
});

// Submit encode form
encodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!encodeImage.files[0]) {
        showAlert('Please select an image.', 'error');
        return;
    }
    
    if (!encodeMessage.value.trim()) {
        showAlert('Please enter a message to hide.', 'error');
        return;
    }
    
    // Show loading indicator
    encodeLoading.style.display = 'block';
    encodeForm.style.display = 'none';
    
    // Prepare form data
    const formData = new FormData();
    formData.append('image', encodeImage.files[0]);
    formData.append('message', encodeMessage.value);
    
    if (encodeUsePassword.checked && document.getElementById('encode-password').value) {
        formData.append('password', document.getElementById('encode-password').value);
    }
    
    // Send request to server
    fetch('/encode', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Error encoding message');
            });
        }
        return response.blob();
    })
    .then(blob => {
        // Store blob for download
        encodedImageBlob = blob;
        
        // Display success
        encodeLoading.style.display = 'none';
        encodeResult.style.display = 'block';
        encodeResult.classList.add('success');
        encodeResult.querySelector('.result-message').innerHTML = 
            '<i class="fas fa-check-circle"></i> Message successfully hidden in image!';
    })
    .catch(error => {
        console.error('Error encoding:', error);
        
        // Display error
        encodeLoading.style.display = 'none';
        encodeForm.style.display = 'block';
        showAlert(error.message, 'error');
    });
});

// Download encoded image
encodeDownload.addEventListener('click', () => {
    if (!encodedImageBlob) return;
    
    const url = URL.createObjectURL(encodedImageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stego_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Reset encode form
encodeReset.addEventListener('click', () => {
    encodeForm.reset();
    encodeFileName.style.display = 'none';
    encodePreviewContainer.style.display = 'none';
    encodeResult.style.display = 'none';
    encodeForm.style.display = 'block';
    encodeCharCounter.textContent = '0 characters';
    encodePasswordInput.style.display = 'none';
    capacityProgress.style.width = '0%';
    encodedImageBlob = null;
});

// Submit decode form
decodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!decodeImage.files[0]) {
        showAlert('Please select an image.', 'error');
        return;
    }
    
    // Show loading indicator
    decodeLoading.style.display = 'block';
    decodeForm.style.display = 'none';
    
    // Prepare form data
    const formData = new FormData();
    formData.append('image', decodeImage.files[0]);
    
    if (decodeUsePassword.checked && document.getElementById('decode-password').value) {
        formData.append('password', document.getElementById('decode-password').value);
    }
    
    // Send request to server
    fetch('/decode', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        decodeLoading.style.display = 'none';
        
        if (data.error) {
            decodeForm.style.display = 'block';
            showAlert(data.error, 'error');
            return;
        }
        
        // Display decoded message
        decodeResult.style.display = 'block';
        decodeResultContent.textContent = data.message || 'No hidden message found or incorrect password.';
    })
    .catch(error => {
        console.error('Error decoding:', error);
        
        // Display error
        decodeLoading.style.display = 'none';
        decodeForm.style.display = 'block';
        showAlert('Error decoding message.', 'error');
    });
});

// Copy decoded message
copyMessage.addEventListener('click', () => {
    const message = decodeResultContent.textContent;
    
    navigator.clipboard.writeText(message)
        .then(() => {
            const originalText = copyMessage.textContent;
            copyMessage.innerHTML = '<i class="fas fa-check"></i> Copied!';
            
            setTimeout(() => {
                copyMessage.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy text:', err);
            showAlert('Failed to copy to clipboard.', 'error');
        });
});

// Reset decode form
decodeReset.addEventListener('click', () => {
    decodeForm.reset();
    decodeFileName.style.display = 'none';
    decodePreviewContainer.style.display = 'none';
    decodeResult.style.display = 'none';
    decodeForm.style.display = 'block';
    decodePasswordInput.style.display = 'none';
});

// Show alert message
function showAlert(message, type) {
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    // Add icon based on type
    if (type === 'error') {
        alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    } else if (type === 'success') {
        alert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    } else {
        alert.textContent = message;
    }
    
    // Insert alert at top of active tab
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.insertBefore(alert, activeTab.firstChild);
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
    }, 5000);
}

// Window resize handler for tab indicator
window.addEventListener('resize', () => {
    updateTabIndicator(document.querySelector('.tab-button.active'));
});
