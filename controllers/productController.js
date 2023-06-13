const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const Banner = require('../models/bannerModel')
const ObjectId = require('mongoose').Types.ObjectId;
const fs = require('fs');


/* admin product page render */

//-- admin products page --//
exports.products = async (req, res) => {
    
    const availableProducts = await Product.find()
    const categories = await Category.aggregate([{ $project: { name: "$name" } }])
    res.render('admin/products', {
        currPage: "Products",
        availableProducts,
        categories,
        msg: {
            success: req.session.productMsg,
            error: req.session.productError
        }
    })
    req.session.productError = false
    req.session.productMsg = false
    req.session.save()
}

/* Add product get page for admin */
exports.addProduct = async (req, res) => {

    const categories = await Category.find()

    res.render('admin/add-product', {
        currPage: "Products",
        categories,
    })
}

/* Add product post page for admin */
exports.postAddProduct = async (req, res) => {

    const { brand, productName, category, deal,
        storage, price } = req.body
    try {
        const newProduct = new Product({
            productName: productName,
            company: brand,
            category: category,
            deal: deal,
            storage: storage,
            price: parseInt(price),
            images: req.files.map(file => file.filename)
        })
        await Product.create(newProduct)
        req.session.productMsg = `new product ${productName} added`
        res.redirect('/admin/products')
    } catch (error) {
        try {
            req.files.forEach(file => {
                fs.unlink('./public/images/product/' + file.filename, (err) => {
                    if (err) throw err
                    console.log("Category image Deleted");
                })
            })
        } catch (error) {
            console.log(`image not deleted ${error}`);
        }
        req.session.productError = `error: ${error}`,
            res.redirect('/admin/products')
        console.log(`error on add product to mongodb ${error}`);
    }
}

/* Edit product get page for admin */
exports.editProduct = async (req, res) => {
    
    const product = await Product.findOne({ _id: new ObjectId(req.query.id) })
    const categories = await Category.find()
    res.render('admin/edit-product', {
        product,
        categories,
        currPage: "Products"
    })
}

/* Edit product post page for admin */
exports.postEditProduct = async (req, res) => {
    const id = new ObjectId(req.params.id)
    const { brand, productName, category, deal,
        storage, price } = req.body

    if (req.files.length > 0) {
        try {
            await Product.findOne({ _id: id }).then(product => {
                product.images.forEach(file => {
                    fs.unlink('./public/images/product/' + file, (err) => {
                        if (err) throw err
                        console.log("Category image Deleted");
                    })
                })
            })
            await Product.updateOne({ _id: id }, {
                productName: productName,
                company: brand,
                category: category,
                deal: deal,
                storage: storage,
                price: parseInt(price),
                images: req.files.map(file => file.filename)
            })
            req.session.productMsg = "Product detailes updated"
            res.redirect(`/admin/products`)
        } catch (error) {
            console.log("Error in delete old image : " + error);
        }
    } else {
        let oldImages = []
        try {
            await Product.findOne({ _id: id }).then(product => {
                product.images.forEach(file => {
                    oldImages.push(file)
                })
            })
            await Product.updateOne({ _id: id }, {
                productName: productName,
                company: brand,
                category: category,
                deal: deal,
                storage: storage,
                price: parseInt(price),
                images: oldImages.map(imageName => imageName)
            })
            req.session.productMsg = "Product detailes updated"
            res.redirect(`/admin/products`)
        } catch (error) {
            console.log("error in files empty :" + error);
        }
    }
}

/* Change product status for admin use*/
exports.changeProductStatus = async (req, res) => {
    
    const status = JSON.parse(req.query.status)
    if (status) {
        await Product.updateOne({ _id: new ObjectId(req.query.id) }, {
            $set: { deleted: false }
        })
    } else {
        await Product.updateOne({ _id: new ObjectId(req.query.id) }, {
            $set: { deleted: true }
        })
    }
    res.redirect('/admin/products')
}

/**
 * @ Shop Home page GET method
 */
exports.getHome = async (req, res) => {
    const cat = await Category.find({ status: true })
    const featured = await Category.aggregate([
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "category",
                as: "products"
            }
        }
    ]).limit(12)
    const apple = await Product.find({ company: "Apple" }).limit(3)
    const samsung = await Product.find({ company: "Samsung" }).limit(3)
    const sony = await Product.find({ company: "Sony" }).skip(1).limit(3)
    const cartCount = await getCartCount(req)
    const banner = await Banner.find({currentBanner: true})
   
    res.render('shop/index', {
        categories: cat,
        loggedIn: req.session.loggedIn,
        featured,
        samsung,
        apple,
        sony,
        cartCount,
        banner
    })
}

/* product-detail */
exports.productDetail = async (req, res) => {
    const id = req.params.id
    const cartCount = await getCartCount(req)
    const product = await Product.findOne({ _id: new ObjectId(id) })
    let relPro = []
    await Product.find({ category: product.category })
        .then((data) => {
            data.forEach((data) => {
                if (!data.deleted && relPro.length < 4 && data.productName !== product.productName) {
                    relPro.push(data)
                }
            })
        })

    
    if (product) {
        res.render('shop/product-detail', {
            loggedIn: req.session.loggedIn,
            product,
            relPro,
            cartCount
        })
    } else {
        res.redirect('/')
    }
}

/* shop */
exports.shop = async(req,res) => {
    const cartCount = await getCartCount(req)
    const categories = await Category.find()
    const products = await Product.aggregate([
        {
            $lookup: {
                from: "category",
                localField: "category",
                foreignField: "_id",
                as: "find"
            }
        },
        {
            $addFields: {
                categoryName : {$arrayElemAt: ["$find.name", 0]}
            }
        }
    ])
    
    res.render('shop/shop',{
        loggedIn: req.session.loggedIn,
        categories,
        products,
        cartCount
    })
}



//-- function for return cart count --//

function getCartCount(req){
    return new Promise(async(resolve, reject) => {
        if(req.session.user){
            await Cart.findOne({userId: new ObjectId(req.session.user._id)})
            .then(cart => {
                resolve(cart.products.length)
            })
            .catch(err => {
                resolve(false)
                console.log(err);
            })
        } else {
            resolve(0)
        }
    })
}