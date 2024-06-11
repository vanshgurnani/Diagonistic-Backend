const jwt = require("jsonwebtoken");
const config = require("../configs.json");

module.exports.generateToken = ({ email}) => {
    const secretKey = config.JWT_SECRET;
    const payload = { email};
    const options = { expiresIn: config.JWT_ACCESS_TOKEN_EXPIRY };
    const token = jwt.sign(payload, secretKey, options);
    return token;
};

module.exports.validateJwt = (req, res, next) => {
    const secretKey = config.JWT_SECRET;
    const authHeader = req.headers["authorization"];
    let token = undefined;
    if (authHeader) {
        const [bearer, accessToken] = authHeader?.split(" ");
        if (bearer === "Bearer" && accessToken) {
            token = accessToken;
        }
    }

    if (!token) {
        return res.status(401).json({
            error: "Please provide accessToken.",
        });
    }
    try {
        const decodedToken = jwt.verify(token, secretKey);
        req.decodedToken = decodedToken;
        console.log("decodedToken: ", decodedToken);
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid accessToken provided.",
        });
    }
};
