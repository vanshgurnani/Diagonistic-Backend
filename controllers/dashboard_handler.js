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
    try{
        // Pagination parameters with defaults
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const skip = (page - 1) * limit;


        // Define the pipeline to project necessary fields, apply sorting, pagination, and filtering
        const pipeline = [
            {
                $match: {}
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $lookup: {
                    from: "bookings",
                    localField: "email",
                    foreignField: "centerEmail",
                    as: "bookings"
                }
            },
            {
                $addFields: {
                    totalBookings: { $size: "$bookings" },
                    // Calculate totalRevenue from the sum of the 'rate' field in 'bookings'
                    totalRevenue: {
                        $sum: {
                            $map: {
                                input: "$bookings",
                                as: "booking",
                                in: { $ifNull: ["$$booking.rate", 0] } // Sum the rate field
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    commission: { $multiply: ["$totalRevenue", 0.02] } // Calculate commission as 2% of total revenue
                }
            },
            {
                $project: {
                    centerName: 1,
                    contact: 1,
                    ownerContact: 1,
                    totalBookings: 1,
                    totalRevenue: 1,
                    commission: 1
                }
            }
        ];

        
        // Execute the aggregate query
        let result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.CENTER);

        const totalCount = result.length;

        const patientCount = await dbUtils.countDocuments(
            { roles: configs.CONSTANTS.ROLES.PATIENT },
            DATABASE_COLLECTIONS.USERS
        );

        const centerCount = await dbUtils.countDocuments(
            {},
            DATABASE_COLLECTIONS.CENTER
        );

        const totalCommission = result.reduce((acc, center) => acc + center.commission, 0);

        const totalPayment = result.reduce((acc, center) => acc + center.totalRevenue, 0);


        // Send Success response with permissions data
        res.status(200).json({
            type: 'Success',
            page,
            limit,
            totalCount,
            totalPatients: patientCount,
            totalCenters: centerCount,
            totalCommission: totalCommission,
            totalPayment: totalPayment,
            data: result
        });
    } catch (error) {
        console.error(`[centerData] Error occurred: ${error.message}`);
        res.status(500).json({
            error: error.message,
        });
    }
};

module.exports.getTopCenters = async (req, res) => {
    try {
        // Define the pipeline to fetch top 3 centers by total bookings
        const pipeline = [
            {
                $match: {}
            },
            {
                $lookup: {
                    from: "bookings",
                    localField: "email",
                    foreignField: "centerEmail",
                    as: "bookings"
                }
            },
            {
                $lookup: {
                    from: "tests", // Assuming the collection where prices are stored is called "tests"
                    localField: "email",
                    foreignField: "email",
                    as: "testDetails"
                }
            },
            {
                $addFields: {
                    totalBookings: { $size: "$bookings" },
                    avgPrice: { $avg: "$testDetails.rate" }
                }
            },
            {
                $sort: {
                    totalBookings: -1
                }
            },
            {
                $limit: 3
            },
            {
                $project: {
                    centerName: 1,
                    contact: 1,
                    centerImg: 1,
                    ownerContact: 1,
                    totalBookings: 1,
                    totalRevenue: 1,
                    commission: 1,
                    avgPrice: 1
                }
            }
        ];

        // Execute the aggregation query
        const topCenters = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.CENTER);

        // Send the response with the top centers data
        res.status(200).json({
            type: 'Success',
            topCenters
        });
    } catch (error) {
        console.error(`[getTopCenters] Error occurred: ${error.message}`);
        res.status(500).json({
            error: error.message,
        });
    }
};

// Separate handler for daily revenue and commission calculation
module.exports.getDailyRevenueAndCommission = async (req, res) => {
    try {
        const centerEmail = req.query.centerEmail;
        const filterType = req.query.type || 'daily'; // Default to 'daily' if not provided

        // Get the current date
        const now = new Date();

        // Define date ranges based on the filterType
        let startDate, endDate;

        switch (filterType) {
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth()).getTime();
                endDate = new Date(now.getFullYear(), now.getMonth()+1).getTime() - 1;
                break;

            case 'monthly':
                startDate = new Date(now.getFullYear(), 0, 1).getTime(); // Start of the current year
                endDate = new Date(now.getFullYear() + 1, 0, 1).getTime() - 1; // End of the current year
                break;

            case 'yearly':
                startDate = new Date(now.getFullYear() - 5, 0, 1).getTime(); // Start 5 years ago
                endDate = new Date(now.getFullYear() + 1, 0, 1).getTime() - 1; // End of the next year
                break;

            case 'custom':
                // Parse custom start and end dates from query parameters
                startDate = new Date(req.query.startDate);
                endDate = new Date(req.query.endDate);
                if (isNaN(startDate) || isNaN(endDate)) {
                    return res.status(400).json({ error: 'Invalid start or end date' });
                }
                break;

            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - 1;
                break;
        }

        // Define the aggregation pipeline to calculate total revenue based on time period
        let groupId;

        switch (filterType) {
            case 'daily':
                groupId = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }; // Group by day
                break;

            case 'monthly':
                groupId = { $dateToString: { format: "%Y-%m", date: "$createdAt" } }; // Still group by day for monthly data
                break;

            case 'yearly':
                groupId = { $dateToString: { format: "%Y", date: "$createdAt" } }; // Group by year
                break;

            case 'custom':
                groupId = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }; // Group by day for custom
                break;
                
            default:
                groupId = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }; // Group by day
                break;
        }

        // Define the aggregation pipeline
        const pipeline = [
            {
                $match: {
                    centerEmail: centerEmail,
                    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } // Filter by date range (timestamps)
                }
            },
            {
                $group: {
                    _id: groupId, // Group by day (daily/monthly) or by year
                    totalRevenue: { $sum: { $ifNull: ["$rate", 0] } }, // Sum the rate field
                    totalBooking: { $sum: 1 },
                    commission: { $sum: { $multiply: [{ $ifNull: ["$rate", 0] }, 0.02] } }
                }
            },
            {
                $sort: { _id: 1 } // Sort by time period (ascending)
            }
        ];

        // Execute the aggregate query to retrieve total revenue
        const revenueData = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.BOOKING);

        const count = await dbUtils.findMany(
            {
                centerEmail: centerEmail,
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
            },
            DATABASE_COLLECTIONS.BOOKING
        );

        const totalCount = count.length;

        // Calculate the total revenue from the aggregated data
        const totalRevenue = revenueData.reduce((sum, record) => sum + (record.totalRevenue || 0), 0);

        console.log("Start Date (Timestamp):", startDate);
        console.log("End Date (Timestamp):", endDate);

        // Send the response with total revenue
        res.status(200).json({
            type: 'Success',
            totalRevenue,
            timePeriod: filterType,
            totalBooking: totalCount,
            startDate: new Date(startDate), // Return as human-readable dates if needed
            endDate: new Date(endDate), // Return as human-readable dates if needed
            revenueData
        });
    } catch (error) {
        console.error(`[getDailyRevenueAndCommission] Error occurred: ${error.message}`);
        res.status(500).json({
            error: error.message,
        });
    }
};





