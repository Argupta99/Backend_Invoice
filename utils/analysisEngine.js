function normalizeField(fieldName) {
  return fieldName.toLowerCase().replace(/[._\s]/g, '');
}

function calculateCoverage(userFields, getsSchema) {
  const targetFields = getsSchema.fields.map(field => field.path);

  const normalizedTargetMap = new Map();
  targetFields.forEach(field => {
    normalizedTargetMap.set(normalizeField(field), field);
  });

  const matched = [];
  const close = [];
  const missing = [];
  const userFieldsFound = new Set();

  userFields.forEach(userField => {
    const normalizedUserField = normalizeField(userField);

    if (normalizedTargetMap.has(normalizedUserField)) {
      const originalTargetField = normalizedTargetMap.get(normalizedUserField);
      matched.push(originalTargetField);
      userFieldsFound.add(originalTargetField);
    } else {
      for (const [normalizedTarget, originalTarget] of normalizedTargetMap.entries()) {
        if (normalizedTarget.includes(normalizedUserField)) {
          close.push({ target: originalTarget, candidate: userField });
          userFieldsFound.add(originalTarget);
          break;
        }
      }
    }
  });

  targetFields.forEach(targetField => {
    if (!userFieldsFound.has(targetField)) {
      missing.push(targetField);
    }
  });

  return { matched, close, missing };
}
