// PayPal Configuration
const PAYPAL_CONFIG = {
    // For production, replace with your actual PayPal client ID
    CLIENT_ID: 'AYPhrqios8rmVlB4AKCKJHZvuC9Y7RGeMzOB-Iw0cTmLqD0VNAVHZ7QQ1QvOrhbzTJ1HCQ8WcGtXIuDg', // Sandbox client ID for testing
    CURRENCY: 'USD',
    ENVIRONMENT: 'sandbox', // Change to 'production' for live site

    // PayPal account for receiving payments
    BUSINESS_EMAIL: 'abdomohamed0139@gmail.com'
};

// PayPal button styles
const PAYPAL_BUTTON_STYLE = {
    layout: 'vertical',
    color: 'blue',
    shape: 'rect',
    label: 'paypal',
    height: 40
};

// Payment packages configuration
const PAYMENT_PACKAGES = {
    basic: {
        name: 'الباقة الأساسية',
        price: 2.99,
        description: 'تحويل حتى 5 ملفات - حجم الملف حتى 50 ميجا',
        features: [
            'تحويل حتى 5 ملفات',
            'حجم الملف حتى 50 ميجا',
            'دعم فني أساسي'
        ]
    },
    premium: {
        name: 'الباقة المتقدمة',
        price: 4.99,
        description: 'تحويل حتى 20 ملف - حجم الملف حتى 200 ميجا',
        features: [
            'تحويل حتى 20 ملف',
            'حجم الملف حتى 200 ميجا',
            'دعم فني متقدم',
            'أولوية في التحويل'
        ]
    },
    professional: {
        name: 'الباقة الاحترافية',
        price: 7.99,
        description: 'تحويل حتى 100 ملف - حجم الملف حتى 1 جيجا',
        features: [
            'تحويل حتى 100 ملف',
            'حجم الملف حتى 1 جيجا',
            'دعم فني 24/7',
            'ميزات متقدمة'
        ]
    }
};

// Conversion pricing calculator
function calculateConversionPrice(files) {
    const fileCount = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const sizeInMB = totalSize / (1024 * 1024);

    let price = 0.99; // Base price $0.99

    // Price per file (25 cents per file)
    price += fileCount * 0.25;

    // Price per 50MB (50 cents per 50MB)
    price += Math.ceil(sizeInMB / 50) * 0.5;

    // Minimum price is $0.99, maximum is $9.99
    return Math.min(Math.max(price, 0.99), 9.99);
}

// PayPal order creation
function createPayPalOrder(packageType, customPrice = null) {
    let orderData;

    if (packageType === 'conversion' && customPrice) {
        orderData = {
            purchase_units: [{
                amount: {
                    value: customPrice.toFixed(2),
                    currency_code: PAYPAL_CONFIG.CURRENCY
                },
                description: 'محول الفيديو والصوت - تحويل ملفات مخصص'
            }]
        };
    } else if (PAYMENT_PACKAGES[packageType]) {
        const package = PAYMENT_PACKAGES[packageType];
        orderData = {
            purchase_units: [{
                amount: {
                    value: package.price.toFixed(2),
                    currency_code: PAYPAL_CONFIG.CURRENCY
                },
                description: `محول الفيديو والصوت - ${package.name}`
            }]
        };
    } else {
        throw new Error('Invalid package type');
    }

    return orderData;
}

// PayPal success handler
function handlePayPalSuccess(details, packageType) {
    console.log('Payment successful:', details);

    // Show success message
    showSuccessMessage(details.payer.name.given_name);

    // Handle different package types
    if (packageType === 'conversion') {
        // Start file download process
        setTimeout(() => {
            downloadConvertedFiles();
        }, 2000);
    } else {
        // Handle package purchase
        handlePackagePurchase(packageType, details);
    }
}

// Success message display
function showSuccessMessage(payerName) {
    const successHTML = `
        <div class="success-message" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            z-index: 10000;
        ">
            <i class="fas fa-check-circle" style="font-size: 3rem; color: #28a745; margin-bottom: 1rem;"></i>
            <h2 style="color: #333; margin-bottom: 1rem;">${getTranslation('payment.success')}</h2>
            <p style="color: #666;">${getTranslation('payment.success_message')} ${payerName || ''}</p>
            <p style="color: #666;">${getTranslation('payment.download_soon')}</p>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', successHTML);

    // Remove success message after 5 seconds
    setTimeout(() => {
        const successMsg = document.querySelector('.success-message');
        if (successMsg) {
            successMsg.remove();
        }
    }, 5000);
}

// Package purchase handler
function handlePackagePurchase(packageType, paymentDetails) {
    // Store purchase information (in real app, send to server)
    const purchaseData = {
        packageType: packageType,
        transactionId: paymentDetails.id,
        amount: paymentDetails.purchase_units[0].amount.value,
        timestamp: new Date().toISOString(),
        status: 'completed'
    };

    // Store in localStorage for demo purposes
    localStorage.setItem('userPackage', JSON.stringify(purchaseData));

    // Update UI to show purchased package
    updateUIForPurchasedPackage(packageType);
}

// Update UI for purchased package
function updateUIForPurchasedPackage(packageType) {
    const packageCard = document.querySelector(`[data-package="${packageType}"]`).closest('.pricing-card');
    const buyButton = packageCard.querySelector('.buy-btn');

    buyButton.textContent = 'تم الشراء ✓';
    buyButton.style.background = '#28a745';
    buyButton.disabled = true;

    packageCard.style.border = '3px solid #28a745';
}

// Check for existing purchases on page load
function checkExistingPurchases() {
    const userPackage = localStorage.getItem('userPackage');
    if (userPackage) {
        const purchaseData = JSON.parse(userPackage);
        updateUIForPurchasedPackage(purchaseData.packageType);
    }
}

// Initialize PayPal configuration
function initializePayPalConfig() {
    // Check for existing purchases
    checkExistingPurchases();

    // Add any additional initialization here
    console.log('PayPal configuration initialized');
}

