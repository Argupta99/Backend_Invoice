function normalizeField(fieldName) {

    return fieldName.toLowerCase().replace(/[._\s]/g, '');

}

function calculateCoverage(userFields, getSchema) {
    const targetFields = getSchema.fields.map(field => field.path);
//making a smart dictionary for fast searching 

const normalizeTargetMap = new Map();

targetFields.forEach(field=> {
    normalizeTargetMap.set(normalizeField(field), field);
});

const matched = [];
const close = [];
const missing = [];

const userFieldsFound = new Set();


userFields.forEach(userField => {
 const normalizeUserField = normalizeField(userField);

 if(normalizeTargetMap.has(normalizeUserField)) {

    const originalNameField = normalizeTargetMap.get(normalizeUserField);
    matched.push(originalNameField);
    userFieldsFound.add(originalNameField);
 }

 else {
    for (const [normalizedTarget, originalTarget] of normalizedTargetMap.entries()) {
        if (normalizedTarget.includes(normalizeUserField)) {
            close.push({target: originalTarget, user: userField});
            userFieldsFound.add(originalTarget);

            break;
        }

    }
 }
});

targetFields.forEach(targetField => {
    if(!userFieldsFound.has(targetField)) {
    
    missing.push(targetField);
}
    
});

return {matched, close, missing};
}


//run rule checks

function runRuleChecks(rows) {

    const findings = [];

    //for each row in a user file 

    rows.forEach((row, index) => {
     findings.push(checkTotalBalance(row, index + 1));
     findings.push(checkLineMath(row, index + 1));
     findings.push(checkDateISO(row, index + 1));
     findings.push(checkCurrencyAllowed(row, index + 1));
     findings.push(checkTrnPresent(row, index + 1))
    });

    const passCount = findings.filter(f => f.ok).length;

    return {findings: findings, passCount, totalChecks: findings.length};
}


//Rule implementations 

function checkTotalBalance(row, rowNum) {
    const totalExclVat = parseFloat(row.total_excl_vat);
    const vatAmount = parseFloat(row.vat_amount);
    const totalInclVat = parseFloat(row.total_incl_vat);

    const ok = Math.abs((totalExclVat + vatAmount) - totalInclVat) < 0.01;
    return {
        rule: "TOTAL_BALANCE",
        ok,
        details: `Row ${rowNum}`
    };
}

function checkLineMath(row, rowNum) {
    for(let lines of row.lines) {
        const qty = parseFloat(line.qty);
        const unitPrice = parseFloat(line.unit_price);
        const lineTotal = parseFloat(line.line_total);

        if (Math.abs((qty * unitPrice) - lineTotal) > 0.01) {
            return {
                rule: "LINE_MATH",
                ok: false,
                details: `Invoice in row${rowNum}`
            };
        }
    }

    return{rule: "LINE_MATH", ok: true}
}

function checkDateISO(row, rowNum) {

    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

    const ok = isoDatePattern.test(row.date);
    return {rule: "DATE_ISO", ok, value: row.date, details: `Row${rowNum}`};

}

function checkCurrencyAllowed(row, rowNum) {
    const allowedCurrencies = ['AED', 'SAR', 'MYR', 'USD'];

    const ok = allowedCurrencies.includes(row.currency);
    return {rule: "CURRENCY_ALLOWED", ok, value: row.currency, details: `Row${rowNum}`};
}

function checkTrnPresent(row, rowNum) {
    const ok = row.buyer_trn && row.buyer_trn.trim() !== '' && row.seller_trn && row.seller_trn.trim() !== '';
    return {rule: "TRN_PRESENT", ok, details: `Row${rowNum}`};
}


//report card 

function generateReportCard(coverage, ruleResults, questionnaire) {

    const totalTargetFields = coverage.matched.length + coverage.close.length + coverage.missing.length;

    const coverageScore = (coverage.matched.length / totalTargetFields) * 100;

    const ruleScore = (ruleResults.passCount / ruleResults.totalChecks);

    const questionnaireScore = Object.value(questionnaire || {});
    const trueCount = questionnaireScore.filter(val => val === true).length;
    const questionnaireScorePercent = (trueCount / 3) * 100;

    const dataScore = 100;

    const overallScore = 
    (dataScore * 0.25) + (coverageScore * 0.35) + (ruleScore * 0.30) + (questionnaireScorePercent * 0.10);

    return {
        data: Math.round(dataScore),
        coverage: Math.round(coverageScore),
        rules: Math.round(ruleScore),
        posture: Math.round(questionnaireScorePercent),
        overall: Math.round(overallScore)
    };
}