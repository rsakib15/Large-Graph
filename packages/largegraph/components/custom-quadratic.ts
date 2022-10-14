import G6 from "@antv/g6";
import { animateBackOpacity, animateOpacity, duration, REAL_EDGE_OPACITY, virtualEdgeOpacity } from "../consts";

// Custom the quadratic edge for multiple edges between one node pair
G6.registerEdge(
  'custom-quadratic',
  {
    setState: (name, value, item) => {
      const group = item.get('group');
      const model = item.getModel();
      if (name === 'focus') {
        const back = group.find((ele: { get: (arg0: string) => string }) => ele.get('name') === 'back-line');
        if (back) {
          back.stopAnimate();
          back.remove();
          back.destroy();
        }
        const keyShape = group.find((ele: { get: (arg0: string) => string }) => ele.get('name') === 'edge-shape');
        const arrow = model.style.endArrow;
        if (value) {
          if (keyShape.cfg.animation) {
            keyShape.stopAnimate(true);
          }
          keyShape.attr({
            strokeOpacity: animateOpacity,
            opacity: animateOpacity,
            stroke: '#fff',
            endArrow: {
              ...(arrow as Record<string, unknown>),
              stroke: '#fff',
              fill: '#fff',
            },
          });
          if (model.isReal) {
            const { lineWidth, path, endArrow, stroke } = keyShape.attr();
            const back = group.addShape('path', {
              attrs: {
                lineWidth,
                path,
                stroke,
                endArrow,
                opacity: animateBackOpacity,
              },
              name: 'back-line',
            });
            back.toBack();
            const length = keyShape.getTotalLength();
            keyShape.animate(
              (ratio: number) => {
                // the operations in each frame. Ratio ranges from 0 to 1 indicating the prograss of the animation. Returns the modified configurations
                const startLen = ratio * length;
                // Calculate the lineDash
                const cfg = {
                  lineDash: [startLen, length - startLen],
                };
                return cfg;
              },
              {
                repeat: true, // Whether executes the animation repeatly
                duration, // the duration for executing once
              },
            );
          } else {
            let index = 0;
            const lineDash = keyShape.attr('lineDash');
            const totalLength = lineDash[0] + lineDash[1];
            keyShape.animate(
              () => {
                index++;
                if (index > totalLength) {
                  index = 0;
                }
                const res = {
                  lineDash,
                  lineDashOffset: -index,
                };
                // returns the modified configurations here, lineDash and lineDashOffset here
                return res;
              },
              {
                repeat: true, // whether executes the animation repeatly
                duration, // the duration for executing once
              },
            );
          }
        } else {
          keyShape.stopAnimate();
          const stroke = '#acaeaf';
          const opacity = model.isReal ? REAL_EDGE_OPACITY : virtualEdgeOpacity;
          keyShape.attr({
            stroke,
            strokeOpacity: opacity,
            opacity,
            endArrow: {
              ...(arrow as Record<string, unknown>),
              stroke,
              fill: stroke,
            },
          });
        }
      }
    },
  },
  'quadratic',
);
