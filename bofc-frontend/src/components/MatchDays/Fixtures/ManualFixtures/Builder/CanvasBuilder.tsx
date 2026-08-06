import React, { useState, useCallback } from "react";
import {
  Card,
  Space,
  Button,
  Tooltip,
  Typography,
  Empty,
  message,
} from "antd";
import {
  AppstoreOutlined,
  TeamOutlined,
  PlusOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const { Text } = Typography;

interface CanvasBuilderProps {
  matchDayId: number;
  teams: Array<{ teamId: number; teamName: string }>;
  onSave: (structure: any) => void;
}

interface CanvasItem {
  id: string;
  type: "round" | "group" | "team";
  data: any;
  position: { x: number; y: number };
}

export default function CanvasBuilder({
  matchDayId,
  teams,
  onSave,
}: CanvasBuilderProps) {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Toolbar items that can be dragged to canvas
  const toolbarItems = [
    {
      id: "toolbar-round",
      icon: <AppstoreOutlined style={{ fontSize: 24 }} />,
      label: "Round",
      type: "round",
      color: "#c6a15b",
    },
    {
      id: "toolbar-group",
      icon: <TeamOutlined style={{ fontSize: 24 }} />,
      label: "Group",
      type: "group",
      color: "#52c41a",
    },
  ];

  const handleDragStart = (item: any) => {
    setDraggedItem(item);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem) return;

    const canvas = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - canvas.left;
    const y = e.clientY - canvas.top;

    const newItem: CanvasItem = {
      id: `${draggedItem.type}-${Date.now()}`,
      type: draggedItem.type,
      data: {
        name: `New ${draggedItem.type}`,
        created: new Date().toISOString(),
      },
      position: { x, y },
    };

    setCanvasItems([...canvasItems, newItem]);
    setDraggedItem(null);
    message.success(`${draggedItem.type} added to canvas`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSave = () => {
    // Convert canvas items to matchDay structure
    onSave(canvasItems);
    message.success("MatchDay structure saved");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <Card
        style={{
          marginBottom: 16,
          borderBottom: "2px solid #f0f0f0",
        }}
      >
        <Space size={16} split={<span style={{ color: "#d9d9d9" }}>|</span>}>
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Drag to Canvas
            </Text>
            <Space size={12}>
              {toolbarItems.map((item) => (
                <Tooltip key={item.id} title={`Add ${item.label}`}>
                  <div
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    style={{
                      padding: "12px 16px",
                      background: item.color,
                      borderRadius: 8,
                      cursor: "grab",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      minWidth: 80,
                      color: "white",
                      userSelect: "none",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {item.icon}
                    <Text style={{ color: "white", fontSize: 12 }}>
                      {item.label}
                    </Text>
                  </div>
                </Tooltip>
              ))}
            </Space>
          </Space>

          <Space>
            <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
              Save Structure
            </Button>
            <Button icon={<UndoOutlined />} disabled>
              Undo
            </Button>
            <Button icon={<RedoOutlined />} disabled>
              Redo
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Canvas */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          flex: 1,
          background: "#fafafa",
          border: "2px dashed #d9d9d9",
          borderRadius: 8,
          position: "relative",
          minHeight: 600,
          backgroundImage:
            "radial-gradient(circle, #d9d9d9 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {canvasItems.length === 0 ? (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical">
                  <Text type="secondary">
                    Drag rounds and groups from the toolbar above
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Build your MatchDay structure visually
                  </Text>
                </Space>
              }
            />
          </div>
        ) : (
          canvasItems.map((item) => (
            <div
              key={item.id}
              style={{
                position: "absolute",
                left: item.position.x,
                top: item.position.y,
                padding: 16,
                background: "white",
                border: "2px solid #123524",
                borderRadius: 8,
                cursor: "move",
                minWidth: 150,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Space direction="vertical" size={4}>
                <Text strong>{item.data.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {item.type}
                </Text>
              </Space>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
