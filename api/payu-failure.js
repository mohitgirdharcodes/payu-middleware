module.exports = function handler(req, res) {
  const { txnid, amount, productinfo, firstname, email, status, error_Message } = req.body || req.query;

  console.log(`❌ Payment failed: txnid=${txnid}, status=${status}, error=${error_Message}`);

  return res.redirect(
    `https://lessmrp.com/pages/payment-failed?txnid=${txnid}&reason=${encodeURIComponent(error_Message || 'Payment failed')}`
  );
};
