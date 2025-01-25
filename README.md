# Amazon Price Comparison Extension

This Chrome extension shows product prices across different Amazon marketplaces.

## Setup Instructions

1. Get Amazon Product Advertising API credentials:
   - Sign up for the Amazon Product Advertising API at https://webservices.amazon.com/paapi5/documentation/register-for-pa-api.html
   - Note down your:
     - Access Key ID
     - Secret Access Key
     - Partner Tag (Associate ID)

2. Configure the extension:
   - Create a `config.js` file with your API credentials
   - Add appropriate marketplace endpoints

3. Install the extension:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select this directory

## Features
- Automatic product detection
- Real-time price comparison across marketplaces
- Local currency conversion
- 24-hour price caching
- Direct links to product pages

## Development
- Run `npm install` to install dependencies
- Make changes to the code
- Reload the extension in Chrome to test changes
