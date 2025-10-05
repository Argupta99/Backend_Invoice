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