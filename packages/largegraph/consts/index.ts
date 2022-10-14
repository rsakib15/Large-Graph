import G6 from "@antv/g6";

export const NODESIZEMAPPING = 'degree';
export const SMALLGRAPHLABELMAXLENGTH = 5;
export const DEFAULTNODESIZE = 20;
export const DEFAULTAGGREGATEDNODESIZE = 53;
export const NODE_LIMIT = 20; // TODO: find a proper number for maximum node number on the canvas

export const REAL_EDGE_OPACITY = 0.2;
export const GLOBAL = {
  node: {
    style: {
      fill: '#2B384E',
    },
    labelCfg: {
      style: {
        fill: '#acaeaf',
        stroke: '#191b1c',
      },
    },
    stateStyles: {
      focus: {
        fill: '#2B384E',
      },
    },
  },
  edge: {
    style: {
      stroke: '#acaeaf',
      realEdgeStroke: '#acaeaf', //'#f00',
      realEdgeOpacity: REAL_EDGE_OPACITY,
      strokeOpacity: REAL_EDGE_OPACITY,
    },
    labelCfg: {
      style: {
        fill: '#acaeaf',
        realEdgeStroke: '#acaeaf', //'#f00',
        realEdgeOpacity: 0.5,
        stroke: '#191b1c',
      },
    },
    stateStyles: {
      focus: {
        stroke: '#fff', // '#3C9AE8',
      },
    },
  },
};

const darkBackColor = 'rgb(43, 47, 51)';
const disableColor = '#777';
const theme = 'dark';

// color palette for different nodes
const subjectColors = [
  '#5F95FF',
  '#61DDAA',
  '#65789B',
  '#F6BD16',
  '#7262FD',
  '#78D3F8',
  '#9661BC',
  '#F6903D',
  '#008685',
  '#F08BB4',
  '#F2F344',
];

/*
  Example for the color palette: #5F95FF

  activeFill: "rgb(59, 78, 112)"
  activeStroke: "#5F95FF"
  comboActiveFill: "rgb(58, 61, 65)"
  comboActiveStroke: "#5F95FF"
  comboDisableFill: "rgb(58, 61, 65)"
  comboDisableStroke: "rgb(73, 76, 78)"
  comboHighlightFill: "rgb(62, 65, 68)"
  comboHighlightStroke: "#5F95FF"
  comboInactiveFill: "rgb(62, 65, 68)"
  comboInactiveStroke: "rgb(73, 76, 78)"
  comboMainFill: "rgb(62, 65, 68)"
  comboMainStroke: "rgb(73, 76, 78)"
  comboSelectedFill: "rgb(58, 61, 65)"
  comboSelectedStroke: "#5F95FF"
  disableFill: "rgb(62, 65, 68)"
  disableStroke: "rgb(81, 83, 85)"
  edgeActiveStroke: "#5F95FF"
  edgeDisableStroke: "rgb(66, 69, 71)"
  edgeHighlightStroke: "#5F95FF"
  edgeInactiveStroke: "#777"
  edgeMainStroke: "#777"
  edgeSelectedStroke: "#5F95FF"
  highlightFill: "rgb(74, 108, 173)"highlightStroke: "#5F95FF"
  inactiveFill: "rgb(53, 67, 92)"inactiveStroke: "rgb(85, 129, 214)"
  mainFill: "rgb(53, 67, 92)"
  mainStroke: "rgb(85, 129, 214)"
  selectedFill: "rgb(53, 67, 92)"
  selectedStroke: "#5F95FF"

*/
export const colorSets = G6.Util.getColorSetsBySubjectColors(subjectColors, darkBackColor, theme, disableColor);
export const animateOpacity = 0.6;
export const animateBackOpacity = 0.1;
export const virtualEdgeOpacity = 0.1;
export const duration = 2000;
