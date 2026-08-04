import assert from "node:assert/strict";
import test from "node:test";
import { buildPriceBreakdown, normalizeCharges } from "../src/lib/discrepancy-price-breakdown.mjs";

test("keeps surcharge lines that share a code but have different descriptions", () => {
    const charges = normalizeCharges([
        { code: "freight", description: "Freight", price: { value: "22.73" } },
        { code: "extra_fee", description: "Residential", price: { value: "2.50" } },
        { code: "extra_fee", description: "DAS Extended", price: { value: "4.04" } },
        { code: "extra_fee", description: "Additional weight charge", price: { value: "8.65" } },
        { code: "extra_fee", description: "Fuel Surcharge", price: { value: "9.58" } }
    ]);

    const rows = buildPriceBreakdown(charges, charges);

    assert.equal(rows.length, 5);
    assert.deepEqual(rows.map((row) => row.label), [
        "Freight",
        "Residential",
        "DAS Extended",
        "Additional weight charge",
        "Fuel Surcharge"
    ]);
});

test("matches order and metadata charges by description even when their codes differ", () => {
    const quoted = normalizeCharges([{ code: "quoted_extra", description: "Fuel Surcharge", amount: 9.58 }]);
    const billed = normalizeCharges([{ code: "extra_fee", description: "Fuel Surcharge", price: { value: "9.58" } }]);

    const rows = buildPriceBreakdown(quoted, billed);

    assert.equal(rows.length, 1);
    assert.equal(rows[0].quotedAmount, 9.58);
    assert.equal(rows[0].billedAmount, 9.58);
});
