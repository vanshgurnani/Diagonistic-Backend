module.exports.sendDynamicEmailTemplate = ({ title, heading, bodyContent, footerContent }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="background-color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="background-color: #FAD02E; color: black; padding: 10px; border-radius: 5px; max-width: 200px; margin: 15px auto;">Bright Future</h2>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">${heading}</div>
        <div style="font-size: 16px; margin-bottom: 20px;">
            ${bodyContent}
        </div>
        <div style="font-size: 14px; color: #999999; margin-top: 20px;">
            ${footerContent}
        </div>
    </div>
</body>
</html>`;
