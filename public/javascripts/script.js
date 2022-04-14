
    var changeQuantity=(cartId, prodId,userId,count)=>{
        let quantity=parseInt(document.getElementById(prodId).innerHTML)
        count=parseInt(count)

        $.ajax({
            url: '/change-product-quantity',
            data: {
                user:userId,
                cart: cartId,
                product: prodId,
                count: count,
                quantity:quantity
            },
            method:'post',
            success: (response)=>{  
                if (response.removeProduct) {
                    alert("product remove from cart")
                    location.reload() 
                }else{
                    console.log(response.total); 
                    document.getElementById(prodId).innerHTML=quantity+count 
                    document.getElementById('total').innerHTML=response.total

                } 
                
            }
            
        })
    }

 