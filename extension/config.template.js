const config = {
    // Amazon Product Advertising API credentials
    amazon: {
        associateId: 'azpricecompar-21',  // Your Associate ID
        accessKeyId: 'YOUR_ACCESS_KEY_ID', // You'll get this from PA-API
        secretAccessKey: 'YOUR_SECRET_KEY', // You'll get this from PA-API
        region: 'US'  // Default region
    },
    
    // Currency conversion API (using exchangerate-api.com as an example)
    currency: {
        apiKey: 'YOUR_CURRENCY_API_KEY',
        endpoint: 'https://v6.exchangerate-api.com/v6/'
    }
};

// Don't modify below this line
if (typeof module !== 'undefined') {
    module.exports = config;
}
