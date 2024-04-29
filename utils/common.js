module.exports.validateRequestBody = async (body, keys) => {
    try {
        let missingKeys = [];
        let payload = {};

        for (const keyObj of keys) {
            const key = keyObj.property;
            const value = body[key];

            if (!value && !keyObj.optional) {
                missingKeys.push(key);
            } else if (value !== undefined) {
                payload[key] = value;
            }
        }

        if (missingKeys.length > 0) {
            const missingKeyString = missingKeys.join(', ');
            throw new Error(`Please provide the following key(s): ${missingKeyString}`);
        }
        return payload;
    } catch (error) {
        console.log(`Error occurred validating request body - ${JSON.stringify(body)}, keys - ${JSON.stringify(keys)} & error - ${error}`);
        throw error;
    }
};


module.exports.throwCustomError = (errorMessage) => {
    throw new Error(errorMessage);
};


module.exports.generateRandomNumber = (length) => {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return Math.floor(min + Math.random() * (max - min + 1));
};

module.exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
};