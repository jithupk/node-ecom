var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')
var verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET users listing. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  console.log(user);
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/index', { admin: false, products, user, cartCount });

  })

});

router.get('/login', (req, res) => {
  console.log(req.session.userLoggedIn);
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('user/user-login', { "loginErr": req.session.userLoginErr })
    req.session.userLoginErr = false
  }
})

router.get('/signup', (req, res) => {
  res.render('user/user-signup')
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    req.session.user = response
    req.session.userLoggedIn = true
    res.redirect('/')
  })
})

router.post('/login', (req, res) => {
  console.log(req.body);
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.userLoggedIn = true

      res.redirect('/')
    } else {
      req.session.userLoginErr = true
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false 
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  console.log(products);
  total = 0
  if (products.length > 0) {
    let total = await userHelpers.getTotalAmout(req.session.user._id)
  }
  res.render('user/cart', { user: req.session.user, products, total })
})

router.get('/add-to-cart/:id', (req, res) => {
  console.log('api call');
  userHelpers.addToCart(req.params.id, req.session.user._id).then((response) => {
    console.log(response);
    res.json(response)
  })
})

router.post('/change-product-quantity', (req, res) => {
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmout(req.body.user)
    res.json(response)
  })
})

router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmout(req.session.user._id)
  res.render('user/checkout', { total, user: req.session.user })
})

router.post('/place-order', async (req, res) => {
  console.log(req.body);
  console.log(req.body.userid);
  let products = await userHelpers.getCartProductList(req.body.userid)
  let total = await userHelpers.getTotalAmout(req.body.userid)
  userHelpers.placeOrder(req.body, products, total).then((orderId) => {
    console.log("oid" + orderId);
    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelpers.generateRazorpay(orderId, total).then((response) => {
        res.json(response)
      })
    }

  })
})

router.get('/order-success', (req, res) => {
  res.render('user/order-success')
})

router.get('/view-orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getAllOrders(req.session.user._id)
  console.log(orders);
  res.render('user/view-orders', { user: req.session.user, orders })
})

router.get('/view-order-products/:id', async (req, res) => {
  console.log(req.params.id);
  let orderProducts = await userHelpers.getOrderProducts(req.params.id)
  console.log(orderProducts)
  res.render('user/view-order-products', { orderProducts, user: req.session.user })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("payment success");
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false })
  })
})

module.exports = router;
