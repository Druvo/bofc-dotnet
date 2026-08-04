import { RootState } from "../../store";

// Selectors for ManualFixtures UI state
export const selectManualFixturesUI = (state: RootState) => state.manualFixturesUI;

export const selectActiveTab = (state: RootState) => state.manualFixturesUI.activeTab;
export const selectSelectedNode = (state: RootState) => state.manualFixturesUI.selectedNode;
export const selectShowRoundModal = (state: RootState) => state.manualFixturesUI.showRoundModal;
export const selectShowGroupModal = (state: RootState) => state.manualFixturesUI.showGroupModal;
export const selectShowTeamAssignment = (state: RootState) => state.manualFixturesUI.showTeamAssignment;
export const selectShowMatchGeneration = (state: RootState) => state.manualFixturesUI.showMatchGeneration;
export const selectShowRoundMatchGeneration = (state: RootState) => state.manualFixturesUI.showRoundMatchGeneration;
export const selectShowDetailsDrawer = (state: RootState) => state.manualFixturesUI.showDetailsDrawer;
export const selectShowTeamAdvancement = (state: RootState) => state.manualFixturesUI.showTeamAdvancement;
export const selectIsEditModalVisible = (state: RootState) => state.manualFixturesUI.isEditModalVisible;
export const selectRoundToComplete = (state: RootState) => state.manualFixturesUI.roundToComplete;
export const selectEditingFixture = (state: RootState) => state.manualFixturesUI.editingFixture;
export const selectIsFullscreen = (state: RootState) => state.manualFixturesUI.isFullscreen;

