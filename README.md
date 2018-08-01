# puppeteer-dynamic-bot-graphics-sample

This repo is the sample code for the technique described in this blog post: <todo>. The general idea is that we can create dynamically generate static visualizations for chat bots and other applications by utilizing our existing HTML/JS/CSS skillsets within the context of Headless Chrome.

To run the sample:

1. [Create an account](https://developer.worldweatheronline.com/api/) with World Weather Online to get trial access to their historical weather API.
1. Create a `.env` file based on the template in `.env.defaults`. The file should include the World Weather Online API Key and an optional port.
1. Run `npm install`
1. Run `npm start`

To generate an image for a city, point your browser to `http://localhost:PORT/api/CITYNAME`. This will fetch the data from the API and use Headless Chrome to generate a graphic using C3.js.