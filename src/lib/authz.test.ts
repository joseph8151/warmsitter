import { describe, expect, it } from "vitest";
import { canReview, canSuspend, resolveBookingSides, resolveSelfProvisionRole } from "./authz";

describe("resolveSelfProvisionRole", () => {
  it("allows SITTER", () => {
    expect(resolveSelfProvisionRole("SITTER")).toBe("SITTER");
  });
  it("defaults to PARENT for anything else", () => {
    expect(resolveSelfProvisionRole("PARENT")).toBe("PARENT");
    expect(resolveSelfProvisionRole(undefined)).toBe("PARENT");
  });
  it("never grants ADMIN (privilege-escalation guard)", () => {
    expect(resolveSelfProvisionRole("ADMIN")).toBe("PARENT");
    expect(resolveSelfProvisionRole("admin")).toBe("PARENT");
    expect(resolveSelfProvisionRole({ role: "ADMIN" })).toBe("PARENT");
  });
});

describe("canReview", () => {
  const job = { parentId: "p1", matchedSitterId: "s1", status: "COMPLETED" };

  it("lets the parent review the matched sitter on a completed job", () => {
    expect(canReview({ job, userId: "p1", targetId: "s1" })).toEqual({ ok: true });
  });
  it("lets the sitter review the parent", () => {
    expect(canReview({ job, userId: "s1", targetId: "p1" })).toEqual({ ok: true });
  });
  it("rejects a non-participant", () => {
    expect(canReview({ job, userId: "x9", targetId: "s1" })).toMatchObject({ ok: false, status: 403 });
  });
  it("rejects reviewing someone who isn't the counterparty", () => {
    expect(canReview({ job, userId: "p1", targetId: "s2" })).toMatchObject({ ok: false, error: "INVALID_TARGET" });
  });
  it("rejects when the job isn't completed", () => {
    expect(
      canReview({ job: { ...job, status: "MATCHED" }, userId: "p1", targetId: "s1" })
    ).toMatchObject({ ok: false, status: 409 });
  });
  it("rejects a missing job", () => {
    expect(canReview({ job: null, userId: "p1", targetId: "s1" })).toMatchObject({ ok: false, status: 404 });
  });
});

describe("resolveBookingSides", () => {
  it("maps a parent creator", () => {
    expect(resolveBookingSides("PARENT", "p1", "s1")).toEqual({
      parentId: "p1",
      sitterId: "s1",
      expectedCounterRole: "SITTER",
    });
  });
  it("maps a sitter creator", () => {
    expect(resolveBookingSides("SITTER", "s1", "p1")).toEqual({
      parentId: "p1",
      sitterId: "s1",
      expectedCounterRole: "PARENT",
    });
  });
  it("returns null for a non-participant role (e.g. ADMIN)", () => {
    expect(resolveBookingSides("ADMIN", "a1", "p1")).toBeNull();
  });
});

describe("canSuspend", () => {
  it("allows suspending a regular user", () => {
    expect(canSuspend("admin1", { id: "u2", role: "PARENT" })).toEqual({ ok: true });
  });
  it("forbids self-suspension", () => {
    expect(canSuspend("admin1", { id: "admin1", role: "ADMIN" })).toMatchObject({ ok: false, status: 400 });
  });
  it("forbids suspending another admin", () => {
    expect(canSuspend("admin1", { id: "admin2", role: "ADMIN" })).toMatchObject({ ok: false, status: 403 });
  });
});
