var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')

var verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('admin/login')
  }
}


/* GET home page. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    console.log(products);
  res.render('admin/view-products', {products,admin:true});

  })
});

// router.get('/login', (req, res) => {
//   console.log(req.session.adminLoggedIn);
//   if (req.session.adminLoggedIn) {
//     res.redirect('/')
//   } else {
//     res.render('user/user-login', { "loginErr": req.session.adminLoginErr })
//     req.session.adminLoginErr = false
//   }
// })

// router.post('/login', (req, res) => {
//   console.log(req.body);
//   userHelpers.doLogin(req.body).then((response) => {
//     if (response.status) {
//       req.session.admin = response.admin
//       req.session.adminLoggedIn = true

//       res.redirect('/')
//     } else {
//       req.session.adminLoginErr = true
//       res.redirect('/login')
//     }
//   })
// })




router.get('/add-product',function(req,res){
  res.render('admin/add-product',)
}) 

router.post('/add-product',function(req,res){
  productHelpers.addProduct(req.body,(Id)=>{
    let image=req.files.Image
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render("admin/add-product") 
      }else{
        console.log("error");
      }  
    })  
  
  })  
})

router.get('/delete-product/:id',(req,res)=>{
  let productId=req.params.id
  productHelpers.deleteProduct(productId).then((response)=>{
    console.log(response);
    res.redirect('/admin')
  })
})

router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{product})
}) 

router.post('/edit-product/:id',(req,res)=>{  
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let id=req.params.id
      let=image=req.files.Image
      image.mv('./public/product-images/'+id+'.jpg')
    
    }
  }) 
})
module.exports = router; 
  