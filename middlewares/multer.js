const multer = require('multer')
const path = require('path')

const uploadCategory =  multer({
    storage: multer.diskStorage({
        destination: './public/images/category',
        filename: (req,file,cb) => {
            let ext = path.extname(file.originalname)
            cb(null, Date.now()+ "-" + req.body.category.replace(/\s+/g, '') + ext)
        }
    }),
    limits: {
        fileSize: 1024 * 1024 * 5 ,
    }
})

const uploadBanner =  multer({
    storage: multer.diskStorage({
        destination: './public/images/banner',
        filename: (req,file,cb) => {
            let ext = path.extname(file.originalname)
            cb(null, Date.now()+ "-" + req.body.name.replace(/\s+/g, '') + ext)
        }
    }),
    limits: {
        fileSize: 1024 * 1024 * 5 ,
    }
})

const uploadProduct = multer({
    storage: multer.diskStorage({
        destination: './public/images/product',
        filename: (req,file,cb) => {
            cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, ''))
        }
    })
})

module.exports = {
    uploadCategory,
    uploadProduct,
    uploadBanner
}