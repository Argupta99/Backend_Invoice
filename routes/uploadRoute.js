const express = require('express');
const router = express.Router();
const multer = require('multer');
const Upload = require('../models/uploadModel');
const {analyzeData} = require('../utils/analysisEngine');
const Report = require('../models/reportModel');
const getSchema = require('../utils/get_schema.json');

console.log('uploadRoute.js loaded!');

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
    headers.forEach((h, i) => { // <-- forEach starts here
        obj[h.trim()] = values[i]? values[i].trim() : '';
    }); // <-- forEach must be closed here
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


// DEBUG: Simple /analyze test route to verify it's hit
router.post('/analyze', async (req, res) => {
    console.log('Analyze route hit!', req.body);
    res.json({ test: 'ok' });
});


//Post analyze route 

router.post('/analyze', async(req, res) => {
    

    try {
    const {uploadId, questionnaire } = req.body;

    if(!uploadId) {
        return res.status(400).json({message: 'uploadId is required'});
    }
const uploadDoc = await Upload.findById(uploadId);
    if (!uploadDoc) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    const analysisResult = analyzeData(uploadDoc.rows, getSchema, questionnaire);
    const reportDoc = new Report({
        uploadId: uploadId,
        scores: analysisResult.scores,
        coverage: analysisResult.coverage,
        ruleFindings: analysisResult.ruleFindings,   
    });

    //saving report doc to database
    await reportDoc.save();

    const finalReport = {
        reportId: reportDoc._id,
        ...analysisResult,
        meta: {
            rowsParsed: uploadDoc.rows.length,
            db: 'mongodb',
        }
    };

    res.json(finalReport);
} catch (error) {
    console.log(error);
    res.status(500).json({message: 'Analysis failed'});
}

});

//route for shareable link to get report by id

router.get('/report/:reportId', async(req, res) => {
try {
    const {reportId} = req.params;
    const report = await Report.findById(reportId);

    if(!report) {
        return res.status(404).json({message: 'Report not found'});
    }

    const finalReport = {
        reportId: report._id,
        scores: report.scores,
        coverage: report.coverage,
        ruleFindings: report.ruleFindings,
    };
    res.json(finalReport);
} catch (err) {
    console.error("Failed to fetch report", err);
    res.status(500).json({message: 'Failed to fetch report'});
}

});

module.exports = router;












