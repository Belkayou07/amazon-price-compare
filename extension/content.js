// Marketplace configurations
const MARKETPLACES = [
    { domain: 'amazon.com', region: 'US', currency: 'USD' },
    { domain: 'amazon.co.uk', region: 'UK', currency: 'GBP' },
    { domain: 'amazon.de', region: 'DE', currency: 'EUR' },
    { domain: 'amazon.fr', region: 'FR', currency: 'EUR' },
    { domain: 'amazon.it', region: 'IT', currency: 'EUR' },
    { domain: 'amazon.es', region: 'ES', currency: 'EUR' },
    { domain: 'amazon.nl', region: 'NL', currency: 'EUR' }
];

// Function to extract ASIN from URL
function getASIN() {
    const url = window.location.href;
    const match = url.match(/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/);
    return match ? match[1] : null;
}

// Function to get current marketplace
function getCurrentMarketplace() {
    const hostname = window.location.hostname;
    return MARKETPLACES.find(m => hostname.includes(m.domain));
}

// Function to create comparison container
function createComparisonContainer() {
    const priceElement = document.querySelector('.a-price');
    if (!priceElement) return null;

    const container = document.createElement('div');
    container.id = 'az-price-comparison';
    container.className = 'price-comparison-container';
    
    const title = document.createElement('h3');
    title.textContent = 'Price Comparison';
    container.appendChild(title);

    const list = document.createElement('ul');
    list.id = 'marketplace-prices';
    container.appendChild(list);

    // Add loading message
    const loading = document.createElement('div');
    loading.className = 'loading-prices';
    loading.textContent = 'Fetching prices...';
    container.appendChild(loading);

    priceElement.parentElement.insertAdjacentElement('afterend', container);
    return container;
}

// Function to display prices
function displayPrices(prices) {
    const list = document.getElementById('marketplace-prices');
    const loading = document.querySelector('.loading-prices');
    if (!list) return;

    // Remove loading message
    if (loading) {
        loading.remove();
    }

    list.innerHTML = '';
    prices.forEach(price => {
        if (price.price) {
            const li = document.createElement('li');
            li.className = 'marketplace-price-item';
            
            const link = document.createElement('a');
            link.href = price.url;
            link.target = '_blank';
            link.textContent = `${price.marketplace}: ${price.price} ${price.currency}`;
            
            if (price.convertedPrice) {
                link.textContent += ` (${price.convertedPrice} ${price.localCurrency})`;
            }
            
            li.appendChild(link);
            list.appendChild(li);
        }
    });
}

// Function to fetch price from a marketplace
async function fetchMarketplacePrice(marketplace, asin) {
    try {
        const url = `https://${marketplace.domain}/dp/${asin}`;
        const response = await chrome.runtime.sendMessage({
            action: 'fetchPrice',
            url: url
        });
        
        if (response.success) {
            return {
                marketplace: marketplace.domain,
                price: response.price,
                currency: marketplace.currency,
                url: url
            };
        } else {
            console.error(`Error fetching price from ${marketplace.domain}:`, response.error);
            return {
                marketplace: marketplace.domain,
                price: null,
                currency: marketplace.currency,
                url: url
            };
        }
    } catch (error) {
        console.error(`Error fetching price from ${marketplace.domain}:`, error);
        return {
            marketplace: marketplace.domain,
            price: null,
            currency: marketplace.currency,
            url: url
        };
    }
}

// Function to convert currency using background script
async function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'convertCurrency',
            amount: amount,
            from: fromCurrency,
            to: toCurrency
        });
        
        if (response.success) {
            return response.amount;
        } else {
            console.error('Error converting currency:', response.error);
            return null;
        }
    } catch (error) {
        console.error('Error converting currency:', error);
        return null;
    }
}

// Main function to initialize price comparison
async function initPriceComparison() {
    const asin = getASIN();
    if (!asin) return;

    // Create UI container
    createComparisonContainer();

    // Get current marketplace
    const currentMarketplace = getCurrentMarketplace();
    if (!currentMarketplace) return;

    // Check cache first
    const cacheKey = `price_${asin}`;
    const cachedData = await chrome.storage.local.get([cacheKey]);
    if (cachedData[cacheKey]) {
        const data = cachedData[cacheKey];
        const cacheAge = Date.now() - data.timestamp;
        
        // Display cached data if less than 1 hour old
        if (cacheAge < 60 * 60 * 1000) {
            displayPrices(data.prices);
            return;
        }
    }

    // Fetch fresh prices
    try {
        const pricePromises = MARKETPLACES.map(marketplace => 
            fetchMarketplacePrice(marketplace, asin)
        );
        
        let prices = await Promise.all(pricePromises);
        
        // Convert prices to local currency
        const conversionPromises = prices.map(async price => {
            if (price.price && price.currency !== currentMarketplace.currency) {
                const convertedPrice = await convertCurrency(
                    price.price,
                    price.currency,
                    currentMarketplace.currency
                );
                if (convertedPrice) {
                    price.convertedPrice = convertedPrice.toFixed(2);
                    price.localCurrency = currentMarketplace.currency;
                }
            }
            return price;
        });
        
        prices = await Promise.all(conversionPromises);
        
        // Sort prices by converted amount
        prices.sort((a, b) => {
            const priceA = a.convertedPrice || a.price || Infinity;
            const priceB = b.convertedPrice || b.price || Infinity;
            return priceA - priceB;
        });
        
        displayPrices(prices);
        
        // Cache the results
        chrome.storage.local.set({
            [cacheKey]: {
                prices: prices,
                timestamp: Date.now()
            }
        });
    } catch (error) {
        console.error('Error in price comparison:', error);
        const container = document.getElementById('az-price-comparison');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'price-error';
            errorDiv.textContent = 'Error fetching prices. Please try again later.';
            container.appendChild(errorDiv);
        }
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPriceComparison);
} else {
    initPriceComparison();
}

// Also check for dynamic page updates
const observer = new MutationObserver(() => {
    if (document.querySelector('.a-price') && !document.getElementById('az-price-comparison')) {
        initPriceComparison();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
