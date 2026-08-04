import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  DeleteOutlined,
  EditOutlined,
  TeamOutlined,
  UserOutlined,
  DollarOutlined,
  StarFilled,
} from "@ant-design/icons";
import { TournamentPrize, PrizeType } from "../../../state/features/prizes/prizeTypes";
import { useDeleteTournamentPrizeMutation } from "../../../state/features/prizes/prizesSlice";
import Button from "../../ui/button";
import Modal from "../../ui/modal";

interface PrizeCardProps {
  prize: TournamentPrize;
  isAdmin?: boolean;
  onEdit?: (prize: TournamentPrize) => void;
}

export default function PrizeCard({ prize, isAdmin, onEdit }: PrizeCardProps) {
  const [deletePrize, { isLoading: isDeleting }] = useDeleteTournamentPrizeMutation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const defaultBackground = `${process.env.PUBLIC_URL}/loginBackground.png`;
  const hasImages = prize.imageLinks && prize.imageLinks.length > 0;
  const backgroundImage = hasImages && prize.imageLinks ? prize.imageLinks[currentImageIndex] : defaultBackground;

  useEffect(() => {
    if (hasImages && prize.imageLinks && prize.imageLinks.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prize.imageLinks ? (prevIndex + 1) % prize.imageLinks.length : 0
        );
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [hasImages, prize.imageLinks]);

  const handleDelete = async () => {
    try {
      await deletePrize({
        tournamentId: prize.tournamentId,
        prizeId: prize.id,
      }).unwrap();
      toast.success("Prize deleted successfully");
    } catch (error) {
      console.error("Failed to delete prize:", error);
    }
    setConfirmDeleteOpen(false);
  };

  const getRankStyle = (rank: number) => {
    const baseStyles = {
      1: {
        gradient: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
        shadow: "0 16px 32px rgba(255, 215, 0, 0.4)",
        emoji: "🥇",
        borderColor: "#FFD700",
        titleColor: "#B8860B",
        overlayColor: "rgba(255, 255, 255, 0.85)",
      },
      2: {
        gradient: "linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)",
        shadow: "0 16px 32px rgba(192, 192, 192, 0.4)",
        emoji: "🥈",
        borderColor: "#C0C0C0",
        titleColor: "#808080",
        overlayColor: "rgba(255, 255, 255, 0.85)",
      },
      3: {
        gradient: "linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)",
        shadow: "0 16px 32px rgba(205, 127, 50, 0.4)",
        emoji: "🥉",
        borderColor: "#CD7F32",
        titleColor: "#8B4513",
        overlayColor: "rgba(255, 255, 255, 0.85)",
      },
    };

    return baseStyles[rank as keyof typeof baseStyles] || {
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      shadow: "0 12px 24px rgba(102, 126, 234, 0.4)",
      emoji: "🏆",
      borderColor: "#667eea",
      titleColor: "#5a67d8",
      overlayColor: "rgba(255, 255, 255, 0.85)",
    };
  };

  const formatPrizeCategory = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const shouldShowRank = (category: string) => {
    const singleWinnerCategories = [
      "TOP_SCORER",
      "GOLDEN_BOOT",
      "BEST_PLAYER",
      "PLAYER_OF_TOURNAMENT",
      "TOP_ASSIST_PROVIDER",
      "BEST_GOALKEEPER",
      "BEST_DEFENDER",
      "FAIR_PLAY_AWARD",
      "YOUNG_PLAYER_AWARD",
      "CHAMPION",
    ];
    return !singleWinnerCategories.includes(category);
  };

  const rankStyle = getRankStyle(prize.positionRank);
  const showRank = shouldShowRank(prize.prizeCategory);

  return (
    <div
      className="prize-card-modern h-full overflow-hidden rounded-2xl border-[3px] bg-white transition dark:bg-gray-900"
      style={{ borderColor: rankStyle.borderColor, boxShadow: rankStyle.shadow }}
    >
      <div className="relative h-[200px] bg-cover bg-center transition-all" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="absolute inset-0 backdrop-blur-[2px]" style={{ background: rankStyle.overlayColor }} />

        <div className="relative flex h-full flex-col justify-between p-5">
          {showRank ? (
            <div className="flex justify-end">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white/30 text-lg font-bold text-white shadow-lg"
                style={{ background: rankStyle.gradient }}
              >
                #{prize.positionRank}
              </div>
            </div>
          ) : (
            <div className="h-0" />
          )}

          <div className="text-center">
            <div className="mb-3 text-6xl leading-none" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}>
              {rankStyle.emoji}
            </div>

            <h4 className="text-xl font-bold" style={{ color: rankStyle.titleColor, textShadow: "0 2px 4px rgba(255,255,255,0.8)" }}>
              {formatPrizeCategory(prize.prizeCategory)}
            </h4>

            <span
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-theme-xs font-semibold"
              style={{ background: "rgba(0,0,0,0.08)", color: rankStyle.titleColor, borderColor: rankStyle.borderColor }}
            >
              {prize.prizeType === PrizeType.TEAM ? <TeamOutlined /> : <UserOutlined />}
              {prize.prizeType}
            </span>
          </div>

          {hasImages && prize.imageLinks && prize.imageLinks.length > 1 ? (
            <div className="flex justify-center gap-1.5">
              {prize.imageLinks.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentImageIndex(index)}
                  className="h-2 w-2 rounded-full transition"
                  style={{ background: currentImageIndex === index ? rankStyle.borderColor : "rgba(0,0,0,0.2)" }}
                />
              ))}
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center dark:border-gray-800 dark:bg-white/[0.02]">
          {prize.prizeType === PrizeType.TEAM && prize.teamName && (
            <div className="flex flex-col items-center gap-2">
              <TeamOutlined className="text-2xl" style={{ color: rankStyle.titleColor }} />
              <span className="block text-lg font-semibold text-gray-800 dark:text-white/90">{prize.teamName}</span>
            </div>
          )}
          {prize.prizeType === PrizeType.PLAYER && prize.playerName && (
            <div className="flex flex-col items-center gap-2">
              <UserOutlined className="text-2xl" style={{ color: rankStyle.titleColor }} />
              <span className="block text-lg font-semibold text-gray-800 dark:text-white/90">{prize.playerName}</span>
              {prize.playerEmployeeId && <span className="text-theme-xs text-gray-400">ID: {prize.playerEmployeeId}</span>}
            </div>
          )}
        </div>

        {prize.prizeAmount && (
          <div className="relative mb-5 overflow-hidden rounded-2xl p-4 text-center" style={{ background: rankStyle.gradient, boxShadow: rankStyle.shadow }}>
            <DollarOutlined className="mr-2 text-2xl text-white" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }} />
            <span className="text-2xl font-bold text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
              ${prize.prizeAmount.toLocaleString()}
            </span>
          </div>
        )}

        {prize.description && (
          <>
            <div className="my-4 flex items-center gap-3 text-theme-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
              About
              <span className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            <p className="line-clamp-3 text-theme-sm leading-relaxed text-gray-500 dark:text-gray-400">{prize.description}</p>
          </>
        )}

        {hasImages && prize.imageLinks && (
          <>
            <div className="my-4 flex items-center gap-2 text-theme-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
              <StarFilled className="text-warning-400" /> Gallery ({prize.imageLinks.length})
              <span className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="grid grid-cols-3 gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
              {prize.imageLinks.map((link, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPreviewImage(link)}
                  className="gallery-item overflow-hidden rounded-xl border-2 transition"
                  style={{ borderColor: currentImageIndex === index ? rankStyle.borderColor : "#f0f0f0" }}
                >
                  <img src={link} alt={`Prize ${index + 1}`} className="h-[100px] w-full object-cover" />
                </button>
              ))}
            </div>
          </>
        )}

        {isAdmin && (
          <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="button" variant="outline" size="sm" startIcon={<EditOutlined />} onClick={() => onEdit?.(prize)} className="flex-1">
              Edit
            </Button>
            <Button type="button" variant="danger" size="sm" startIcon={<DeleteOutlined />} disabled={isDeleting} onClick={() => setConfirmDeleteOpen(true)} className="flex-1">
              Delete
            </Button>
          </div>
        )}
      </div>

      <style>
        {`
          .prize-card-modern:hover {
            transform: translateY(-8px) scale(1.02);
          }
          .gallery-item:hover {
            transform: scale(1.05);
          }
        `}
      </style>

      <Modal isOpen={previewImage !== null} onClose={() => setPreviewImage(null)} title="Prize Image" className="max-w-[600px]">
        {previewImage && <img src={previewImage} alt="Prize preview" className="w-full rounded-lg" />}
      </Modal>

      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete Prize"
        className="max-w-[420px]"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDeleteOpen(false)}>No</Button>
            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>Yes</Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete this prize?</p>
      </Modal>
    </div>
  );
}
