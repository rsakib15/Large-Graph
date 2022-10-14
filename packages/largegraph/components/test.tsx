import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator';
import G6, { Graph, INode, LayoutConfig } from '@antv/g6';
import { GForceLayout } from '@antv/layout';
import insertCss from 'insert-css';
import Axios from 'axios';
import louvain from '@antv/algorithm/lib/louvain';
import { Item, ModelConfig } from '@antv/g6-core/lib/types';
import { ClusterData } from '@antv/algorithm/lib/types';
import { LargeGraphData, LargeGraphEdge, LargeGraphNode } from '../interfaces';
import {
  colorSets,
  DEFAULTAGGREGATEDNODESIZE,
  DEFAULTNODESIZE,
  GLOBAL,
  NODESIZEMAPPING,
  SMALLGRAPHLABELMAXLENGTH,
} from '../consts';
import { uniqueId } from '../utils';
import './real-node';
import './aggregated-node';

insertCss(`
  .g6-component-contextmenu {
    position: absolute;
    z-index: 2;
    list-style-type: none;
    background-color: #363b40;
    border-radius: 6px;
    font-size: 14px;
    color: hsla(0,0%,100%,.85);
    width: fit-content;
    transition: opacity .2s;
    text-align: center;
    padding: 0px 20px 0px 20px;
		box-shadow: 0 5px 18px 0 rgba(0, 0, 0, 0.6);
		border: 0px;
  }
  .g6-component-contextmenu ul {
		padding-left: 0px;
		margin: 0;
  }
  .g6-component-contextmenu li {
    cursor: pointer;
    list-style-type: none;
    list-style: none;
    margin-left: 0;
    line-height: 38px;
  }
  .g6-component-contextmenu li:hover {
    color: #aaaaaa;
	}
`);

@Component
export default class LargeGraph extends Vue {
  /*
  Interface for the data of the graph. The data should be an object with the following properties:
  nodes: an array of nodes, each node should have an id property.
  "nodes": [
    {
      "id": "Myriel"
    },
    {
      "id": "Napoleon"
    },
    ...
  ]
  edges: an array of edges, each edge should have a source, target and value property.
  "edges": [
    {
      "source": "Napoleon",
      "target": "Myriel"
      "value": 1
    },
    {
      "source": "Mlle.Baptistine",
      "target": "Myriel"
      "value": 8
    },
    ...
  ]
  */

  @Prop({
    default: {
      edges: [],
      nodes: [],
    },
  })
  private data: LargeGraphData;
  /**
   * Width of graph
   *
   * @private
   * @type {number}
   * @memberof LargeGraph
   */
  @Prop({ default: 800 }) private width: number;
  /**
   * Height of graph
   *
   * @private
   * @type {number}
   * @memberof LargeGraph
   */
  @Prop({ default: 600 }) private height: number;
  /**
   * Auto fit the graph container
   *
   * @private
   * @type {boolean}
   * @memberof LargeGraph
   */
  @Prop({ default: false }) private autoFit: boolean;
  @Prop({ default: {} }) private changelargeGraphNode: LargeGraphNode;
  @Prop({ default: {} }) private changelargeGraphEdge: LargeGraphEdge;
  @Prop({ default: 1 }) private expandLevel: number;

  private labelMaxLength = SMALLGRAPHLABELMAXLENGTH;
  private hiddenItemIds = [];
  @Ref('container')
  private container: HTMLElement;

  /**
   * Non-responsive datas
   *
   * @private
   * @memberof LargeGraph
   */
  private global;
  private canvasWidth: number;
  private canvasHeight: number;
  private manipulatePosition?: { x: number; y: number };
  private graph: Graph;
  private cachePositions: {};
  private nodeMap;
  private largeGraphMode: boolean;
  private aggregatedData;
  private clusteredData;
  private aggregatedNodeMap;
  private layout: {
    type: string;
    instance: GForceLayout | null;
    destroyed: true;
  };
  private currentUnproccessedData: LargeGraphData;

  @Watch('data', { deep: true })
  watchData() {
    this.freshData();
    this.handleRefreshGraph(this.currentUnproccessedData);
  }

  @Watch('autoFit', { deep: true })
  watchAutoFit() {
    this.handleResize();
  }

  @Watch('width')
  watchWidth() {
    this.handleResize();
  }

  @Watch('height')
  watchHeight() {
    this.handleResize();
  }

  handleNodeClick(item: { getModel: () => any; getEdges: () => any[] }) {
    const req_data = {
      model: item.getModel(),
      edges: item.getEdges().map((edge) => edge.getModel()),
    };
    Axios.post('/index.php/node', {
      data: req_data,
    })
      .then(function(response) {
        console.log(response);
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  created() {
    this.global = GLOBAL;
    this.layout = {
      type: '',
      instance: null,
      destroyed: true,
    };
    this.largeGraphMode = true;
  }

  mounted() {
    console.log(this.changelargeGraphNode);
    console.log('changelargeGraphNode', this.changelargeGraphNode.style);
    const DEFAULTNODESIZE = 20;
    const NODE_LIMIT = 20; // TODO: find a proper number for maximum node number on the canvas

    let graph: Graph;
    this.currentUnproccessedData = { nodes: [], edges: [] };
    this.nodeMap = {};
    this.aggregatedNodeMap = {};
    this.cachePositions = {};
    this.manipulatePosition = undefined;

    let expandArray = [];
    let collapseArray = [];
    let shiftKeydown = false;

    const handleNodeChange = (node: Item) => {
      const model = node.getModel();
      let colorset = model.colorSet;

      colorset['mainFill'] = this.changelargeGraphNode.style.backgroundColor || '#fff';
      colorset['mainStroke'] = this.changelargeGraphNode.style.borderColor || '#fff';

      node.update({
        colorSet: colorset,
        oriFontlableSize: model.oriFontSize,
      });
      node.toFront();
    };

    const handleEdgeChange = (edge: Item) => {
      const new_source_node = graph.findById(this.changelargeGraphEdge.source);
      const new_target_node = graph.findById(this.changelargeGraphEdge.target);
      edge.update({
        source: new_source_node,
        target: new_target_node,
        sourceNode: new_source_node,
        targetNode: new_target_node,
        visible: false,
        model: {
          ...edge.getModel(),
          source: new_source_node.get('id'),
          target: new_target_node.get('id'),
        },
        style: {
          ...edge.getModel().style,
          stroke: '#fff',
        },
      });
      edge.toFront();

      this.handleRefreshGraph(this.currentUnproccessedData);
    };

    const showItems = (graph: Graph) => {
      graph.getNodes().forEach((node) => {
        if (!node.isVisible()) graph.showItem(node);
      });
      graph.getEdges().forEach((edge) => {
        if (!edge.isVisible()) graph.showItem(edge);
      });
      this.hiddenItemIds = [];
    };

    const nodeExpand = (clusteredData: ClusterData) => {
      const nodes: INode[] = graph.getNodes();
      const graph_length: number = graph.getNodes().length;
      let mixedGraphData: { nodes: any; edges: any };

      nodes.forEach((item) => {
        const model = item.getModel();
        const newArray = manageExpandCollapseArray(graph_length, model, collapseArray, expandArray);

        expandArray = newArray.expandArray;
        collapseArray = newArray.collapseArray;
      });

      mixedGraphData = getMixedGraph(
        clusteredData,
        this.data,
        this.nodeMap,
        this.aggregatedNodeMap,
        expandArray,
        collapseArray,
      );
      if (mixedGraphData) {
        this.cachePositions = this.cacheNodePositions();
        this.currentUnproccessedData = mixedGraphData;
        this.handleRefreshGraph(this.currentUnproccessedData);
      }
    };

    const expandNeighbor = (clusteredData: ClusterData) => {
      const nodes: INode[] = graph.getNodes();
      const expandNeighborSteps = this.expandLevel - 1;
      let mixedGraphData: { nodes: any; edges: any };

      if (expandNeighborSteps > 0) {
        nodes.forEach((item) => {
          const model = item.getModel();
          mixedGraphData = getNeighborMixedGraph(
            model,
            expandNeighborSteps,
            this.data,
            clusteredData,
            this.currentUnproccessedData,
            this.nodeMap,
            this.aggregatedNodeMap,
            10,
          );
          if (mixedGraphData) {
            this.cachePositions = this.cacheNodePositions();
            this.currentUnproccessedData = mixedGraphData;
            this.handleRefreshGraph(this.currentUnproccessedData);
          }
        });
      }
    };

    const getMixedGraph = (
      aggregatedData: ClusterData,
      originData: LargeGraphData,
      nodeMap: { [x: string]: { clusterId: any } },
      aggregatedNodeMap: { [x: string]: { expanded: boolean } },
      expandArray: any[],
      collapseArray: any[],
    ) => {
      let nodes = [],
        edges = [];
      const expandMap = {},
        collapseMap = {};

      expandArray.forEach((expandModel: { id: string | number }) => {
        expandMap[expandModel.id] = true;
      });
      collapseArray.forEach((collapseModel) => {
        collapseMap[collapseModel.id] = true;
      });

      aggregatedData.clusters.forEach((cluster: { id: string | number; nodes: any }) => {
        if (expandMap[cluster.id]) {
          nodes = nodes.concat(cluster.nodes);
          aggregatedNodeMap[cluster.id].expanded = true;
        } else {
          nodes.push(aggregatedNodeMap[cluster.id]);
          aggregatedNodeMap[cluster.id].expanded = false;
        }
      });
      originData.edges.forEach((edge: { source: string | number; target: string | number }) => {
        const isSourceInExpandArray = expandMap[nodeMap[edge.source].clusterId];
        const isTargetInExpandArray = expandMap[nodeMap[edge.target].clusterId];
        if (isSourceInExpandArray && isTargetInExpandArray) {
          edges.push(edge);
        } else if (isSourceInExpandArray) {
          const targetClusterId = nodeMap[edge.target].clusterId;
          const vedge = {
            source: edge.source,
            target: targetClusterId,
            id: `edge-${uniqueId()}`,
            label: '',
          };
          edges.push(vedge);
        } else if (isTargetInExpandArray) {
          const sourceClusterId = nodeMap[edge.source].clusterId;
          const vedge = {
            target: edge.target,
            source: sourceClusterId,
            id: `edge-${uniqueId()}`,
            label: '',
          };
          edges.push(vedge);
        }
      });
      aggregatedData.clusterEdges.forEach((edge: { source: string | number; target: string | number }) => {
        if (expandMap[edge.source] || expandMap[edge.target]) return;
        else edges.push(edge);
      });
      return { nodes, edges };
    };

    const getNeighborMixedGraph = (
      centerNodeModel: any,
      step: number,
      originData: LargeGraphData,
      clusteredData: ClusterData,
      currentData: { nodes: any; edges: any },
      nodeMap: { [x: string]: any },
      aggregatedNodeMap: { [x: string]: { count: number } },
      maxNeighborNumPerNode = 5,
    ) => {
      // update the manipulate position for center gravity of the new nodes

      this.manipulatePosition = { x: centerNodeModel.x, y: centerNodeModel.y };

      // the neighborSubGraph does not include the centerNodeModel. the elements are all generated new nodes and edges
      const neighborSubGraph = generateNeighbors(centerNodeModel, step, maxNeighborNumPerNode);
      // update the origin data
      originData.nodes = originData.nodes.concat(neighborSubGraph.nodes);
      originData.edges = originData.edges.concat(neighborSubGraph.edges);
      // update the origin nodeMap
      neighborSubGraph.nodes.forEach((node) => {
        nodeMap[node.id] = node;
      });
      // update the clusteredData
      const clusterId = centerNodeModel.clusterId;
      clusteredData.clusters.forEach((cluster) => {
        if (cluster.id !== clusterId) return;
        cluster.nodes = cluster.nodes.concat(neighborSubGraph.nodes);
        cluster.sumTot += neighborSubGraph.edges.length;
      });
      // update the count
      aggregatedNodeMap[clusterId].count += neighborSubGraph.nodes.length;

      currentData.nodes = currentData.nodes.concat(neighborSubGraph.nodes);
      currentData.edges = currentData.edges.concat(neighborSubGraph.edges);
      return currentData;
    };

    const generateNeighbors = (
      centerNodeModel: { id: any; clusterId: any; level?: number; colorSet: any },
      step: number,
      maxNeighborNumPerNode = 5,
    ) => {
      if (step <= 0) return undefined;
      let nodes = [],
        edges = [];
      const clusterId = centerNodeModel.clusterId;
      const centerId = centerNodeModel.id;
      const neighborNum = Math.ceil(Math.random() * maxNeighborNumPerNode);
      for (let i = 0; i < neighborNum; i++) {
        const neighborNode = {
          id: uniqueId(),
          clusterId,
          level: 0,
          colorSet: centerNodeModel.colorSet,
        };
        nodes.push(neighborNode);
        const dire = Math.random() > 0.5;
        const source = dire ? centerId : neighborNode.id;
        const target = dire ? neighborNode.id : centerId;
        const neighborEdge = {
          id: uniqueId(),
          source,
          target,
          label: `${source}-${target}`,
        };
        edges.push(neighborEdge);
        const subNeighbors = generateNeighbors(neighborNode, step - 1, maxNeighborNumPerNode);
        if (subNeighbors) {
          nodes = nodes.concat(subNeighbors.nodes);
          edges = edges.concat(subNeighbors.edges);
        }
      }
      return { nodes, edges };
    };

    const examAncestors = (model: { parentId: any }, expandedArray: any[], length: number, keepTags: boolean[]) => {
      for (let i = 0; i < length; i++) {
        const expandedNode = expandedArray[i];
        if (!keepTags[i] && model.parentId === expandedNode.id) {
          keepTags[i] = true; // 需要被保留
          examAncestors(expandedNode, expandedArray, length, keepTags);
          break;
        }
      }
    };

    const manageExpandCollapseArray = (nodeNumber: number, model: any, collapseArray: any[], expandArray: any[]) => {
      this.manipulatePosition = { x: model.x, y: model.y };

      // 维护 expandArray，若当前画布节点数高于上限，移出 expandedArray 中非 model 祖先的节点)
      if (nodeNumber > NODE_LIMIT) {
        // 若 keepTags[i] 为 true，则 expandedArray 的第 i 个节点需要被保留
        const keepTags = new Array(expandArray.length).fill(false);
        const expandLen = expandArray.length;
        // 检查 X 的所有祖先并标记 keepTags
        examAncestors(model, expandArray, expandLen, keepTags);
        // 寻找 expandedArray 中第一个 keepTags 不为 true 的点
        let shiftNodeIdx = -1;
        for (let i = 0; i < expandLen; i++) {
          if (!keepTags[i]) {
            shiftNodeIdx = i;
            break;
          }
        }
        // 如果有符合条件的节点，将其从 expandedArray 中移除
        if (shiftNodeIdx !== -1) {
          let foundNode = expandArray[shiftNodeIdx];
          if (foundNode.level === 2) {
            let foundLevel1 = false;
            // 找到 expandedArray 中 parentId = foundNode.id 且 level = 1 的第一个节点
            for (let i = 0; i < expandLen; i++) {
              const eNode = expandArray[i];
              if (eNode.parentId === foundNode.id && eNode.level === 1) {
                foundLevel1 = true;
                foundNode = eNode;
                expandArray.splice(i, 1);
                break;
              }
            }
            // 若未找到，则 foundNode 不变, 直接删去 foundNode
            if (!foundLevel1) expandArray.splice(shiftNodeIdx, 1);
          } else {
            // 直接删去 foundNode
            expandArray.splice(shiftNodeIdx, 1);
          }
          // const removedNode = expandedArray.splice(shiftNodeIdx, 1); // splice returns an array
          const idSplits = foundNode.id.split('-');
          let collapseNodeId: string;
          // 去掉最后一个后缀
          for (let i = 0; i < idSplits.length - 1; i++) {
            const str = idSplits[i];
            if (collapseNodeId) collapseNodeId = `${collapseNodeId}-${str}`;
            else collapseNodeId = str;
          }
          const collapseNode = {
            id: collapseNodeId,
            parentId: foundNode.id,
            level: foundNode.level - 1,
          };
          collapseArray.push(collapseNode);
        }
      }

      const currentNode = {
        id: model.id,
        level: model.level,
        parentId: model.parentId,
      };

      // 加入当前需要展开的节点
      expandArray.push(currentNode);

      graph.get('canvas').setCursor('default');
      return { expandArray, collapseArray };
    };

    const stopLayout = () => {
      if (this.layout.instance) {
        this.layout.instance.stop();
      }
    };

    const getLocale = (s) => {
      return this.$l(s);
    };

    const bindListener = (graph: any) => {
      graph.on('keydown', (evt: { key: any }) => {
        const code = evt.key;
        if (!code) {
          return;
        }
        if (code.toLowerCase() === 'shift') {
          shiftKeydown = true;
        } else {
          shiftKeydown = false;
        }
      });
      graph.on('keyup', (evt: { key: any }) => {
        const code = evt.key;
        if (!code) {
          return;
        }
        if (code.toLowerCase() === 'shift') {
          shiftKeydown = false;
        }
      });
      graph.on('node:mouseenter', (evt: { item: any }) => {
        const { item } = evt;
        const model = item.getModel();
        const currentLabel = model.label;
        model.oriFontSize = model.labelCfg.style.fontSize;
        item.update({
          label: model.oriLabel,
        });
        model.oriLabel = currentLabel;
        graph.setItemState(item, 'hover', true);
        item.toFront();
      });

      graph.on('node:mouseleave', (evt: { item: any }) => {
        const { item } = evt;
        const model = item.getModel();
        const currentLabel = model.label;
        item.update({
          label: model.oriLabel,
        });
        model.oriLabel = currentLabel;
        graph.setItemState(item, 'hover', false);
      });

      graph.on('edge:mouseenter', (evt: { item: any }) => {
        const { item } = evt;
        const model = item.getModel();
        const currentLabel = model.label;
        item.update({
          label: model.oriLabel,
        });
        model.oriLabel = currentLabel;
        item.toFront();
        item.getSource().toFront();
        item.getTarget().toFront();
      });

      graph.on('edge:mouseleave', (evt: { item: any }) => {
        const { item } = evt;
        const model = item.getModel();
        const currentLabel = model.label;
        item.update({
          label: model.oriLabel,
        });
        model.oriLabel = currentLabel;
      });
      // click node to show the detail drawer
      graph.on('node:click', (evt: { item: any }) => {
        stopLayout();
        if (!shiftKeydown) this.clearFocusItemState();
        else this.clearFocusEdgeState();
        const { item } = evt;

        // highlight the clicked node, it is down by click-select
        graph.setItemState(item, 'focus', true);

        // When nodes or edges are clicked should emit an `click` event and payload should include current node or edge.
        this.handleNodeClick(item);

        if (!shiftKeydown) {
          // 将相关边也高亮
          const relatedEdges = item.getEdges();
          relatedEdges.forEach((edge: any) => {
            graph.setItemState(edge, 'focus', true);
          });
        }
      });

      // click edge to show the detail of integrated edge drawer
      graph.on('edge:click', (evt: { item: any }) => {
        stopLayout();
        if (!shiftKeydown) this.clearFocusItemState();
        const { item } = evt;
        // highlight the clicked edge
        graph.setItemState(item, 'focus', true);
      });

      // click canvas to cancel all the focus state
      graph.on('canvas:click', () => {
        this.clearFocusItemState();
      });
    };

    if (this.data) {
      this.nodeMap = {};
      this.freshData();
      const { edges: processedEdges } = this.processNodesEdges(
        this.currentUnproccessedData.nodes,
        this.currentUnproccessedData.edges,
        true,
        true,
      );

      const contextMenu = new G6.Menu({
        shouldBegin(evt) {
          if (evt.target && evt.target.isCanvas && evt.target.isCanvas()) return true;
          if (evt.item) return true;
          return false;
        },
        getContent(evt) {
          const { item } = evt;
          if (evt.target && evt.target.isCanvas && evt.target.isCanvas()) {
            return `<ul>
          <li id='show'>Show all Hidden Items</li>
          <li id='collapseAll'>Collapse all Clusters</li>
        </ul>`;
          } else if (!item) return;
          const itemType = item.getType();
          const model = item.getModel();
          if (itemType && model) {
            if (itemType === 'node') {
              if (model.level !== 0) {
                const menu = [
                  { id: 'expand', text: 'expandTheCluster' },
                  { id: 'hide', text: 'hidethenode' },
                  { id: 'changeNodeColor', text: 'changenodecolor' },
                ];
                const divElement = document.createElement('div');
                const ulElement = document.createElement('ul');
                menu.forEach((item) => {
                  const liElement = document.createElement('li');
                  liElement.textContent = getLocale(item.text);
                  liElement.setAttribute('id', item.id);
                  ulElement.appendChild(liElement);
                });
                divElement.appendChild(ulElement);
                return divElement;
              } else {
                return `<ul>
              <li id='collapse'>Collapse the Cluster</li>
              <li id='neighbor-1'>Find 1-degree Neighbors</li>
              <li id='neighbor-2'>Find 2-degree Neighbors</li>
              <li id='neighbor-3'>Find 3-degree Neighbors</li>
              <li id='hide'>Hide the Node</li>
            </ul> `;
              }
            } else {
              return `<ul>
            <li id='hide'>Hide the Edge</li>
            <li id='changeEdgeColor'>Change Edge Source & Target</li>
          </ul> `;
            }
          }
        },
        handleMenuClick: (target, item) => {
          const model: ModelConfig = item && item.getModel();
          const liIdStrs = target.id.split('-');
          let mixedGraphData: { nodes: any; edges: any };
          switch (liIdStrs[0]) {
            case 'hide':
              graph.hideItem(item);
              this.hiddenItemIds.push(model.id);
              break;
            case 'expand':
              const newArray = manageExpandCollapseArray(graph.getNodes().length, model, collapseArray, expandArray);
              expandArray = newArray.expandArray;
              collapseArray = newArray.collapseArray;
              mixedGraphData = getMixedGraph(
                this.clusteredData,
                this.data,
                this.nodeMap,
                this.aggregatedNodeMap,
                expandArray,
                collapseArray,
              );
              break;
            case 'collapse':
              const m = model as any;
              const aggregatedNode = this.aggregatedNodeMap[m.clusterId];
              this.manipulatePosition = { x: aggregatedNode.x, y: aggregatedNode.y };
              collapseArray.push(aggregatedNode);
              for (let i = 0; i < expandArray.length; i++) {
                if (expandArray[i].id === model.clusterId) {
                  expandArray.splice(i, 1);
                  break;
                }
              }
              mixedGraphData = getMixedGraph(
                this.clusteredData,
                this.data,
                this.nodeMap,
                this.aggregatedNodeMap,
                expandArray,
                collapseArray,
              );
              break;
            case 'changeNodeColor':
              handleNodeChange(item);
              break;
            case 'changeEdgeColor':
              handleEdgeChange(item);
              break;
            case 'collapseAll':
              expandArray = [];
              collapseArray = [];
              mixedGraphData = getMixedGraph(
                this.clusteredData,
                this.data,
                this.nodeMap,
                this.aggregatedNodeMap,
                expandArray,
                collapseArray,
              );
              break;
            case 'neighbor':
              const expandNeighborSteps = parseInt(liIdStrs[1]);
              mixedGraphData = getNeighborMixedGraph(
                model,
                expandNeighborSteps,
                this.data,
                this.clusteredData,
                this.currentUnproccessedData,
                this.nodeMap,
                this.aggregatedNodeMap,
                10,
              );
              break;
            case 'show':
              showItems(graph);
              break;
            default:
              break;
          }
          if (mixedGraphData) {
            this.cachePositions = this.cacheNodePositions();
            this.currentUnproccessedData = mixedGraphData;
            this.handleRefreshGraph(this.currentUnproccessedData);
          }
        },
        // offsetX and offsetY include the padding of the parent container
        // 需要加上父级容器的 padding-left 16 与自身偏移量 10
        offsetX: 16 + 10,
        // 需要加上父级容器的 padding-top 24 、画布兄弟元素高度、与自身偏移量 10
        offsetY: 0,
        // the types of items that allow the menu show up
        // 在哪些类型的元素上响应
        itemTypes: ['node', 'edge', 'canvas'],
      });

      this.setCanvasSize();
      graph = new Graph({
        container: this.container,
        width: this.canvasWidth,
        height: this.canvasHeight,
        linkCenter: true,
        minZoom: 0.1,
        groupByTypes: false,
        modes: {
          default: [
            {
              type: 'drag-canvas',
              enableOptimize: true,
            },
            {
              type: 'zoom-canvas',
              enableOptimize: true,
              optimizeZoom: 0.01,
            },
            'drag-node',
            'shortcuts-call',
          ],
          lassoSelect: [
            {
              type: 'zoom-canvas',
              enableOptimize: true,
              optimizeZoom: 0.01,
            },
            {
              type: 'lasso-select',
              selectedState: 'focus',
              trigger: 'drag',
            },
          ],
          fisheyeMode: [],
        },
        defaultNode: {
          type: 'aggregated-node',
          size: DEFAULTNODESIZE,
        },
        plugins: [contextMenu],
      });
      this.graph = graph;

      graph.get('canvas').set('localRefresh', false);
      const config = { preventOverlap: true };

      const layoutConfig: LayoutConfig = this.getForceLayoutConfig(graph, config);
      layoutConfig.center = [this.canvasWidth / 2, this.canvasHeight / 2];
      this.layout.instance = new G6.Layout['gForce'](layoutConfig);
      this.layout.instance.init({
        nodes: this.currentUnproccessedData.nodes,
        edges: processedEdges,
      });
      this.layout.instance.execute();

      bindListener(graph);
      graph.data({ nodes: this.aggregatedData.nodes, edges: processedEdges });
      graph.render();

      if (graph) {
        nodeExpand(this.clusteredData);
        expandNeighbor(this.clusteredData);
      }
    }

    if (typeof window !== 'undefined') {
      window.onresize = () => {
        if (!graph || graph.get('destroyed')) return;
        const container = document.getElementById('container');
        if (!container) return;
        graph.changeSize(container.scrollWidth, container.scrollHeight - 30);
      };
    }
  }

  private freshData() {
    this.getClusteredData();
    this.getAggregatedData();
    this.data.edges.forEach((edge) => {
      edge.label = `${edge.source}-${edge.target}`;
      edge.id = `edge-${uniqueId()}`;
    });
    this.currentUnproccessedData = this.aggregatedData;
  }

  private getClusteredData() {
    this.clusteredData = louvain(this.data, false, 'weight');
  }

  private getAggregatedData() {
    const aggregatedData = { nodes: [], edges: [] };

    this.clusteredData.clusters.forEach((cluster, i) => {
      cluster.nodes.forEach((node) => {
        node.level = 0;
        node.label = node.id;
        node.type = '';
        node.colorSet = colorSets[i];
        this.nodeMap[node.id] = node;
      });
      const cnode = {
        id: cluster.id,
        type: 'aggregated-node',
        count: cluster.nodes.length,
        level: 1,
        label: cluster.id,
        colorSet: colorSets[i],
        idx: i,
      };
      this.aggregatedNodeMap[cluster.id] = cnode;
      aggregatedData.nodes.push(cnode);
    });

    this.clusteredData.clusterEdges.forEach((clusterEdge) => {
      const cedge = {
        id: `edge-${uniqueId()}`,
        source: clusterEdge.source,
        target: clusterEdge.target,
        size: Math.log(clusterEdge.count),
        label: '',
        type: clusterEdge.target,
        loopCfg: clusterEdge.loopCfg,
        ...clusterEdge,
      };
      if (cedge.source === cedge.target) {
        cedge.type = 'loop';
        cedge.loopCfg = {
          dist: 20,
        };
      } else {
        cedge.type = 'line';
      }
      aggregatedData.edges.push(cedge);
    });
    this.aggregatedData = aggregatedData;
  }

  private handleRefreshGraph(
    graphData: { nodes: any; edges: any },
    options?: {
      edgeLabelVisible?: boolean;
      isNewGraph?: boolean;
      changeSize?: boolean;
    },
  ) {
    const handleOptions = options || {};
    const edgeLabelVisible = handleOptions.edgeLabelVisible || true;
    const isNewGraph = handleOptions.edgeLabelVisible || false;
    const changeSize = handleOptions.changeSize || false;

    const graph = this.graph;
    if (!graph) {
      return;
    }

    if (changeSize) {
      this.graph.changeSize(this.canvasWidth, this.canvasHeight);
      this.layout.instance.center = [this.canvasWidth / 2, this.canvasHeight / 2];
    }

    if (!graphData) return;
    this.clearFocusItemState();
    // reset the filtering
    graph.getNodes().forEach((node: { isVisible: () => any; show: () => void }) => {
      if (!node.isVisible()) node.show();
    });
    graph.getEdges().forEach((edge: { isVisible: () => any; show: () => void }) => {
      if (!edge.isVisible()) edge.show();
    });

    let nodes = [],
      edges = [];

    nodes = graphData.nodes;
    const processRes = this.processNodesEdges(nodes, graphData.edges || [], edgeLabelVisible, isNewGraph);

    edges = processRes.edges;

    graph.changeData({ nodes, edges });

    this.hideItems();
    graph.getNodes().forEach((node: { toFront: () => void }) => {
      node.toFront();
    });

    // layout.instance.stop();
    // force 需要使用不同 id 的对象才能进行全新的布局，否则会使用原来的引用。因此复制一份节点和边作为 force 的布局数据
    this.layout.instance.init({
      nodes: graphData.nodes,
      edges,
    });

    this.layout.instance.minMovement = 0.0001;
    // layout.instance.getCenter = d => {
    //   const cachePosition = cachePositions[d.id];
    //   if (!cachePosition && (d.x || d.y)) return [d.x, d.y, 10];
    //   else if (cachePosition) return [cachePosition.x, cachePosition.y, 10];
    //   return [width / 2, height / 2, 10];
    // }
    this.layout.instance.getMass = (d: { id: string | number }) => {
      const cachePosition = this.cachePositions[d.id];
      if (cachePosition) return 5;
      return 1;
    };
    this.layout.instance.execute();
    return { nodes, edges };
  }

  private getForceLayoutConfig(graph: any, configSettings: any) {
    let {
      linkDistance,
      edgeStrength,
      nodeStrength,
      nodeSpacing,
      preventOverlap,
      nodeSize,
      collideStrength,
      alpha,
      alphaDecay,
      alphaMin,
    } = configSettings || { preventOverlap: true };

    if (!linkDistance && linkDistance !== 0) linkDistance = 225;
    if (!edgeStrength && edgeStrength !== 0) edgeStrength = 50;
    if (!nodeStrength && nodeStrength !== 0) nodeStrength = 200;
    if (!nodeSpacing && nodeSpacing !== 0) nodeSpacing = 5;

    const config = {
      type: 'gForce',
      minMovement: 0.01,
      maxIteration: 5000,
      preventOverlap,
      damping: 0.99,
      linkDistance: (d: { source: string | number; target: string | number }) => {
        let dist = linkDistance;
        const sourceNode = this.nodeMap[d.source] || this.aggregatedNodeMap[d.source];
        const targetNode = this.nodeMap[d.target] || this.aggregatedNodeMap[d.target];
        // // 两端都是聚合点
        if (sourceNode.level && targetNode.level) dist = linkDistance * 3;
        // 一端是聚合点，一端是真实节点
        else if (sourceNode.level || targetNode.level) dist = linkDistance * 1.5;
        if (!sourceNode.level && !targetNode.level) dist = linkDistance * 0.3;
        return dist;
      },
      edgeStrength: (d: { source: string | number; target: string | number }) => {
        const sourceNode = this.nodeMap[d.source] || this.aggregatedNodeMap[d.source];
        const targetNode = this.nodeMap[d.target] || this.aggregatedNodeMap[d.target];
        // 聚合节点之间的引力小
        if (sourceNode.level && targetNode.level) return edgeStrength / 2;
        // 聚合节点与真实节点之间引力大
        if (sourceNode.level || targetNode.level) return edgeStrength;
        return edgeStrength;
      },
      nodeStrength: (d: { degree: number; level: any }) => {
        // 给离散点引力，让它们聚集
        if (d.degree === 0) return -10;
        // 聚合点的斥力大
        if (d.level) return nodeStrength * 2;
        return nodeStrength;
      },
      nodeSize: (d: { size: any }) => {
        if (!nodeSize && d.size) return d.size;
        return 50;
      },
      nodeSpacing: (d: { degree: number; level: any }) => {
        if (d.degree === 0) return nodeSpacing * 2;
        if (d.level) return nodeSpacing;
        return nodeSpacing;
      },
      onLayoutEnd: () => {
        if (this.largeGraphMode) {
          graph.getEdges().forEach((edge: { oriLabel: any; update: (arg0: { label: any }) => void }) => {
            if (!edge.oriLabel) return;
            edge.update({
              label: this.labelFormatter(edge.oriLabel, this.labelMaxLength),
            });
          });
        }
      },
      tick: () => {
        graph.refreshPositions();
      },
    };

    if (nodeSize) config['nodeSize'] = nodeSize;
    if (collideStrength) config['collideStrength'] = collideStrength;
    if (alpha) config['alpha'] = alpha;
    if (alphaDecay) config['alphaDecay'] = alphaDecay;
    if (alphaMin) config['alphaMin'] = alphaMin;

    return config;
  }

  private processNodesEdges(nodes: any[], edges: any[], edgeLabelVisible: boolean, isNewGraph = false) {
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    if (!nodes || nodes.length === 0) return {};
    let descreteNodeCenter: { x: any; y: any };
    const currentNodeMap = {};
    const paddingRatio = 0.3;
    const paddingLeft = paddingRatio * width;
    const paddingTop = paddingRatio * height;
    let maxNodeCount = -Infinity;

    nodes.forEach((node) => {
      node.type = node.level === 0 ? 'real-node' : 'aggregated-node';
      node.isReal = node.level === 0 ? true : false;
      node.label = `${node.id}`;
      node.labelLineNum = undefined;
      node.oriLabel = node.label;
      node.label = this.formatText(node.label, this.labelMaxLength, '...');
      node.degree = 0;
      node.inDegree = 0;
      node.outDegree = 0;

      if (currentNodeMap[node.id]) {
        console.warn('node exists already!', node.id);
        node.id = `${node.id}${Math.random()}`;
      }
      currentNodeMap[node.id] = node;
      if (node.count > maxNodeCount) maxNodeCount = node.count;
      const cachePosition = this.cachePositions ? this.cachePositions[node.id] : undefined;
      if (cachePosition) {
        node.x = cachePosition.x;
        node.y = cachePosition.y;
        node.new = false;
      } else {
        node.new = isNewGraph ? false : true;
        if (this.manipulatePosition && !node.x && !node.y) {
          node.x = this.manipulatePosition.x + 30 * Math.cos(Math.random() * Math.PI * 2);
          node.y = this.manipulatePosition.y + 30 * Math.sin(Math.random() * Math.PI * 2);
        }
      }
    });

    let maxCount = -Infinity;
    let minCount = Infinity;
    maxCount = 0;

    edges.forEach((edge: { id: string; source: string | number; target: string | number; count: number }) => {
      // to avoid the dulplicated id to nodes
      if (!edge.id) edge.id = `edge-${uniqueId()}`;
      else if (edge.id.split('-')[0] !== 'edge') edge.id = `edge-${edge.id}`;
      // TODO: delete the following line after the queried data is correct
      if (!currentNodeMap[edge.source] || !currentNodeMap[edge.target]) {
        console.warn('edge source target does not exist', edge.source, edge.target, edge.id);
        return;
      }
      const sourceNode = currentNodeMap[edge.source];
      const targetNode = currentNodeMap[edge.target];

      if (!sourceNode || !targetNode) console.warn('source or target is not defined!!!', edge, sourceNode, targetNode);

      // calculate the degree
      sourceNode.degree++;
      targetNode.degree++;
      sourceNode.outDegree++;
      targetNode.inDegree++;

      if (edge.count > maxCount) maxCount = edge.count;
      if (edge.count < minCount) minCount = edge.count;
    });

    nodes.sort(this.descendCompare(NODESIZEMAPPING));

    const maxDegree = nodes[0].degree || 1;
    const descreteNodes = [];

    nodes.forEach(
      (node: {
        count: number;
        level: number;
        size: number;
        isReal: boolean;
        labelCfg: {
          position: string;
          offset: number;
          style: { fill: string; fontSize: number; stroke: string; lineWidth: number };
        };
        degree: any;
      }) => {
        // assign the size mapping to the outDegree
        const countRatio = node.count / maxNodeCount;
        const isRealNode = node.level === 0;
        node.size = isRealNode ? DEFAULTNODESIZE : DEFAULTAGGREGATEDNODESIZE;
        node.isReal = isRealNode;
        node.labelCfg = {
          position: 'bottom',
          offset: 5,
          style: {
            fill: this.global.node.labelCfg.style.fill,
            fontSize: 6 + countRatio * 6 || 12,
            stroke: this.global.node.labelCfg.style.stroke,
            lineWidth: 3,
          },
        };

        if (!node.degree) {
          descreteNodes.push(node);
        }
      },
    );

    const countRange = maxCount - minCount;
    const minEdgeSize = 1;
    const maxEdgeSize = 7;
    const edgeSizeRange = maxEdgeSize - minEdgeSize;
    edges.forEach((edge) => {
      // set edges' style
      const targetNode = currentNodeMap[edge.target];
      const size = ((edge.count - minCount) / countRange) * edgeSizeRange + minEdgeSize || 1;
      edge.size = size;

      const arrowWidth = Math.max(size / 2 + 2, 3);
      const arrowLength = 10;
      const arrowBeging = targetNode.size + arrowLength;
      let arrowPath = `M ${arrowBeging},0 L ${arrowBeging + arrowLength},-${arrowWidth} L ${arrowBeging +
        arrowLength},${arrowWidth} Z`;
      let d = targetNode.size / 2 + arrowLength;
      if (edge.source === edge.target) {
        edge.type = 'loop';
        arrowPath = undefined;
      }
      const sourceNode = currentNodeMap[edge.source];
      const isRealEdge = targetNode.isReal && sourceNode.isReal;
      edge.isReal = isRealEdge;
      const stroke = isRealEdge ? this.global.edge.style.realEdgeStroke : this.global.edge.style.stroke;
      const opacity = isRealEdge ? this.global.edge.style.realEdgeOpacity : this.global.edge.style.strokeOpacity;
      const dash = Math.max(size, 2);
      const lineDash = isRealEdge ? undefined : [dash, dash];
      edge.style = {
        stroke,
        strokeOpacity: opacity,
        cursor: 'pointer',
        lineAppendWidth: Math.max(edge.size || 5, 5),
        fillOpacity: 1,
        lineDash,
        endArrow: arrowPath ? { path: arrowPath, d, fill: stroke, strokeOpacity: 0 } : false,
      };
      edge.labelCfg = {
        autoRotate: true,
        style: {
          stroke: this.global.edge.labelCfg.style.stroke,
          fill: this.global.edge.labelCfg.style.fill,
          lineWidth: 4,
          fontSize: 12,
          lineAppendWidth: 10,
          opacity: 1,
        },
      };
      if (!edge.oriLabel) edge.oriLabel = edge.label;
      if (this.largeGraphMode || !edgeLabelVisible) edge.label = '';
      else {
        edge.label = this.labelFormatter(edge.label, this.labelMaxLength);
      }

      // arrange the other nodes around the hub
      const sourceDis = sourceNode.size / 2 + 20;
      const targetDis = targetNode.size / 2 + 20;
      if (sourceNode.x && !targetNode.x) {
        targetNode.x = sourceNode.x + sourceDis * Math.cos(Math.random() * Math.PI * 2);
      }
      if (sourceNode.y && !targetNode.y) {
        targetNode.y = sourceNode.y + sourceDis * Math.sin(Math.random() * Math.PI * 2);
      }
      if (targetNode.x && !sourceNode.x) {
        sourceNode.x = targetNode.x + targetDis * Math.cos(Math.random() * Math.PI * 2);
      }
      if (targetNode.y && !sourceNode.y) {
        sourceNode.y = targetNode.y + targetDis * Math.sin(Math.random() * Math.PI * 2);
      }

      if (!sourceNode.x && !sourceNode.y && this.manipulatePosition) {
        sourceNode.x = this.manipulatePosition.x + 30 * Math.cos(Math.random() * Math.PI * 2);
        sourceNode.y = this.manipulatePosition.y + 30 * Math.sin(Math.random() * Math.PI * 2);
      }
      if (!targetNode.x && !targetNode.y && this.manipulatePosition) {
        targetNode.x = this.manipulatePosition.x + 30 * Math.cos(Math.random() * Math.PI * 2);
        targetNode.y = this.manipulatePosition.y + 30 * Math.sin(Math.random() * Math.PI * 2);
      }
    });

    descreteNodeCenter = {
      x: width - paddingLeft,
      y: height - paddingTop,
    };
    descreteNodes.forEach((node) => {
      if (!node.x && !node.y) {
        node.x = descreteNodeCenter.x + 30 * Math.cos(Math.random() * Math.PI * 2);
        node.y = descreteNodeCenter.y + 30 * Math.sin(Math.random() * Math.PI * 2);
      }
    });

    G6.Util.processParallelEdges(edges, 12.5, 'custom-quadratic', 'custom-line');
    return {
      maxDegree,
      edges,
    };
  }

  private handleResize() {
    this.setCanvasSize();
    this.handleRefreshGraph(this.currentUnproccessedData, {
      changeSize: true,
    });
  }

  private setCanvasSize() {
    const container = this.container.parentElement;

    if (this.autoFit) {
      this.canvasWidth = container.scrollWidth;
      this.canvasHeight = container.scrollHeight;
    } else {
      this.canvasWidth = Number(this.width);
      this.canvasHeight = Number(this.height);
    }
  }

  private cacheNodePositions() {
    const positionMap = {};

    if (!this.graph) {
      return positionMap;
    }
    const nodes = this.graph.getNodes();
    const nodeLength = nodes.length;
    for (let i = 0; i < nodeLength; i++) {
      const node = nodes[i].getModel();
      positionMap[node.id] = {
        x: node.x,
        y: node.y,
        level: node.level,
      };
    }
    return positionMap;
  }

  private hideItems() {
    if (!this.graph) {
      return;
    }

    this.hiddenItemIds.forEach((id) => {
      this.graph.hideItem(id);
    });
  }

  // 截断长文本。length 为文本截断后长度，elipsis 是后缀
  private formatText(text: string, length = 5, elipsis = '...') {
    if (!text) return '';
    if (text.length > length) {
      return `${text.substring(0, length)}${elipsis}`;
    }
    return text;
  }

  private clearFocusItemState() {
    if (!this.graph) return;
    this.clearFocusNodeState();
    this.clearFocusEdgeState();
  }

  private clearFocusNodeState() {
    if (!this.graph) {
      return;
    }

    const focusNodes = this.graph.findAllByState('node', 'focus');
    focusNodes.forEach((fnode: any) => {
      this.graph.setItemState(fnode, 'focus', false); // false
    });
  }

  private clearFocusEdgeState() {
    if (!this.graph) {
      return;
    }

    const focusEdges = this.graph.findAllByState('edge', 'focus');
    focusEdges.forEach((fedge: any) => {
      this.graph.setItemState(fedge, 'focus', false);
    });
  }

  private labelFormatter(
    text: {
      split: (arg0: string) => { (): any; new (): any; length: number };
      substr: (arg0: number, arg1: number) => any;
    },
    minLength = 10,
  ) {
    if (text && text.split('').length > minLength) return `${text.substr(0, minLength)}...`;
    return text;
  }

  private descendCompare(p: string) {
    // 这是比较函数
    return function(m: { [x: string]: any }, n: { [x: string]: any }) {
      const a = m[p];
      const b = n[p];
      return b - a; // 降序
    };
  }

  render() {
    return <div ref='container'></div>;
  }
}
