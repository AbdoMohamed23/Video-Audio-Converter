// Global variables
let selectedFiles = [];
let selectedFormat = '';
let selectedPackage = null;
let selectedPrice = 0;

// Translation helper function
function getTranslation(key) {
    const keys = key.split('.');
    let translation = window.translations || {};
    keys.forEach(k => {
        translation = translation[k];
    });
    return translation || key;
}

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const formatButtons = document.querySelectorAll('.format-btn');
const convertBtn = document.getElementById('convertBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const buyButtons = document.querySelectorAll('.buy-btn');
let paymentModal = null;
let closeModal = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    // Initialize modal elements
    paymentModal = document.getElementById('paymentModal');
    closeModal = document.querySelector('.close');

    initializeEventListeners();
    initializePayPal();

    // Initialize PayPal configuration if available
    if (typeof initializePayPalConfig === 'function') {
        initializePayPalConfig();
    }
});

function initializeEventListeners() {
    // File upload events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Format selection events
    formatButtons.forEach(btn => {
        btn.addEventListener('click', () => selectFormat(btn.dataset.format, btn));
    });

    // Convert button event
    convertBtn.addEventListener('click', startConversion);

    // Buy button events
    buyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            selectedPackage = btn.dataset.package;
            selectedPrice = parseFloat(btn.dataset.price);
            console.log('Selected package:', selectedPackage, 'Price:', selectedPrice);
            showPaymentModal();
        });
    });

    // Modal events
    if (closeModal) {
        closeModal.addEventListener('click', hidePaymentModal);
    }
    window.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            hidePaymentModal();
        }
    });
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#764ba2';
    uploadArea.style.background = 'rgba(102, 126, 234, 0.1)';
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '';

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function processFiles(files) {
    // Filter valid video/audio files
    const validFiles = files.filter(file => {
        return file.type.startsWith('video/') || file.type.startsWith('audio/');
    });

    if (validFiles.length === 0) {
        alert(getTranslation('messages.select_files'));
        return;
    }

    selectedFiles = validFiles;
    updateUploadArea();
    checkConvertButton();
}

function updateUploadArea() {
    const fileCount = selectedFiles.length;
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

    uploadArea.innerHTML = `
        <i class="fas fa-check-circle" style="color: #28a745;"></i>
        <h3>${fileCount} ${getTranslation('messages.files_selected')}</h3>
        <p>${getTranslation('messages.total_size')}: ${sizeInMB} MB</p>
        <input type="file" id="fileInput" accept="video/*,audio/*" multiple>
    `;

    // Re-attach event listener to new file input only
    const newFileInput = document.getElementById('fileInput');
    if (newFileInput) {
        newFileInput.addEventListener('change', handleFileSelect);
    }

    // Don't re-attach click event to upload area - it's already attached in initializeEventListeners
}

function selectFormat(format, button) {
    // Remove active class from all buttons
    formatButtons.forEach(btn => btn.classList.remove('active'));

    // Add active class to selected button
    button.classList.add('active');

    selectedFormat = format;
    checkConvertButton();
}

function checkConvertButton() {
    convertBtn.disabled = !(selectedFiles.length > 0 && selectedFormat);
}

function startConversion() {
    if (selectedFiles.length === 0 || !selectedFormat) {
        alert(getTranslation('messages.select_format'));
        return;
    }

    console.log('Starting conversion:', selectedFiles.length, 'files to', selectedFormat);

    // Show progress section
    progressSection.style.display = 'block';
    convertBtn.disabled = true;
    convertBtn.textContent = getTranslation('messages.converting_progress');

    // Simulate conversion progress
    simulateConversion();
}

function simulateConversion() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            completeConversion();
        }

        progressFill.style.width = progress + '%';
        progressText.textContent = `${getTranslation('messages.converting_progress')} ${Math.round(progress)}%`;
    }, 500);
}

function completeConversion() {
    progressText.textContent = getTranslation('messages.conversion_success');
    convertBtn.textContent = getTranslation('messages.pay_download');
    convertBtn.disabled = false;

    // Change convert button to payment button
    convertBtn.onclick = () => {
        selectedPackage = 'conversion';
        selectedPrice = calculateConversionPriceLocal();
        console.log('Conversion payment - Package:', selectedPackage, 'Price:', selectedPrice);
        showPaymentModal();
    };
}

function calculateConversionPriceLocal() {
    // Use the enhanced pricing calculator from paypal-config.js
    return calculateConversionPrice(selectedFiles);
}

function showPaymentModal() {
    if (!paymentModal) return;

    // Update modal content based on selected package
    updateModalContent();

    paymentModal.style.display = 'block';

    // Clear previous PayPal buttons
    const container = document.getElementById('paypal-button-container');
    if (container) {
        container.innerHTML = '';

        // Render new PayPal button
        renderPayPalButton();
    }
}

function hidePaymentModal() {
    if (paymentModal) {
        paymentModal.style.display = 'none';
    }
}

function updateModalContent() {
    const packageName = document.getElementById('packageName');
    const packageDescription = document.getElementById('packageDescription');
    const packagePrice = document.getElementById('packagePrice');

    if (!packageName || !packageDescription || !packagePrice) {
        console.error('Modal content elements not found');
        return;
    }

    if (selectedPackage === 'conversion') {
        packageName.textContent = getTranslation('payment.converting');
        packageDescription.textContent = `${getTranslation('messages.files_selected')} ${selectedFiles.length} ${getTranslation('messages.files_selected')} ${getTranslation('messages.total_size')} ${selectedFormat}`;
        packagePrice.textContent = `$${selectedPrice.toFixed(2)}`;
    } else if (PAYMENT_PACKAGES && PAYMENT_PACKAGES[selectedPackage]) {
        const package = PAYMENT_PACKAGES[selectedPackage];
        packageName.textContent = package.name;
        packageDescription.textContent = package.description;
        packagePrice.textContent = `$${package.price.toFixed(2)}`;
    } else {
        packageName.textContent = getTranslation('payment.converting');
        packageDescription.textContent = getTranslation('payment.converting');
        packagePrice.textContent = `$${selectedPrice.toFixed(2)}`;
    }
}

function initializePayPal() {
    // PayPal will be initialized when modal is shown
}

function renderPayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    if (typeof paypal === 'undefined') {
        console.error('PayPal SDK not loaded');
        container.innerHTML = '<p style="color: red;">خطأ في تحميل PayPal. يرجى المحاولة لاحقاً.</p>';
        return;
    }

    paypal.Buttons({
        style: PAYPAL_BUTTON_STYLE,

        createOrder: function (data, actions) {
            try {
                console.log('Creating PayPal order for package:', selectedPackage, 'price:', selectedPrice);
                const orderData = createPayPalOrder(selectedPackage, selectedPrice);
                console.log('Order data:', orderData);
                return actions.order.create(orderData);
            } catch (error) {
                console.error('Error creating PayPal order:', error);
                alert(getTranslation('payment.order_error'));
                return null;
            }
        },

        onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
                handlePayPalSuccess(details, selectedPackage);
                hidePaymentModal();
            });
        },

        onError: function (err) {
            console.error('PayPal Error:', err);
            alert(getTranslation('payment.error'));
        },

        onCancel: function (data) {
            console.log('Payment cancelled:', data);
            alert(getTranslation('payment.cancel'));
        }
    }).render('#paypal-button-container');
}

function downloadConvertedFiles() {
    if (!selectedFiles || selectedFiles.length === 0) {
        alert(getTranslation('messages.no_files'));
        return;
    }

    console.log('Starting download of', selectedFiles.length, 'files');

    // Simulate file download
    selectedFiles.forEach((file, index) => {
        setTimeout(() => {
            try {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(file);
                link.download = `converted_${index + 1}.${selectedFormat}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                console.log(`Downloaded file ${index + 1}`);
            } catch (error) {
                console.error('Error downloading file:', error);
            }
        }, index * 1000);
    });

    // Show success message
    alert(getTranslation('messages.download_starting'));

    // Reset the form after downloads
    setTimeout(() => {
        resetForm();
    }, selectedFiles.length * 1000 + 2000);
}

function resetForm() {
    console.log('Resetting form');

    selectedFiles = [];
    selectedFormat = '';
    selectedPackage = null;
    selectedPrice = 0;

    // Reset UI
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <h3 data-i18n="upload.title">اسحب ملفاتك هنا أو انقر للاختيار</h3>
            <p data-i18n="upload.subtitle">يدعم جميع صيغ الفيديو والصوت</p>
            <input type="file" id="fileInput" accept="video/*,audio/*" multiple>
        `;

        // Re-apply translations
        if (typeof applyTranslations === 'function') {
            applyTranslations(document.documentElement.lang || 'ar');
        }
    }

    formatButtons.forEach(btn => btn.classList.remove('active'));

    if (progressSection) {
        progressSection.style.display = 'none';
    }

    if (progressFill) {
        progressFill.style.width = '0%';
    }

    if (convertBtn) {
        convertBtn.textContent = getTranslation('upload.start');
        convertBtn.disabled = true;
        convertBtn.onclick = startConversion;
    }

    // Re-attach event listeners
    const newFileInput = document.getElementById('fileInput');
    if (newFileInput) {
        newFileInput.addEventListener('change', handleFileSelect);
    }

    // Don't re-attach click event to upload area - it's already attached in initializeEventListeners
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function validateFileType(file) {
    const allowedTypes = [
        'video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm',
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac'
    ];
    return allowedTypes.includes(file.type);
}

// Contact form handling (if needed)
function sendWhatsAppMessage() {
    const message = encodeURIComponent('مرحباً، أحتاج مساعدة في موقع محول الفيديو والصوت');
    window.open(`https://wa.me/+201149270139?text=${message}`, '_blank');
}

