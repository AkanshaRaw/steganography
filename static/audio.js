// DOM Elements - Encode Tab
const audioEncodeForm = document.getElementById('audio-encode-form');
const audioEncodeFile = document.getElementById('audio-encode-file');
const audioEncodeUploadArea = document.getElementById('audio-encode-upload-area');
const audioEncodeFileName = document.getElementById('audio-encode-file-name');
const audioEncodeMessage = document.getElementById('audio-encode-message');
const audioEncodeCharCounter = document.getElementById('audio-encode-char-counter');
const audioEncodeLoading = document.getElementById('audio-encode-loading');
const audioEncodeResult = document.getElementById('audio-encode-result');
const audioEncodeDownload = document.getElementById('audio-encode-download');
const audioEncodeReset = document.getElementById('audio-encode-reset');

// DOM Elements - Decode Tab
const audioDecodeForm = document.getElementById('audio-decode-form');
const audioDecodeFile = document.getElementById('audio-decode-file');
const audioDecodeUploadArea = document.getElementById('audio-decode-upload-area');
const audioDecodeFileName = document.getElementById('audio-decode-file-name');
const audioDecodeLoading = document.getElementById('audio-decode-loading');
const audioDecodeResult = document.getElementById('audio-decode-result');
const audioDecodeResultContent = document.getElementById('audio-decode-result-content');
const audioCopyMessage = document.getElementById('audio-copy-message');
const audioDecodeReset = document.getElementById('audio-decode-reset');

// Tab switching (if tabs exist)
const audioTabButtons = document.querySelectorAll('.tab-button');
const audioTabContents = document.querySelectorAll('.tab-content');
const audioTabIndicator = document.querySelector('.tab-indicator');
const themeToggle = document.getElementById('themeToggle');

document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
});

if (themeToggle) {
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
}

if (audioTabButtons.length) {
    audioTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            audioTabButtons.forEach(btn => btn.classList.remove('active'));
            audioTabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            updateAudioTabIndicator(button);
        });
    });
    function updateAudioTabIndicator(activeTab) {
        if (!activeTab || !audioTabIndicator) return;
        audioTabIndicator.style.width = `${activeTab.offsetWidth}px`;
        audioTabIndicator.style.left = `${activeTab.offsetLeft}px`;
    }
    window.addEventListener('resize', () => {
        updateAudioTabIndicator(document.querySelector('.tab-button.active'));
    });
    // Initial indicator
    updateAudioTabIndicator(document.querySelector('.tab-button.active'));
}

let encodedAudioBlob = null;

// Character counter for message input
audioEncodeMessage.addEventListener('input', () => {
    const count = audioEncodeMessage.value.length;
    audioEncodeCharCounter.textContent = `${count} character${count !== 1 ? 's' : ''}`;
});

// Drag and Drop Logic - Encode
audioEncodeUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    audioEncodeUploadArea.classList.add('dragover');
});
audioEncodeUploadArea.addEventListener('dragleave', () => {
    audioEncodeUploadArea.classList.remove('dragover');
});
audioEncodeUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    audioEncodeUploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        audioEncodeFile.files = e.dataTransfer.files;
        handleAudioEncodeFileSelect();
    }
});
audioEncodeUploadArea.addEventListener('click', () => {
    audioEncodeFile.click();
});
audioEncodeFile.addEventListener('change', handleAudioEncodeFileSelect);

function handleAudioEncodeFileSelect() {
    if (audioEncodeFile.files && audioEncodeFile.files[0]) {
        const file = audioEncodeFile.files[0];
        if (!file.name.toLowerCase().endsWith('.wav')) {
            showAudioAlert('Please select a valid WAV audio file.', 'error');
            audioEncodeFile.value = '';
            return;
        }
        audioEncodeFileName.textContent = file.name;
        audioEncodeFileName.style.display = 'block';
    }
}

// Drag and Drop Logic - Decode
audioDecodeUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    audioDecodeUploadArea.classList.add('dragover');
});
audioDecodeUploadArea.addEventListener('dragleave', () => {
    audioDecodeUploadArea.classList.remove('dragover');
});
audioDecodeUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    audioDecodeUploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        audioDecodeFile.files = e.dataTransfer.files;
        handleAudioDecodeFileSelect();
    }
});
audioDecodeUploadArea.addEventListener('click', () => {
    audioDecodeFile.click();
});
audioDecodeFile.addEventListener('change', handleAudioDecodeFileSelect);

function handleAudioDecodeFileSelect() {
    if (audioDecodeFile.files && audioDecodeFile.files[0]) {
        const file = audioDecodeFile.files[0];
        if (!file.name.toLowerCase().endsWith('.wav')) {
            showAudioAlert('Please select a valid WAV audio file.', 'error');
            audioDecodeFile.value = '';
            return;
        }
        audioDecodeFileName.textContent = file.name;
        audioDecodeFileName.style.display = 'block';
    }
}

// Submit encode form
audioEncodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!audioEncodeFile.files[0]) {
        showAudioAlert('Please select a WAV audio file.', 'error');
        return;
    }
    if (!audioEncodeMessage.value.trim()) {
        showAudioAlert('Please enter a message to hide.', 'error');
        return;
    }
    audioEncodeLoading.style.display = 'block';
    audioEncodeForm.style.display = 'none';

    const formData = new FormData();
    formData.append('audio', audioEncodeFile.files[0]);
    formData.append('message', audioEncodeMessage.value);

    fetch('/audio/encode', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => { throw new Error(data.error || 'Error encoding audio'); });
        }
        return response.blob();
    })
    .then(blob => {
        encodedAudioBlob = blob;
        audioEncodeLoading.style.display = 'none';
        audioEncodeResult.style.display = 'block';
        audioEncodeResult.classList.add('success');
        audioEncodeResult.querySelector('.result-message').innerHTML =
            '<i class="fas fa-check-circle"></i> Message successfully hidden in audio!';
    })
    .catch(error => {
        audioEncodeLoading.style.display = 'none';
        audioEncodeForm.style.display = 'block';
        showAudioAlert(error.message, 'error');
    });
});

// Download encoded audio
audioEncodeDownload.addEventListener('click', () => {
    if (!encodedAudioBlob) return;
    const url = URL.createObjectURL(encodedAudioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stego_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Submit decode form
audioDecodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!audioDecodeFile.files[0]) {
        showAudioAlert('Please select a WAV audio file.', 'error');
        return;
    }
    audioDecodeLoading.style.display = 'block';
    audioDecodeForm.style.display = 'none';

    const formData = new FormData();
    formData.append('audio', audioDecodeFile.files[0]);

    fetch('/audio/decode', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        audioDecodeLoading.style.display = 'none';
        audioDecodeResult.style.display = 'block';
        if (data.message) {
            audioDecodeResultContent.textContent = data.message;
        } else {
            audioDecodeResultContent.textContent = 'No hidden message found.';
        }
    })
    .catch(error => {
        audioDecodeLoading.style.display = 'none';
        audioDecodeForm.style.display = 'block';
        showAudioAlert('Error decoding audio.', 'error');
    });
});

// Copy decoded message
audioCopyMessage.addEventListener('click', () => {
    const message = audioDecodeResultContent.textContent;
    navigator.clipboard.writeText(message)
        .then(() => {
            const originalText = audioCopyMessage.textContent;
            audioCopyMessage.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                audioCopyMessage.textContent = originalText;
            }, 2000);
        });
});

// Reset encode form
audioEncodeReset.addEventListener('click', () => {
    audioEncodeForm.reset();
    audioEncodeFileName.style.display = 'none';
    audioEncodeResult.style.display = 'none';
    audioEncodeForm.style.display = 'block';
    audioEncodeCharCounter.textContent = '0 characters';
    encodedAudioBlob = null;
});

// Reset decode form
audioDecodeReset.addEventListener('click', () => {
    audioDecodeForm.reset();
    audioDecodeFileName.style.display = 'none';
    audioDecodeResult.style.display = 'none';
    audioDecodeForm.style.display = 'block';
});

// Show alert message
function showAudioAlert(message, type) {
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
