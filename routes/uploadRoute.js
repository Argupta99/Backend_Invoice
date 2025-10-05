const express = require('express');
const router = express.Router();
const multer = require('multer');
const Upload = require('../models/uploadModel');


//multer setup: storage of memory / file in RAM
const storage = multer.memoryStorage();
const upload = multer({storage: storage});


// Temporary test route (to verify multer)
//router.post('/test', upload.single('file'), (req, res) => {
  //console.log('📂 Received file details:', req.file);
  //if (!req.file) {
    //return res.status(400).json({ message: 'File not received by multer' });
  //}
  //res.json({
    //status: 'success',
    //fileName: req.file.originalname,
    //size: req.file.size,
    //message: 'File successfully received by multer ✅',
  //});
//});


//POST UPLOAD ROUTE

router.post('/', upload.single('file'), async(req, res) => {
try {
    if(!req.file) {
        return res.status(400).json({message:'File not uploaded'});
    }

const fileBuffer = req.file.buffer;
const fileContext = fileBuffer.toString('utf-8');

let data;
if(req.file.originalname.endsWith('.json')) {
    data = JSON.parse(fileContext);
}

else if (req.file.originalname.endsWith('.csv')) {
 const rows = fileContext.split('\n').slice(0, 200);
 const headers = rows[0].split(',');
 data = rows.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
        obj[h.trim()] = values[i]? values[i].trim() : '';
    }
);

return obj;
 });

} 

else {
    return res.status(400).json({message: 'Unsupported file'});
}

const uploadedDoc = await Upload.create({rows: data});

res.json({uploadId: uploadedDoc._id});

} catch (error) {
    console.log (error);
    res.status(500).json({message: 'Upload failed'});
}

});

module.exports = router;












