const objectId = require('mongodb').ObjectId
var db=require('../config/connection')
var collection=require('../config/collections')
module.exports={

    addProduct:(productData,callback)=>{
        product={
            name:productData.Item_name,
            price:parseInt(productData.Item_price)
        }
        console.log(product);
        db.get().collection('product').insertOne(product).then((data)=>{
            id=data.insertedId
            Id=objectId(id).toString()
            console.log(Id);
            callback(Id) 
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(prouctId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(prouctId)}).then((response)=>{
                resolve(response)
            })
        }) 
    },
    getProductDetails:(prouctId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prouctId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(productId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)},{
                $set:{
                    Item_name:productDetails.Item_name,
                    Item_price:productDetails.Item_price
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    }
}



