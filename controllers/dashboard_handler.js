const axios = require("axios");
const dbUtils = require("../utils/db_operations");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

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

module.exports.dashboardGet = async (req, res) => {
    try {
        // Using the new countDocuments method
        const patientCount = await dbUtils.countDocuments(
            { roles: configs.CONSTANTS.ROLES.PATIENT },
            DATABASE_COLLECTIONS.USERS
        );

        const centerCount = await dbUtils.countDocuments(
            {},
            DATABASE_COLLECTIONS.CENTER
        );

        res.status(200).json({
            message: "Dashboard data fetched successfully",
            totalPatients: patientCount,
            totalCenters: centerCount
        });
    } catch (error) {
        console.error(`[getDashboard] Error occurred: ${error.message}`);
        res.status(500).json({
            error: error.message,
        });
    }
};