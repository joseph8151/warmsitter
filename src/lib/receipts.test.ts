import { describe, expect, it } from "vitest";
import { csvEscape, paymentsToCsv, settlementsToCsv } from "./receipts";

describe("csvEscape", () => {
  it("leaves plain values untouched", () => {
    expect(csvEscape("hello")).toBe("hello");
    expect(csvEscape(1200)).toBe("1200");
    expect(csvEscape(null)).toBe("");
  });

  it("quotes and escapes values with commas, quotes, or newlines", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("paymentsToCsv", () => {
  it("emits a header row and one row per payment", () => {
    const csv = paymentsToCsv([
      {
        createdAt: new Date("2026-08-03T00:00:00Z"),
        orderId: "care_abc",
        purpose: "CARE_FEE",
        status: "PAID",
        amount: 60000,
        careFee: 60000,
        platformFee: 6000,
        sitterPayout: 54000,
        method: "카드",
      },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      "date,orderId,purpose,status,amount,careFee,platformFee,sitterPayout,method"
    );
    expect(lines[1]).toContain("care_abc");
    expect(lines[1]).toContain("60000");
    expect(lines[1]).toContain("54000");
    expect(lines).toHaveLength(2);
  });

  it("renders missing optional fields as empty", () => {
    const csv = paymentsToCsv([
      {
        createdAt: "2026-08-03T00:00:00Z",
        orderId: "ticket_1",
        purpose: "TICKET",
        status: "PAID",
        amount: 29000,
      },
    ]);
    const row = csv.split("\r\n")[1];
    // careFee, platformFee, sitterPayout, method are empty -> trailing commas
    expect(row).toBe("2026-08-03T00:00:00.000Z,ticket_1,TICKET,PAID,29000,,,,");
  });
});

describe("settlementsToCsv", () => {
  it("emits header + rows and quotes titles with commas", () => {
    const csv = settlementsToCsv([
      {
        createdAt: new Date("2026-08-03T00:00:00Z"),
        jobTitle: "Tue care, 2 kids",
        grossAmount: 60000,
        platformFee: 6000,
        netAmount: 54000,
        status: "PAID",
      },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("date,job,gross,platformFee,net,status");
    expect(lines[1]).toContain('"Tue care, 2 kids"'); // comma -> quoted
    expect(lines[1]).toContain("54000");
  });
});
