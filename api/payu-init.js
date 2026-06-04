const crypto = require('crypto');

module.exports = function handler(req, res) {
  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;

  if (!key || !salt) {
    res.status(500).send('Environment variables missing');
    return;
  }

  const amount = req.query.amount || '0';
  const productinfo = req.query.productinfo || 'Product';
  const firstname = req.query.firstname || 'Customer';
  const email = req.query.email || 'customer@example.com';
  const phone = req.query.phone || '9999999999';
  const variantId = req.query.variantId || '';   // Shopify variant ID
  const quantity = req.query.quantity || '1';

  // Middleware ke success/failure URLs
  const surl = 'https://payu-middleware.vercel.app/api/payu-success';
  const furl = 'https://payu-middleware.vercel.app/api/payu-failure';

  const txnid = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5);

  // udf1 = variantId, udf2 = quantity
  const udf1 = variantId;
  const udf2 = quantity;
  const udf3 = '';

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}||||||${salt}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');

  const html = `<!DOCTYPE html>
<html>
  <head><title>Redirecting to PayU...</title></head>
  <body onload="document.forms.payu.submit()">
    <p style="font-family:sans-serif;text-align:center;margin-top:100px;">
      Redirecting to payment page...
    </p>
    <form name="payu" method="post" action="https://secure.payu.in/_payment">
      <input type="hidden" name="key" value="${key}">
      <input type="hidden" name="txnid" value="${txnid}">
      <input type="hidden" name="amount" value="${amount}">
      <input type="hidden" name="productinfo" value="${productinfo}">
      <input type="hidden" name="firstname" value="${firstname}">
      <input type="hidden" name="email" value="${email}">
      <input type="hidden" name="phone" value="${phone}">
      <input type="hidden" name="surl" value="${surl}">
      <input type="hidden" name="furl" value="${furl}">
      <input type="hidden" name="udf1" value="${udf1}">
      <input type="hidden" name="udf2" value="${udf2}">
      <input type="hidden" name="udf3" value="${udf3}">
      <input type="hidden" name="hash" value="${hash}">
    </form>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
