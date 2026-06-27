const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const generateOTP = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000);
  return { code, expiry };
};

const generateTOTPSecret = () => {
  return speakeasy.generateSecret({
    name: 'NGV-ERP',
    length: 20,
  });
};

const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret.base32 || secret,
    encoding: 'base32',
    token,
    window: 2,
  });
};

const generateQRCodeDataURL = async (secret) => {
  try {
    const url = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: 'NGV-ERP',
      issuer: 'NGV Enterprise',
    });
    return await QRCode.toDataURL(url);
  } catch (error) {
    throw new Error('QR code generation failed');
  }
};

module.exports = { generateOTP, generateTOTPSecret, verifyTOTP, generateQRCodeDataURL };
