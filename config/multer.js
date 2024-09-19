const multer = require('multer')
const crypto = require('crypto')
const path = require('path')

//disk storage
const storage = multer.diskStorage({
    destination : function (req,file,cb){
        cb(null,"./public/images/uploads/")
    },
    filename : (req,file,cb)=>{
        crypto.randomBytes(12,(err,bytes)=>{
            let fn = bytes.toString("hex") + path.extname(file.originalname)
            cb(null,fn)
        })
    }
})

//disk storage - server pe storage
//memory storage - database mai storage

const upload = multer({storage : storage});

module.exports = upload;