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
