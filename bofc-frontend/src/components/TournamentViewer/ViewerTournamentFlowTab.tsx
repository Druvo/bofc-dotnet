import { useEffect, useMemo, useState } from "react";
import { ApartmentOutlined, PictureOutlined, CloseOutlined } from "@ant-design/icons";
import { useGetTournamentStructureQuery } from "../../state/features/manualFixtures/manualFixturesSlice";
import { useGetFixturesQuery } from "../../state/features/fixtures/fixturesSlice";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import TournamentFlowVisualization from "../Tournaments/Fixtures/ManualFixtures/TournamentFlowVisualization";
import { toAbsoluteLogoUrl } from "./teamLogoUtils";
import styles from "./ViewerTournamentFlowTab.module.css";
import Loader from "../ui/loader";

interface ViewerTournamentFlowTabProps {
  tournamentId: number;
  isActive?: boolean;
}

const segmentBtn = (active: boolean) =>
  `inline-flex items-center gap-1.5 px-3.5 py-1.5 text-theme-sm font-medium transition ${
    active
      ? "bg-brand-500 text-white"
      : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
  }`;

export default function ViewerTournamentFlowTab({
  tournamentId,
  isActive = false,
}: ViewerTournamentFlowTabProps) {
  const { data: structureData, isLoading } = useGetTournamentStructureQuery(
    { tournamentId },
    { skip: !tournamentId }
  );

  const { data: fixturesData } = useGetFixturesQuery(
    { tournamentId },
    { skip: !isActive }
  );

  const { data: tournamentSummary } = useGetTournamentSummaryQuery({ tournamentId });

  const tournamentStructure = structureData?.content;
  const fixtures = useMemo(() => fixturesData?.content || [], [fixturesData]);
  const roadmapImageUrl = tournamentSummary?.content?.[0]?.roadmapImageUrl;

  const [view, setView] = useState<"image" | "flow">("image");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setView(roadmapImageUrl ? "image" : "flow");
  }, [roadmapImageUrl]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPreviewOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <Loader />
      </div>
    );
  }

  const hasFlowChart = !!tournamentStructure && tournamentStructure.rounds.length > 0;

  if (!roadmapImageUrl && !hasFlowChart) {
    return (
      <div className={styles.emptyWrap}>
        <div className="text-center text-theme-sm text-gray-400 dark:text-gray-500">Roadmap not available yet</div>
      </div>
    );
  }

  const absoluteRoadmapUrl = roadmapImageUrl ? toAbsoluteLogoUrl(roadmapImageUrl) : undefined;

  return (
    <div className={styles.flowTabWrap}>
      {roadmapImageUrl && hasFlowChart && (
        <div className={styles.toggleWrap}>
          <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            <button type="button" onClick={() => setView("image")} className={segmentBtn(view === "image")}>
              <PictureOutlined /> Roadmap Image
            </button>
            <button type="button" onClick={() => setView("flow")} className={segmentBtn(view === "flow")}>
              <ApartmentOutlined /> Flow Chart
            </button>
          </div>
        </div>
      )}

      {view === "image" && roadmapImageUrl ? (
        <div className={styles.imageWrap}>
          <img
            src={absoluteRoadmapUrl}
            alt="Tournament Roadmap"
            className={styles.roadmapImage}
            onClick={() => setPreviewOpen(true)}
            style={{ cursor: "zoom-in" }}
          />
        </div>
      ) : hasFlowChart ? (
        <div className={styles.flowWrap}>
          <TournamentFlowVisualization
            tournamentStructure={tournamentStructure!}
            fixtures={fixtures}
          />
        </div>
      ) : (
        <div className={styles.emptyWrap}>
          <div className="text-center text-theme-sm text-gray-400 dark:text-gray-500">Roadmap not available yet</div>
        </div>
      )}

      {previewOpen && absoluteRoadmapUrl && (
        <div
          role="dialog"
          aria-modal
          aria-label="Roadmap image preview"
          className="fixed inset-0 z-modal flex items-center justify-center p-5"
        >
          <div className="fixed inset-0" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setPreviewOpen(false)} />
          <div style={{ position: "relative", maxWidth: "92vw", maxHeight: "92vh" }}>
            <button
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
              style={{
                position: "absolute",
                right: -10,
                top: -10,
                zIndex: 20,
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <CloseOutlined style={{ color: "#fff", fontSize: 16 }} />
            </button>
            <img
              src={absoluteRoadmapUrl}
              alt="Tournament Roadmap"
              style={{ maxWidth: "92vw", maxHeight: "92vh", display: "block", borderRadius: 8 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
