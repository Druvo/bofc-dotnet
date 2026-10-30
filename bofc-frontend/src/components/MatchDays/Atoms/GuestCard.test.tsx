import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import GuestCard from "./GuestCard";

// SPEC: spec-6d7e9b
describe("GuestCard rank selector", () => {
    const guest = { guestId: 7, name: "A guest with a rather long name", teamId: null, rank: 3 };

    it("keeps the label clear of the forms plugin's vertical padding and arrow", () => {
        render(<GuestCard guest={guest} handleSetGuestRank={() => {}} />);
        const select = screen.getByLabelText(`Rank for ${guest.name}`);
        const classes = select.className.split(/\s+/);
        // h-7 (28px) only fits an 18px line once the plugin's 0.5rem top/bottom padding is gone.
        expect(classes).toEqual(expect.arrayContaining(["h-7", "py-0", "shrink-0"]));
        expect(classes).not.toContain("px-1.5");
        // The plugin draws the arrow up to 26px in from the right; pr-7 is 28px.
        expect(classes).toContain("pr-7");
    });

    it("sets a rank and clears it with Rank -", () => {
        const setRank = jest.fn();
        render(<GuestCard guest={guest} handleSetGuestRank={setRank} />);
        const select = screen.getByLabelText(`Rank for ${guest.name}`);
        fireEvent.change(select, { target: { value: "10" } });
        fireEvent.change(select, { target: { value: "" } });
        expect(setRank).toHaveBeenNthCalledWith(1, 10);
        expect(setRank).toHaveBeenNthCalledWith(2, null);
    });

    it("shows no selector to viewers who cannot manage teams", () => {
        render(<GuestCard guest={guest} />);
        expect(screen.queryByLabelText(`Rank for ${guest.name}`)).toBeNull();
    });
});
