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

//run rule check 

function runRuleChecks(rows) {
  const allFindings = [];
  rows.forEach((row, index) => {
    allFindings.push(checkTotalsBalance(row, index + 1));
    allFindings.push(checkLineMath(row, index + 1));
    allFindings.push(checkDateISO(row, index + 1));
    allFindings.push(checkCurrencyAllowed(row, index + 1));
    allFindings.push(checkTrnPresent(row, index + 1));
  });
  const passedCount = allFindings.filter(f => f.ok).length;
  return { findings: allFindings, passedCount, totalChecks: allFindings.length };
}

function checkTotalsBalance(row, rowNum) {
  const totalExclVat = parseFloat(row.total_excl_vat);
  const vatAmount = parseFloat(row.vat_amount);
  const totalInclVat = parseFloat(row.total_incl_vat);
  const ok = Math.abs(totalExclVat + vatAmount - totalInclVat) < 0.01;
  return { rule: "TOTALS_BALANCE", ok, details: `Row ${rowNum}` };
}

function checkLineMath(row, rowNum) {
  for (let line of row.lines) {
    const qty = parseFloat(line.qty);
    const unitPrice = parseFloat(line.unit_price);
    const lineTotal = parseFloat(line.line_total);
    if (Math.abs(qty * unitPrice - lineTotal) > 0.01) {
      return { rule: "LINE_MATH", ok: false, details: `Invoice in row ${rowNum}` };
    }
  }
  return { rule: "LINE_MATH", ok: true };
}

function checkDateISO(row, rowNum) {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const ok = isoDatePattern.test(row.date);
  return { rule: "DATE_ISO", ok, value: row.date, details: `Row ${rowNum}` };
}

function checkCurrencyAllowed(row, rowNum) {
  const allowedCurrencies = ['AED', 'SAR', 'MYR', 'USD'];
  const ok = allowedCurrencies.includes(row.currency);
  return { rule: "CURRENCY_ALLOWED", ok, value: row.currency, details: `Row ${rowNum}` };
}

function checkTrnPresent(row, rowNum) {
  const ok = row.buyer_trn && row.buyer_trn.trim() !== '' && row.seller_trn && row.seller_trn.trim() !== '';
  return { rule: "TRN_PRESENT", ok, details: `Row ${rowNum}` };
}


//calculate field 

function calculateScores(coverage, ruleResults, questionnaire) {
  const totalTargetFields = coverage.matched.length + coverage.close.length + coverage.missing.length;
  const coverageScore = (coverage.matched.length / totalTargetFields) * 100;
  const rulesScore = (ruleResults.totalChecks > 0) ? (ruleResults.passedCount / ruleResults.totalChecks) * 100 : 100;
  const postureValues = Object.values(questionnaire || {});
  const trueCount = postureValues.filter(val => val === true).length;
  const postureScore = (trueCount / 3) * 100;
  const dataScore = 100;
  const overallScore = (dataScore * 0.25) + (coverageScore * 0.35) + (rulesScore * 0.30) + (postureScore * 0.10);

  return {
    data: Math.round(dataScore),
    coverage: Math.round(coverageScore),
    rules: Math.round(rulesScore),
    posture: Math.round(postureScore),
    overall: Math.round(overallScore),
  };
}

//analyzing data 

function analyzeData(rows, getsSchema, questionnaire) {
  const userFields = Object.keys(rows[0] || {});
  const coverageResult = calculateCoverage(userFields, getsSchema);
  const ruleCheckResult = runRuleChecks(rows);
  const scores = calculateScores(coverageResult, ruleCheckResult, questionnaire);

  return {
    scores: scores,
    coverage: coverageResult,
    ruleFindings: ruleCheckResult.findings,
  };
}

module.exports = { analyzeData };
