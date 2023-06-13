const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const ObjectId = require('mongoose').Types.ObjectId;
const fs = require('fs')

//-- admin categories page --//
exports.categories = async (req, res) => {
    const limitedCategories = await Category.find()
    res.render('admin/category', {
        currPage: "Categories",
        limitedCategories,
        msg: req.session.categoryMsg
    })
    req.session.categoryMsg = false
    req.session.save()
}

exports.addCategory = (req, res) => {

    res.render('admin/add-category', {
        currPage: "Categories",
        msg: req.session.categoryMsg
    })
    req.session.categoryMsg = false
    req.session.save()
}

exports.postAddCategory = async (req, res) => {
    let image = req.file;
    let checkIfExist = false
    const exist = await Category.find()
    if (exist) {
        for (let i = 0; i < exist.length; i++) {
            if (exist[i]["name"].toLowerCase() === req.body.category.toLowerCase()) {
                checkIfExist = true
                break
            }
        }
    }
    try {
        if (!checkIfExist) {
            const newCategory = new Category({
                name: req.body.category,
                descriptions: req.body.descriptions,
                imagename: image.filename
            })

            await Category.create(newCategory)
            req.session.categoryMsg = "new category added successfully"
            res.redirect('/admin/category')
        } else {
            fs.unlink('./public/images/category/' + image.filename, (err) => {
                if (err) throw err
                console.log("Category image Deleted");
            })
            req.session.categoryMsg = "category dulicate not allowed"
            res.redirect('/admin/category/add-category')
        }
    } catch (err) {
        console.error(err)
        res.redirect('/admin/category')
    }
}


/* Delete category if there is no products */
exports.deleteCategory = async(req,res) => {
    const id = req.body.id

    await Product.find({category: new ObjectId(id)}).then(async(data) => {
        if(data.length < 1){
            await Category.findByIdAndDelete(id).then((data) => {
                if(!data){
                    res.status(404).send({message: "Cannot find the category id"})
                }else{
                    fs.unlink('./public/images/category/' + data.imagename, (err) => {
                        if (err) throw err
                        console.log("Category image Deleted");
                    })
                    res.json({message: "Category Deleted"})
                }
            }).catch(err => {
                console.log(err);
                res.status(500).json({message: "Error Occured on delete Category"})
            })
        }else{
            res.json({message: "Category is in use Only delete category there is no products"})
        }
    }).catch(err => {
        console.log(err);
    })
}

/* GET page for edit category */
exports.editCategory = async(req,res) => {
    const category = await Category.findOne({_id: new ObjectId(req.params.id)}) 
    if(category){
        res.render('admin/edit-category',{
            category,
            currPage: "Categories"
        })
    }
}

/* PUT request for update category */
exports.putCategory = async(req,res) => {
    const id = req.params.id
    let oldImage;
    let isUse = false
    await Category.find().then((categories) => {
        for(let i=0; i< categories.length; i++){
            if (categories[i]["name"].toLowerCase() === req.body.category.toLowerCase() && categories[i]['name'] != req.body.category) {
                isUse = true
                break
            }
        }
    })
    if(!isUse){
        await Category.findById(id).then(doc => oldImage = doc.imagename)
                fs.unlink('./public/images/category/' + oldImage, (err) => {
                        if (err) throw err
                        console.log("Category image Deleted");
                })
        await Category.updateOne({_id: new ObjectId(id)}, {$set: {
                name: req.body.category,
                imagename: req.file.filename
        }}).then((data) => {
            res.json(data)
        })
    } else {
        fs.unlink('./public/images/category/' + req.file.filename, (err) => {
            if (err) throw err
            console.log("Category image Deleted");
        })
        console.log("Category duplication not allowed");
        res.send(false)
    }
}

