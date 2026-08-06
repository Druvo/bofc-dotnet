import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MatchDayUIState {
  // Main matchDay tab management (team-building vs fixtures)
  activeMainTab: string;
}

const initialState: MatchDayUIState = {
  activeMainTab: "team-building",
};

const matchDayUISlice = createSlice({
  name: "matchDayUI",
  initialState,
  reducers: {
    setActiveMainTab: (state, action: PayloadAction<string>) => {
      state.activeMainTab = action.payload;
    },
    resetMatchDayUI: (state) => {
      state.activeMainTab = "team-building";
    },
  },
});

export const { setActiveMainTab, resetMatchDayUI } = matchDayUISlice.actions;

export default matchDayUISlice.reducer;
