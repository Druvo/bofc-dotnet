import { filterPlayersKeepingSelected, matchesCollectionSearch, matchesPlayerSearch } from "./collectionSearch";

/**
 * SPEC: spec-334e33. The bug: the Payment Collections search box matched only the transaction ID
 * and voucher code, so typing a payer's name or employee ID found nothing.
 */

const rahim = { id: 1, name: "Rahim Uddin", employeeId: "BJIT-1001" };
const karim = { id: 2, name: "Karim Ali", employeeId: "BJIT-1002" };
const salma = { id: 3, name: "Salma Khatun", employeeId: "BJIT-2003" };

const collections = [
    { id: 10, transactionId: "TRX-AAA", voucherCode: "V-01", allPayersName: "Rahim Uddin", players: [rahim] },
    { id: 11, transactionId: "TRX-BBB", voucherCode: "V-02", allPayersName: "Karim Ali, Salma Khatun", players: [karim, salma] },
    { id: 12, transactionId: undefined, voucherCode: undefined, allPayersName: undefined, players: undefined },
    { id: 13, transactionId: null, voucherCode: null, allPayersName: null, players: null },
    { id: 14, transactionId: "TRX-CCC", players: [{ id: 4, name: undefined, employeeId: undefined }] },
] as any[];

const idsFor = (text: string) => collections.filter((c) => matchesCollectionSearch(c, text)).map((c) => c.id);

describe("payment collection search", () => {
    it("matches a payer's name, ignoring case", () => {
        expect(idsFor("rahim")).toEqual([10]);
        expect(idsFor("SALMA")).toEqual([11]);
    });

    it("matches a payer's employee ID, including collections with several payers", () => {
        expect(idsFor("bjit-2003")).toEqual([11]);
        expect(idsFor("BJIT-100")).toEqual([10, 11]);
    });

    it("still matches transaction ID and voucher code", () => {
        expect(idsFor("trx-bbb")).toEqual([11]);
        expect(idsFor("v-01")).toEqual([10]);
    });

    it("does not throw on missing values and simply does not match them", () => {
        expect(() => idsFor("x")).not.toThrow();
        expect(idsFor("nobody")).toEqual([]);
    });

    it("matches every row when the text is empty", () => {
        expect(idsFor("")).toEqual([10, 11, 12, 13, 14]);
        expect(idsFor("   ")).toEqual([10, 11, 12, 13, 14]);
    });
});

describe("player picker filter", () => {
    const players = [rahim, karim, salma];

    it("matches by name or employee ID", () => {
        expect(matchesPlayerSearch(rahim, "uddin")).toBe(true);
        expect(matchesPlayerSearch(salma, "2003")).toBe(true);
        expect(matchesPlayerSearch(karim, "salma")).toBe(false);
    });

    it("narrows the list but keeps selected players", () => {
        expect(filterPlayersKeepingSelected(players, "salma", []).map((p) => p.id)).toEqual([3]);
        expect(filterPlayersKeepingSelected(players, "salma", [1]).map((p) => p.id)).toEqual([1, 3]);
    });

    it("shows every player when the filter is empty", () => {
        expect(filterPlayersKeepingSelected(players, "", [2]).map((p) => p.id)).toEqual([1, 2, 3]);
    });
});
