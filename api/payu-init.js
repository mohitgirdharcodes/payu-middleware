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

  const surl = 'https://lessmrp.com/pages/thank-you';
  const furl = 'https://lessmrp.com/pages/payment-failed';

  const txnid = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5);

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');

  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Redirecting to PayU...</title>
    <style>
      body { font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0; background:#f5f5f5; }
      .box { text-align:center; background:white; padding:40px; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.1); }
      .spinner { border:4px solid #f3f3f3; border-top:4px solid #2d6a4f; border-radius:50%; width:40px; height:40px; animation:spin 1s linear infinite; margin:0 auto 20px; }
      @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
    </style>
  </head>
  <body onload="document.forms.payu.submit()">
    <div class="box">
      <div class="spinner"></div>
      <h3>Redirecting to secure payment page...</h3>
      <p style="color:#888">Please do not close this window.</p>
    </div>
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
      <input type="hidden" name="hash" value="${hash}">
    </form>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
