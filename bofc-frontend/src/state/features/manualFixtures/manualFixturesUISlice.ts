import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TournamentRoundResponse } from "./manualFixtureTypes";

// Types for UI state
export type SelectedNode = {
  type: "round" | "group";
  id: number;
  data: any;
} | null;

interface ManualFixturesUIState {
  // Tab management
  activeTab: string;

  // Node selection
  selectedNode: SelectedNode;

  // Modal visibility states
  showRoundModal: boolean;
  showGroupModal: boolean;
  showTeamAssignment: boolean;
  showMatchGeneration: boolean;
  showRoundMatchGeneration: boolean;
  showDetailsDrawer: boolean;
  showTeamAdvancement: boolean;
  isEditModalVisible: boolean;

  // Round completion
  roundToComplete: TournamentRoundResponse | null;

  // Editing fixture
  editingFixture: any | null;

  // Fullscreen state for visualization
  isFullscreen: boolean;
}

const initialState: ManualFixturesUIState = {
  activeTab: "overview",
  selectedNode: null,
  showRoundModal: false,
  showGroupModal: false,
  showTeamAssignment: false,
  showMatchGeneration: false,
  showRoundMatchGeneration: false,
  showDetailsDrawer: false,
  showTeamAdvancement: false,
  isEditModalVisible: false,
  roundToComplete: null,
  editingFixture: null,
  isFullscreen: false,
};

const manualFixturesUISlice = createSlice({
  name: "manualFixturesUI",
  initialState,
  reducers: {
    // Tab management
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },

    // Node selection
    setSelectedNode: (state, action: PayloadAction<SelectedNode>) => {
      state.selectedNode = action.payload;
    },
    clearSelectedNode: (state) => {
      state.selectedNode = null;
    },

    // Modal visibility
    setShowRoundModal: (state, action: PayloadAction<boolean>) => {
      state.showRoundModal = action.payload;
      if (action.payload) {
        // Clear selected node when opening round modal for new round
        if (!state.selectedNode || state.selectedNode.type !== "round") {
          state.selectedNode = null;
        }
      }
    },
    setShowGroupModal: (state, action: PayloadAction<boolean>) => {
      state.showGroupModal = action.payload;
      if (!action.payload) {
        // Clear selected node when closing group modal
        if (state.selectedNode?.type === "group") {
          state.selectedNode = null;
        }
      }
    },
    setShowTeamAssignment: (state, action: PayloadAction<boolean>) => {
      state.showTeamAssignment = action.payload;
      if (!action.payload) {
        // Clear selected node when closing team assignment
        state.selectedNode = null;
      }
    },
    setShowMatchGeneration: (state, action: PayloadAction<boolean>) => {
      state.showMatchGeneration = action.payload;
      if (!action.payload) {
        // Clear selected node when closing match generation
        if (state.selectedNode?.type === "group") {
          state.selectedNode = null;
        }
      }
    },
    setShowRoundMatchGeneration: (state, action: PayloadAction<boolean>) => {
      state.showRoundMatchGeneration = action.payload;
      if (!action.payload) {
        // Clear selected node when closing round match generation
        if (state.selectedNode?.type === "round") {
          state.selectedNode = null;
        }
      }
    },
    setShowDetailsDrawer: (state, action: PayloadAction<boolean>) => {
      state.showDetailsDrawer = action.payload;
      if (!action.payload) {
        state.selectedNode = null;
      }
    },
    setShowTeamAdvancement: (state, action: PayloadAction<boolean>) => {
      state.showTeamAdvancement = action.payload;
      if (!action.payload) {
        state.roundToComplete = null;
      }
    },
    setIsEditModalVisible: (state, action: PayloadAction<boolean>) => {
      state.isEditModalVisible = action.payload;
      if (!action.payload) {
        state.editingFixture = null;
      }
    },

    // Round completion
    setRoundToComplete: (state, action: PayloadAction<TournamentRoundResponse | null>) => {
      state.roundToComplete = action.payload;
    },

    // Editing fixture
    setEditingFixture: (state, action: PayloadAction<any | null>) => {
      state.editingFixture = action.payload;
      state.isEditModalVisible = action.payload !== null;
    },

    // Fullscreen
    setIsFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isFullscreen = action.payload;
    },

    // Reset all UI state
    resetUIState: (state) => {
      return initialState;
    },

    // Close all modals
    closeAllModals: (state) => {
      state.showRoundModal = false;
      state.showGroupModal = false;
      state.showTeamAssignment = false;
      state.showMatchGeneration = false;
      state.showRoundMatchGeneration = false;
      state.showDetailsDrawer = false;
      state.showTeamAdvancement = false;
      state.isEditModalVisible = false;
      state.selectedNode = null;
      state.roundToComplete = null;
      state.editingFixture = null;
    },
  },
});

export const {
  setActiveTab,
  setSelectedNode,
  clearSelectedNode,
  setShowRoundModal,
  setShowGroupModal,
  setShowTeamAssignment,
  setShowMatchGeneration,
  setShowRoundMatchGeneration,
  setShowDetailsDrawer,
  setShowTeamAdvancement,
  setIsEditModalVisible,
  setRoundToComplete,
  setEditingFixture,
  setIsFullscreen,
  resetUIState,
  closeAllModals,
} = manualFixturesUISlice.actions;

export default manualFixturesUISlice.reducer;

