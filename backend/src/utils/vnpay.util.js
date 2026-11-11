import crypto from 'crypto';
import qs from 'qs';

export function sortObject(obj) {
  const sorted = {};
  const str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

export function computeHmacFromSorted(sortedObj, secretKey) {
  const secret = (secretKey || '').trim();
  const signData = qs.stringify(sortedObj, { encode: false });
  const hmac = crypto.createHmac('sha512', secret);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

export function getVNPayDateFormat(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}${parts.month}${parts.day}${hour}${parts.minute}${parts.second}`;
}

export function getClientIp(req) {
  let ipAddr = req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip || '127.0.0.1';

  if (typeof ipAddr === 'string') {
    ipAddr = ipAddr.split(',')[0].trim();
    if (ipAddr.includes('::ffff:')) {
      ipAddr = ipAddr.replace('::ffff:', '');
    }
  }
  if (!ipAddr || ipAddr === '::1' || typeof ipAddr !== 'string' || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipAddr)) {
    ipAddr = '127.0.0.1';
  }
  return ipAddr;
}

export default {
  sortObject,
  computeHmacFromSorted,
  getVNPayDateFormat,
  getClientIp
};
