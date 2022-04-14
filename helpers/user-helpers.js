var db = require('../config/connection')
var collection = require('../config/collections')
const bycrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const Razorpay = require('razorpay')

var instance = new Razorpay({
    key_id: 'rzp_test_d7MnoNZROAWlKH',
    key_secret: 'uQRd9vs15ypIGsHMCXOPfgGr',
});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bycrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                console.log(data);
                resolve(userData)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            console.log(userData);
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bycrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("logged in");
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("login error");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('no user found');
                resolve({ status: false })
            }

        })
    },
    addToCart: (prodId, userId) => {
        let poductObject = {
            item: ObjectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let productExist = userCart.products.findIndex(product => product.item == prodId)
                console.log(productExist);
                if (productExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ 'products.item': ObjectId(prodId) }, {
                        $inc: { 'products.$.quantity': 1 }
                    }).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) }, {

                        $push: { products: poductObject }

                    }).then((response) => {
                        resolve(response)
                    })

                }

            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [poductObject]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        console.log(count);
        return new Promise((resolve, reject) => {
            if (count === -1 && details.quantity === 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) }, {
                    $inc: { 'products.$.quantity': count }
                }).then((response) => {
                    console.log(response);
                    resolve({ status: true })
                })
            }

        })
    },
    getTotalAmout: (userId,) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }, {
                    $group: {
                        _id: null,
                        total: {
                            $sum: { $multiply: ['$quantity', '$product.price'] }
                        }
                    }
                }

            ]).toArray()
            resolve(total[0].total)
        })

    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['payament-method'] === 'COD' ? 'placed' : 'pending'
            let orderObject = {
                deliveryDeatils: {
                    mobile: order.mobile,
                    address: order.address,
                    picode: order.pincode
                },
                userId: ObjectId(order.userid),
                payamentMethod: order['payment-method'],
                products: products,
                total: total,
                status: status,
                date: new Date()

            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObject).then((response) => {
                db.get().collection(collection.CART_COLLECTION).remove({ user: ObjectId(order.userid) })
                console.log(response);
                resolve(response.insertedId)
            })
        })

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            console.log(cart);
            resolve(cart.products)
        })
    },
    getAllOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray()
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(orderProducts)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total*100,
                currency: 'INR',
                receipt: "" + orderId
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {

                    console.log(order);
                    resolve(order)
                }

            })
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'uQRd9vs15ypIGsHMCXOPfgGr')

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    }
}
