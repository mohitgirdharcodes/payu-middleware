const crypto = require('crypto');

module.exports = async function handler(req, res) {
  const salt = process.env.PAYU_SALT;
  const shopifyStore = process.env.SHOPIFY_STORE;
  const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;

  // PayU POST data
  const {
    txnid, amount, productinfo, firstname, email, phone,
    status, hash, mihpayid, udf1, udf2, udf3
  } = req.body || req.query;

  // ✅ Step 1: Verify PayU hash (reverse hash)
  const reverseHashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${process.env.PAYU_KEY}`;
  const calculatedHash = crypto.createHash('sha512').update(reverseHashString).digest('hex');

  if (calculatedHash !== hash) {
    console.error('Hash mismatch!');
    return res.redirect('https://lessmrp.com/pages/payment-failed?reason=hash_mismatch');
  }

  // ✅ Step 2: Check payment status
  if (status !== 'success') {
    return res.redirect(`https://lessmrp.com/pages/payment-failed?txnid=${txnid}`);
  }

  // ✅ Step 3: Parse product info
  // productinfo format: "Product Title - Variant | variantId:123456"
  let variantId = udf1 || null; // We'll pass variantId in udf1
  let quantity = udf2 || 1;
  let productTitle = productinfo;

  try {
    // ✅ Step 4: Create Shopify Order via Admin API
    const orderPayload = {
      order: {
        line_items: variantId
          ? [{ variant_id: parseInt(variantId), quantity: parseInt(quantity) }]
          : [{ title: productTitle, price: amount, quantity: parseInt(quantity) }],
        customer: {
          first_name: firstname,
          last_name: '',
          email: email,
          phone: phone
        },
        billing_address: {
          first_name: firstname,
          phone: phone,
          country: 'India',
          country_code: 'IN'
        },
        financial_status: 'paid',
        transactions: [
          {
            kind: 'sale',
            status: 'success',
            amount: amount,
            gateway: 'PayU',
            authorization: mihpayid || txnid
          }
        ],
        note: `PayU Transaction ID: ${txnid} | PayU Payment ID: ${mihpayid}`,
        tags: 'payu-payment',
        send_receipt: true,
        send_fulfillment_receipt: true
      }
    };

    const shopifyResponse = await fetch(
      `https://${shopifyStore}/admin/api/2024-01/orders.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyToken
        },
        body: JSON.stringify(orderPayload)
      }
    );

    const shopifyData = await shopifyResponse.json();

    if (!shopifyResponse.ok) {
      console.error('Shopify order error:', JSON.stringify(shopifyData));
      // Payment successful but order creation failed — still show success
      return res.redirect(
        `https://lessmrp.com/pages/thank-you?txnid=${txnid}&status=paid&order_error=true`
      );
    }

    const orderId = shopifyData.order?.id;
    const orderName = shopifyData.order?.name; // e.g. #1001

    console.log(`✅ Order created: ${orderName} (${orderId}) for txnid: ${txnid}`);

    // ✅ Step 5: Redirect to Thank You page
    return res.redirect(
      `https://lessmrp.com/pages/thank-you?txnid=${txnid}&order=${orderName}&status=paid`
    );

  } catch (err) {
    console.error('Error creating Shopify order:', err);
    return res.redirect(
      `https://lessmrp.com/pages/thank-you?txnid=${txnid}&status=paid&order_error=true`
    );
  }
};
