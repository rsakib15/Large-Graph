import { NodeConfig } from "@antv/g6";

export interface LargeGraphEdge {
  /**
   * ID
   */
  id?: string;
  /**
   * 起点ID
   */
  source: string;
  /**
   * 终点ID
   */
  target: string;
  /**
   * 文本
   */
  label?: string;
  /**
   * 值
   */
  value?: number;
}

export interface LargeGraphNode {
  /**
   * ID
   */
  id: string;
  /**
   * 文本
   */
  label?: string
}

export interface LargeGraphData {
  /**
   * 节点列表
   */
  nodes: LargeGraphNode[];
  /**
   * 连线列表
   */
  edges: LargeGraphEdge[];
}

export interface LargeGraphNodeStyle {
  /**
   * 文本颜色
   */
  textColor?: string;
  /**
   * 背景色
   */
  backgroundColor?: string;
  /**
   * 边框颜色
   */
  borderColor?: string;
  /**
   * 文本大小
   */
  textSize?: number;
}

export interface LargeGraphEdgeStyle {
  /**
   * 虚线
   */
  dashed?: string;
  /**
   * 颜色
   */
  color?: string;
}

export interface LargeGraphNode {
  /**
   * 样式
   */
  style?: LargeGraphNodeStyle // node style
}

export interface ILabelSytle {
  /**
   * 字体大小
   */
  fontSize?: number;
}

export interface NodeClickPayload {
  /**
   * ID
   */
  id: string;
}

export interface EdgeClickPayload {
  /**
   * ID
   */
  id: string;
  /**
   * 起点
   */
  source: NodeConfig;
  /**
   * 终点
   */
  target: NodeConfig;
  /**
   * 文本
   */
  label: string;
}
