const axios = require("axios");

module.exports.suggestLocation = async (req, res) => {
    try {
        const API_KEY = process.env.GOOGLE_MAP_API_KEY;
        const query = req.body.search;

        const apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${API_KEY}`;

        const response = await axios.get(apiUrl);

        const places = response.data.results;

        console.error(`[suggestLocation] places: ${JSON.stringify(places)}`);

        res.status(200).json({
            places: places,
            count: places.length,
        });
    } catch (error) {
        console.error(`[suggestLocation] Error occurred: ${error.message}`);
        res.status(500).json({
            error: error.message,
        });
    }
};
