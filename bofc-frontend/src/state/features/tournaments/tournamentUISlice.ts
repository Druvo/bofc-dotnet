import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TournamentUIState {
  // Main tournament tab management (team-building vs fixtures)
  activeMainTab: string;
}

const initialState: TournamentUIState = {
  activeMainTab: "team-building",
};

const tournamentUISlice = createSlice({
  name: "tournamentUI",
  initialState,
  reducers: {
    setActiveMainTab: (state, action: PayloadAction<string>) => {
      state.activeMainTab = action.payload;
    },
    resetTournamentUI: (state) => {
      state.activeMainTab = "team-building";
    },
  },
});

export const { setActiveMainTab, resetTournamentUI } = tournamentUISlice.actions;

export default tournamentUISlice.reducer;
