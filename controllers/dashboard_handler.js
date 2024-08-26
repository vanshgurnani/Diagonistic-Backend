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
                    totalBookings: { $size: "$bookings" }
                }
            },
            {
                $lookup: {
                    from: "payments",
                    let: { bookings: "$bookings" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$razorpay_payment_id", { $map: { input: "$$bookings", as: "booking", in: "$$booking.paymentId" } }]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: "$amount" }
                            }
                        }
                    ],
                    as: "revenue"
                }
            },
            {
                $addFields: {
                    totalRevenue: { $ifNull: [{ $arrayElemAt: ["$revenue.totalRevenue", 0] }, 0] },
                    commission: { $multiply: [{ $ifNull: [{ $arrayElemAt: ["$revenue.totalRevenue", 0] }, 0] }, 0.02] }
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
        // Extract centerName from query parameters
        const centerName = req.query.centerName || '';

        // Define the pipeline to aggregate revenue and commission by day
        const pipeline = [
            // Filter by centerName if provided
            {
                $match: centerName ? { centerName: centerName } : {}
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
                    totalBookings: { $size: "$bookings" }
                }
            },
            {
                $lookup: {
                    from: "payments",
                    let: { bookings: "$bookings" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$razorpay_payment_id", { $map: { input: "$$bookings", as: "booking", in: "$$booking.paymentId" } }]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by day
                                totalRevenue: { $sum: "$amount" }
                            }
                        }
                    ],
                    as: "dailyRevenue"
                }
            },
            {
                $unwind: "$dailyRevenue"
            },
            {
                $addFields: {
                    dailyRevenue: {
                        totalRevenue: "$dailyRevenue.totalRevenue",
                        commission: { $multiply: ["$dailyRevenue.totalRevenue", 0.02] }
                    }
                }
            },
            {
                $project: {
                    date: "$dailyRevenue._id",
                    totalRevenue: "$dailyRevenue.totalRevenue",
                    commission: "$dailyRevenue.commission",
                    centerName: 1,
                    contact: 1,
                    ownerContact: 1
                }
            },
            {
                $sort: {
                    "date": -1
                }
            }
        ];

        // Execute the aggregate query
        const dailyResults = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.CENTER);

        // Send Success response with daily revenue and commission data
        res.status(200).json({
            type: 'Success',
            data: dailyResults
        });
    } catch (error) {
        console.error(`[getDailyRevenueAndCommission] Error occurred: ${error.message}`);
        res.status(500).json({
            error: error.message,
        });
    }
};
