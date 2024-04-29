const dbUtils = require("../utils/db_operations");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.checkRole = async (req, res, next) => {
    try {
        // Getting API endpoint
        const requestedEndpoint = req.baseUrl + req.path;
        console.log(requestedEndpoint);

        // Getting userRoles
        const userRoles = req.decodedToken.roles[0];
        console.log(userRoles);

        // Finding role
        const role = await dbUtils.findOne({ roleName: userRoles }, DATABASE_COLLECTIONS.ROLES);

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Check if requested endpoint is allowed for the role
        if (!role.allowedAPIS.includes(requestedEndpoint)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // If allowed, proceed to the next middleware
        next();
    } catch (error) {
        console.error(`Error checking role: ${error}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
