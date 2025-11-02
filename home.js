// Update time display
function updateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('time').textContent = now.toLocaleDateString('en-US', options);
}

// Initialize time and update every minute
updateTime();
setInterval(updateTime, 60000);

// Handle house photo upload
const uploadBtn = document.getElementById('uploadBtn');
const resetBtn = document.getElementById('resetBtn');
const housePhoto = document.getElementById('housePhoto');
const houseVisual = document.querySelector('.house-visual');

// Store the original SVG content
const originalSVG = houseVisual.innerHTML;

uploadBtn.addEventListener('click', () => {
    housePhoto.click();
});

housePhoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = (event) => {
            // Replace SVG with uploaded image
            houseVisual.innerHTML = `<img src="${event.target.result}" alt="Your House">`;

            // Show reset button
            resetBtn.style.display = 'inline-block';

            // Update status
            document.getElementById('statusText').textContent = 'Looking good!';

            // Save to localStorage
            localStorage.setItem('housePhoto', event.target.result);
        };

        reader.readAsDataURL(file);
    }
});

resetBtn.addEventListener('click', () => {
    // Restore original SVG
    houseVisual.innerHTML = originalSVG;

    // Hide reset button
    resetBtn.style.display = 'none';

    // Reset status
    document.getElementById('statusText').textContent = "You're home!";

    // Clear localStorage
    localStorage.removeItem('housePhoto');

    // Clear file input
    housePhoto.value = '';
});

// Load saved photo on page load
window.addEventListener('load', () => {
    const savedPhoto = localStorage.getItem('housePhoto');
    if (savedPhoto) {
        houseVisual.innerHTML = `<img src="${savedPhoto}" alt="Your House">`;
        resetBtn.style.display = 'inline-block';
        document.getElementById('statusText').textContent = 'Looking good!';
    }
});

// Welcome animation
document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById('statusText');
    statusText.style.opacity = '0';

    setTimeout(() => {
        statusText.style.transition = 'opacity 1s ease-in';
        statusText.style.opacity = '1';
    }, 300);
});
