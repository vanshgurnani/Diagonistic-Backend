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
            const missingKeyString = missingKeys.join(", ");
            throw new Error(
                `Please provide the following key(s): ${missingKeyString}`
            );
        }
        return payload;
    } catch (error) {
        console.log(
            `Error occurred validating request body - ${JSON.stringify(
                body
            )}, keys - ${JSON.stringify(keys)} & error - ${error}`
        );
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
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
};

module.exports.generateRandomOtp = (length) => {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return Math.floor(min + Math.random() * (max - min + 1));
};

module.exports.isWithinTimeWindow = (updatedAtEp, allowedTimeWindow) => {
    const currentTimeEp = Math.floor(Date.now() / 1000);
    const timeDifference = currentTimeEp - updatedAtEp;
    console.log(
        `Time Difference in secs - ${timeDifference}, ${currentTimeEp}, ${updatedAtEp}`
    );

    return timeDifference > allowedTimeWindow;
};

module.exports.sendOtpEmailTemplate = (otp, otpType) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Email</title>
</head>
<body style="background-color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="background-color: #FAD02E; color: black; padding: 10px; border-radius: 5px; max-width: 200px; margin: 15px auto;">Diagnostic</h2>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">OTP Verification Email</div>
        <div style="font-size: 16px; margin-bottom: 20px;">
            <p>Dear User,</p>
            <p>Thank you for registering with Diagnostic. To complete your registration, please use the following OTP (one-time password) to verify your account:</p>
            <h2 style="font-weight: bold;">${otp}</h2>
            <p>This OTP is valid for 5 minutes. If you did not request this verification, please disregard it. Once your account is verified, you will have access to our platform and its features.</p>
        </div>
        <div style="font-size: 14px; color: #999999; margin-top: 20px;">
            If you have any questions or need assistance, please feel free to reach out to Diagnostic <a href="mailto:contact@blackcheriemedia.com">here</a>. We are here to help!
        </div>
    </div>
</body>
</html>

`;

module.exports.passwordResetEmailTemplate = (url) => {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Link </title>
  </head>
  <body style="background-color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="background-color: #FAD02E; color: black; padding: 10px; border-radius: 5px; max-width: 200px; margin: 15px auto;">Diagnostic</h2>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">Password Reset Link</div>
          <div style="font-size: 16px; margin-bottom: 20px;">
              <p>Dear User,</p>
              <p>Thank you for registering with Diagnostic. Use the following link to reset your password:</p>
              <h2 style="font-weight: bold;">
                 <a style="display: inline-block; padding: 10px 20px; background-color: #ffd60a; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; margin-top: 20px;" href="${url}">Click Me</a>
              </h2>
              <p>This link is valid for 5 minutes. If you did not request this Verification, you are not able to reset your password.</p>
          </div>
          <div style="font-size: 14px; color: #999999; margin-top: 20px;">
            If you have any questions or need assistance, please feel free to reach out to Diagnostic <a href="mailto:contact@blackcheriemedia.com">here</a>. We are here to help!
          </div>
      </div>
  </body>
  </html>`;
};
