const crypto = require('crypto');

module.exports = function handler(req, res) {
  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;

  if (!key || !salt) {
    res.status(500).send('Environment variables missing');
    return;
  }

  const amount      = req.query.amount      || '0';
  const productinfo = req.query.productinfo || 'Product';
  const firstname   = req.query.firstname   || 'Customer';
  const email       = req.query.email       || 'customer@example.com';
  const phone       = req.query.phone       || '9999999999';
  const variantId   = req.query.variantId   || '';
  const quantity    = req.query.quantity    || '1';

  const surl = 'https://payu-middleware.vercel.app/api/payu-success';
  const furl = 'https://payu-middleware.vercel.app/api/payu-failure';

  const txnid = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5);

  // Store variantId & quantity in udf fields
  const udf1 = variantId;
  const udf2 = quantity;
  const udf3 = '';
  const udf4 = '';
  const udf5 = '';

  // ✅ CORRECT PayU hash formula:
  // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');

  console.log('Hash string:', hashString);
  console.log('Hash:', hash);

  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Redirecting to PayU...</title>
    <style>
      body { font-family: sans-serif; display: flex; align-items: center; 
             justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
      .msg { text-align: center; color: #555; }
      .spinner { width: 40px; height: 40px; border: 4px solid #ddd; 
                 border-top-color: #f97316; border-radius: 50%; 
                 animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body onload="document.forms['payu'].submit()">
    <div class="msg">
      <div class="spinner"></div>
      <p>Redirecting to secure payment page...</p>
    </div>
    <form name="payu" method="post" action="https://secure.payu.in/_payment" style="display:none">
      <input type="hidden" name="key"         value="${key}">
      <input type="hidden" name="txnid"       value="${txnid}">
      <input type="hidden" name="amount"      value="${amount}">
      <input type="hidden" name="productinfo" value="${productinfo}">
      <input type="hidden" name="firstname"   value="${firstname}">
      <input type="hidden" name="email"       value="${email}">
      <input type="hidden" name="phone"       value="${phone}">
      <input type="hidden" name="surl"        value="${surl}">
      <input type="hidden" name="furl"        value="${furl}">
      <input type="hidden" name="udf1"        value="${udf1}">
      <input type="hidden" name="udf2"        value="${udf2}">
      <input type="hidden" name="udf3"        value="${udf3}">
      <input type="hidden" name="udf4"        value="${udf4}">
      <input type="hidden" name="udf5"        value="${udf5}">
      <input type="hidden" name="hash"        value="${hash}">
    </form>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
