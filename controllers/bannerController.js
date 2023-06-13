const Banner = require('../models/bannerModel')
const fs = require('fs')
/**
 * 
 * GET Banner management page for admin
 */
exports.getBanner = async(req,res) => {

    const allBanners = await Banner.find()

    res.render('admin/banner', {
        currPage: 'Banners',
        allBanners,
        bannerAdded: req.session.admin.bannerAdded,
        bannerUpdated: req.session.admin.bannerUpdated
    })
    req.session.admin.bannerAdded = false
    req.session.admin.bannerUpdated = false
    req.session.save()
}

/* GET Add banner form */
exports.getBannerForm = (req,res) => {
    res.render('admin/add-banner', {
        currPage: 'Banners',
        bannerMsg: req.session.admin.bannerMsg
    })
    req.session.admin.bannerMsg = undefined
    req.session.save()
}

/* POST banner add form  */
exports.postBannerForm = async(req,res) => {
    const { name } = req.body
    const image = req.file
    const allBanners = await Banner.find();
    let exist = false

    allBanners.forEach(banner => {
        if(banner.name.toLowerCase() === name.toLowerCase()){
            exist = true
        }
    })

    if(exist){
        try {
            fs.unlink('./public/images/banner/' + image.filename, (err) => {
                if (err) throw err
                console.log("duplicate banner image deleted");
            })
        } catch (error) {
            console.error(error, 'Banner duplicate image not deleted');
        }
        
        req.session.admin.bannerMsg = 'Banner name already in use. try another name !'
        return res.redirect('/admin/add-banner')
    }
    const newBanner = new Banner({
        name: name,
        imgName: image.filename
    })
    await Banner.create(newBanner)

    req.session.admin.bannerAdded = true
   res.redirect('/admin/banner')
}

/* PATCH change banner status */
exports.patchBannerStatus = async(req,res) => {
    let {bannerId, currStat} = req.body
    currStat = JSON.parse(currStat)
    
    const banners = await Banner.find()
    let count = 0
    banners.forEach( banner => {
        if(banner.currentBanner){
            count++
        }
    })
    if(count == 2 && currStat === false){
        return res.json({statusChanged: false, msg: 'Default Active Banner Limit Reached'})
    }

    const banner = await Banner.findById(bannerId)
    if(banner.currentBanner === currStat){
        await Banner.updateOne(
            {
                _id: banner._id
            },
            {
                $set: {currentBanner: !currStat}
            }
        ).then(() => res.json({statusChanged: true, newStatus: !currStat}))
    }
}

/* GET edit banner */
exports.getEditBanner = async(req,res) => {
    const banner = await Banner.findById(req.params.id)
    res.render('admin/edit-banner', {
        currPage: 'Banners',
        banner,
        bannerExist: req.session.admin.bannerExist
    })
    req.session.admin.bannerExist = false
    req.session.save()
}

/* POST edit banner */
exports.postEditBanner = async(req,res) => {
    const { bannerId , name } = req.body
    const image = req.file
    const banners = await Banner.find()
    let exist = false

    for(let i=0 ; i<banners.length ; i++){
        if(banners[i]['name'].toLowerCase() === name.toLowerCase() && banners[i]['name'] !== name){
            exist = true
            break
        }
    }


    if(exist){
        if(image){
            fs.unlink('./public/images/banner/'+ image.filename, err =>{
                if(err) throw err
                console.log('banner image deleted');
            })
        }
        req.session.admin.bannerExist = true
        return res.redirect('/admin/edit-banner/'+bannerId)
    }else {
        if(image){
            await Banner.findById(bannerId)
            .then(banner => {
                fs.unlink('./public/images/banner/'+ banner.imgName, err => {
                    if(err) throw err
                    console.log('old banner image deleted');
                })
            })
            await Banner.updateOne(
                {
                    _id: bannerId
                },
                {
                    $set: {name: name, imgName: image.filename}
                }
            ).then(() => {
                req.session.admin.bannerUpdated = true
                res.redirect('/admin/banner')
            })
        }else{
            await Banner.updateOne(
                {
                    _id: bannerId
                },
                {
                    $set: {name: name}
                }
            ).then(() => {
                req.session.admin.bannerUpdated = true
                res.redirect('/admin/banner')
            })
        }
    }
}

/* DELETE banner */
exports.deleteBanner = async(req,res) => {
    const bannerId = req.body.id
    await Banner.findById(bannerId)
    .then(banner => {
        if(!banner.currentBanner){
            fs.unlink('./public/images/banner/'+ banner.imgName, err => {
                if(err) console.log(err);
                console.log('banner image deleted');
            })
        } 
    })
    await Banner.deleteOne({_id: bannerId, currentBanner: false})
    .then(done => {
        if(done.deletedCount > 0){
            res.json({bannerDeleted: true})
        }else{
            res.json({bannerDeleted: false})
        }  
    })
    .catch(err => {
        console.error(err);
        res.json({bannerDeleted: false})
    })
}