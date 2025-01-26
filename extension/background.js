// List of Amazon marketplaces to check
const MARKETPLACES = [
    { domain: 'amazon.com', region: 'US', currency: 'USD' },
    { domain: 'amazon.co.uk', region: 'UK', currency: 'GBP' },
    { domain: 'amazon.de', region: 'DE', currency: 'EUR' },
    { domain: 'amazon.fr', region: 'FR', currency: 'EUR' },
    { domain: 'amazon.it', region: 'IT', currency: 'EUR' },
    { domain: 'amazon.es', region: 'ES', currency: 'EUR' },
    { domain: 'amazon.nl', region: 'NL', currency: 'EUR' }
];

// Function to fetch price from a marketplace
async function fetchPrice(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        const priceElements = [
            '.a-price .a-offscreen',
            '#priceblock_ourprice',
            '#priceblock_dealprice',
            '.a-price-whole'
        ];

        for (const selector of priceElements) {
            const element = doc.querySelector(selector);
            if (element) {
                const price = element.textContent
                    .replace(/[^0-9.,]/g, '')
                    .replace(',', '.');
                return parseFloat(price);
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching price:', error);
        throw error;
    }
}

// Function to convert currency
async function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const data = await response.json();
        return amount * data.rates[toCurrency];
    } catch (error) {
        console.error('Error converting currency:', error);
        throw error;
    }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchPrice') {
        fetchPrice(request.url)
            .then(price => sendResponse({ success: true, price: price }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    }
    
    if (request.action === 'convertCurrency') {
        convertCurrency(request.amount, request.from, request.to)
            .then(result => sendResponse({ success: true, amount: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    }
});
