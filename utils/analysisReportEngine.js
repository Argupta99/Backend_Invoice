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

