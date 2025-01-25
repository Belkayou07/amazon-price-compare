// Function to extract ASIN from URL
function getASIN() {
    const url = window.location.href;
    const match = url.match(/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/);
    return match ? match[1] : null;
}

// Function to create price comparison container
function createComparisonContainer() {
    const priceElement = document.querySelector('.a-price');
    if (!priceElement) return null;

    const container = document.createElement('div');
    container.id = 'amazon-price-comparison';
    container.className = 'price-comparison-container';
    
    const title = document.createElement('h3');
    title.textContent = 'Price Comparison';
    container.appendChild(title);

    const list = document.createElement('ul');
    list.id = 'marketplace-prices';
    container.appendChild(list);

    priceElement.parentElement.insertAdjacentElement('afterend', container);
    return container;
}

// Function to display prices
function displayPrices(prices) {
    const list = document.getElementById('marketplace-prices');
    if (!list) return;

    list.innerHTML = '';
    prices.forEach(price => {
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
    });
}

// Main function to initialize price comparison
async function initPriceComparison() {
    const asin = getASIN();
    if (!asin) return;

    // Create UI container
    createComparisonContainer();

    // Check cache first
    const cacheKey = `price_${asin}`;
    chrome.storage.local.get([cacheKey], async (result) => {
        if (result[cacheKey]) {
            const cachedData = result[cacheKey];
            const cacheAge = Date.now() - cachedData.timestamp;
            
            // Display cached data if less than 24 hours old
            if (cacheAge < 24 * 60 * 60 * 1000) {
                displayPrices(cachedData.prices);
            }
        }
    });

    // Fetch fresh data
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'fetchPrices',
            asin: asin
        });
        
        if (response.success) {
            displayPrices(response.prices);
            
            // Cache the results
            chrome.storage.local.set({
                [cacheKey]: {
                    prices: response.prices,
                    timestamp: Date.now()
                }
            });
        }
    } catch (error) {
        console.error('Error fetching prices:', error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initPriceComparison);

// Also check for dynamic page updates (some Amazon pages load content dynamically)
const observer = new MutationObserver(() => {
    if (document.querySelector('.a-price') && !document.getElementById('amazon-price-comparison')) {
        initPriceComparison();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
