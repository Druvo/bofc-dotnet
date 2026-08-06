import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card, Space, Typography, Tag } from "antd";
import { UserOutlined, QuestionCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface TeamNodeData {
  teamName: string;
  isPlaceholder: boolean;
  placeholderName?: string;
  position?: number;
  points?: number;
  goalDifference?: number;
}

interface TeamNodeProps {
  data: TeamNodeData;
  selected?: boolean;
}

/**
 * TeamNode - Visual node for teams in React Flow
 */
function TeamNode({ data, selected }: TeamNodeProps) {
  const isPlaceholder = data.isPlaceholder;

  return (
    <>
      <Handle type="target" position={Position.Top} id="top" />
      <Card
        size="small"
        style={{
          width: 180,
          border: isPlaceholder
            ? selected
              ? "2px dashed #faad14"
              : "1px dashed #faad14"
            : selected
            ? "2px solid #c6a15b"
            : "1px solid #d9d9d9",
          borderRadius: 6,
          boxShadow: selected ? "0 3px 10px rgba(198, 161, 91, 0.35)" : "0 1px 4px rgba(0,0,0,0.1)",
          cursor: "pointer",
          backgroundColor: isPlaceholder ? "#fffbe6" : "#ffffff",
        }}
        bodyStyle={{ padding: "8px" }}
      >
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          {/* Team Name */}
          <Space size={4}>
            {isPlaceholder ? (
              <QuestionCircleOutlined style={{ color: "#faad14" }} />
            ) : (
              <UserOutlined style={{ color: "#c6a15b" }} />
            )}
            <Text
              strong={!isPlaceholder}
              italic={isPlaceholder}
              style={{
                fontSize: 12,
                color: isPlaceholder ? "#8c8c8c" : "#000",
              }}
              ellipsis={{ tooltip: true }}
            >
              {isPlaceholder ? data.placeholderName || "TBD" : data.teamName}
            </Text>
          </Space>

          {/* Stats (if available) */}
          {!isPlaceholder && (data.position !== undefined || data.points !== undefined) && (
            <Space size={4} wrap>
              {data.position !== undefined && (
                <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                  #{data.position}
                </Tag>
              )}
              {data.points !== undefined && (
                <Tag color="green" style={{ fontSize: 10, margin: 0 }}>
                  {data.points} pts
                </Tag>
              )}
              {data.goalDifference !== undefined && (
                <Tag
                  color={data.goalDifference >= 0 ? "green" : "red"}
                  style={{ fontSize: 10, margin: 0 }}
                >
                  GD: {data.goalDifference >= 0 ? "+" : ""}
                  {data.goalDifference}
                </Tag>
              )}
            </Space>
          )}

          {isPlaceholder && (
            <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>
              To Be Determined
            </Tag>
          )}
        </Space>
      </Card>
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </>
  );
}

export default memo(TeamNode);
