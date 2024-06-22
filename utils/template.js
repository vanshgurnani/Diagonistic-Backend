module.exports.sendDynamicEmailTemplate = (title,username,content) => `
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
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">${title}</div>
        <div style="font-size: 16px; margin-bottom: 20px;">
            <p>Dear ${username},</p>
            <p>Thank you for registering with Diagnostic.</p>
            <p>${content}</p>
        </div>
        <div style="font-size: 14px; color: #999999; margin-top: 20px;">
            If you have any questions or need assistance, please feel free to reach out to Diagnostic <a href="mailto:contact@blackcheriemedia.com">here</a>. We are here to help!
        </div>
    </div>
</body>
</html>

`;
