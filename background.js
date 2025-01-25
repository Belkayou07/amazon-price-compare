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

// Function to fetch product data from Amazon Product Advertising API
async function fetchProductData(marketplace, asin) {
    // Note: You'll need to implement the actual API call here with your credentials
    // This is a placeholder that simulates the API response
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return mock data for demonstration
        return {
            success: true,
            price: Math.random() * 100 + 50, // Random price between 50-150
            currency: marketplace.currency,
            url: `https://${marketplace.domain}/dp/${asin}`
        };
    } catch (error) {
        console.error(`Error fetching data from ${marketplace.domain}:`, error);
        return { success: false, error: error.message };
    }
}

// Function to convert currency
async function convertCurrency(amount, fromCurrency, toCurrency) {
    // Note: Implement actual currency conversion API call here
    // This is a placeholder that returns a simulated converted amount
    return amount * 1.2; // Simplified conversion
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchPrices') {
        // Using async/await in a message listener requires this promise pattern
        (async () => {
            try {
                const prices = [];
                
                // Fetch prices from all marketplaces in parallel
                const pricePromises = MARKETPLACES.map(async marketplace => {
                    const data = await fetchProductData(marketplace, request.asin);
                    
                    if (data.success) {
                        // Get user's local currency from the current marketplace
                        const localCurrency = MARKETPLACES[0].currency;
                        
                        // Convert price if necessary
                        let convertedPrice = null;
                        if (data.currency !== localCurrency) {
                            convertedPrice = await convertCurrency(
                                data.price,
                                data.currency,
                                localCurrency
                            );
                        }
                        
                        prices.push({
                            marketplace: marketplace.domain,
                            price: data.price.toFixed(2),
                            currency: data.currency,
                            convertedPrice: convertedPrice ? convertedPrice.toFixed(2) : null,
                            localCurrency: localCurrency,
                            url: data.url
                        });
                    }
                });
                
                await Promise.all(pricePromises);
                
                // Sort prices by converted amount
                prices.sort((a, b) => {
                    const priceA = a.convertedPrice || a.price;
                    const priceB = b.convertedPrice || b.price;
                    return priceA - priceB;
                });
                
                sendResponse({ success: true, prices });
            } catch (error) {
                console.error('Error in price fetching:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        
        // Return true to indicate we'll send a response asynchronously
        return true;
    }
});
