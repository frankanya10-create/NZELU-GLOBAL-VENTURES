const crypto = require('crypto');

const generateFingerprint = (req) => {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['sec-ch-ua'] || '',
    req.headers['sec-ch-ua-platform'] || '',
    req.headers['sec-ch-ua-mobile'] || '',
    req.ip || req.connection?.remoteAddress || '',
  ];

  const raw = components.join('|||');
  return crypto.createHash('sha256').update(raw).digest('hex');
};

const parseDeviceInfo = (req) => {
  const ua = req.headers['user-agent'] || '';
  const browser = ua.includes('Chrome') ? 'Chrome'
    : ua.includes('Firefox') ? 'Firefox'
    : ua.includes('Safari') ? 'Safari'
    : ua.includes('Edge') ? 'Edge'
    : 'Unknown';

  const os = ua.includes('Windows') ? 'Windows'
    : ua.includes('Mac') ? 'MacOS'
    : ua.includes('Linux') ? 'Linux'
    : ua.includes('Android') ? 'Android'
    : ua.includes('iOS') ? 'iOS'
    : 'Unknown';

  const device = ua.includes('Mobile') ? 'Mobile'
    : ua.includes('Tablet') ? 'Tablet'
    : 'Desktop';

  return { browser, os, device };
};

module.exports = { generateFingerprint, parseDeviceInfo };
