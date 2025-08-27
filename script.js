// Global variables
let selectedFiles = [];
let selectedFormat = '';
let selectedPackage = null;
let selectedPrice = 0;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const formatButtons = document.querySelectorAll('.format-btn');
const convertBtn = document.getElementById('convertBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const buyButtons = document.querySelectorAll('.buy-btn');
const paymentModal = document.getElementById('paymentModal');
const closeModal = document.querySelector('.close');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
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
        btn.addEventListener('click', () => {
            selectedPackage = btn.dataset.package;
            selectedPrice = parseFloat(btn.dataset.price);
            showPaymentModal();
        });
    });

    // Modal events
    closeModal.addEventListener('click', hidePaymentModal);
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
        alert('يرجى اختيار ملفات فيديو أو صوت صالحة');
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
        <h3>تم اختيار ${fileCount} ملف</h3>
        <p>الحجم الإجمالي: ${sizeInMB} ميجابايت</p>
        <input type="file" id="fileInput" accept="video/*,audio/*" multiple>
    `;

    // Re-attach event listener to new file input
    const newFileInput = document.getElementById('fileInput');
    newFileInput.addEventListener('change', handleFileSelect);
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
        alert('يرجى اختيار الملفات وصيغة التحويل');
        return;
    }

    // Show progress section
    progressSection.style.display = 'block';
    convertBtn.disabled = true;
    convertBtn.textContent = 'جاري التحويل...';

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
        progressText.textContent = `جاري التحويل... ${Math.round(progress)}%`;
    }, 500);
}

function completeConversion() {
    progressText.textContent = 'تم التحويل بنجاح! يرجى الدفع لتحميل الملفات';
    convertBtn.textContent = 'ادفع لتحميل الملفات';
    convertBtn.disabled = false;
    
    // Change convert button to payment button
    convertBtn.onclick = () => {
        selectedPackage = 'conversion';
        selectedPrice = calculateConversionPriceLocal();
        showPaymentModal();
    };
}

function calculateConversionPriceLocal() {
    // Use the enhanced pricing calculator from paypal-config.js
    return calculateConversionPrice(selectedFiles);
}

function showPaymentModal() {
    paymentModal.style.display = 'block';
    
    // Clear previous PayPal buttons
    const container = document.getElementById('paypal-button-container');
    container.innerHTML = '';
    
    // Render new PayPal button
    renderPayPalButton();
}

function hidePaymentModal() {
    paymentModal.style.display = 'none';
}

function initializePayPal() {
    // PayPal will be initialized when modal is shown
}

function renderPayPalButton() {
    if (typeof paypal === 'undefined') {
        console.error('PayPal SDK not loaded');
        document.getElementById('paypal-button-container').innerHTML = 
            '<p style="color: red;">خطأ في تحميل PayPal. يرجى المحاولة لاحقاً.</p>';
        return;
    }

    paypal.Buttons({
        style: PAYPAL_BUTTON_STYLE,
        
        createOrder: function(data, actions) {
            try {
                const orderData = createPayPalOrder(selectedPackage, selectedPrice);
                return actions.order.create(orderData);
            } catch (error) {
                console.error('Error creating PayPal order:', error);
                alert('حدث خطأ في إنشاء الطلب. يرجى المحاولة مرة أخرى.');
                return null;
            }
        },
        
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                handlePayPalSuccess(details, selectedPackage);
                hidePaymentModal();
            });
        },
        
        onError: function(err) {
            console.error('PayPal Error:', err);
            alert('حدث خطأ في عملية الدفع. يرجى المحاولة مرة أخرى.');
        },
        
        onCancel: function(data) {
            console.log('Payment cancelled:', data);
            alert('تم إلغاء عملية الدفع.');
        }
    }).render('#paypal-button-container');
}

function downloadConvertedFiles() {
    // Simulate file download
    selectedFiles.forEach((file, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(file);
            link.download = `converted_${index + 1}.${selectedFormat}`;
            link.click();
        }, index * 1000);
    });
    
    // Reset the form
    resetForm();
}

function resetForm() {
    selectedFiles = [];
    selectedFormat = '';
    selectedPackage = null;
    selectedPrice = 0;
    
    // Reset UI
    uploadArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <h3>اسحب ملفاتك هنا أو انقر للاختيار</h3>
        <p>يدعم جميع صيغ الفيديو والصوت</p>
        <input type="file" id="fileInput" accept="video/*,audio/*" multiple>
    `;
    
    formatButtons.forEach(btn => btn.classList.remove('active'));
    progressSection.style.display = 'none';
    progressFill.style.width = '0%';
    convertBtn.textContent = 'ابدأ التحويل';
    convertBtn.disabled = true;
    convertBtn.onclick = startConversion;
    
    // Re-attach event listeners
    const newFileInput = document.getElementById('fileInput');
    newFileInput.addEventListener('change', handleFileSelect);
    document.getElementById('uploadArea').addEventListener('click', () => newFileInput.click());
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

