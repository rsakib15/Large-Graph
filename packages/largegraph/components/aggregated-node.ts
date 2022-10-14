import G6 from "@antv/g6";
import { colorSets } from "../consts";

// Custom super node
G6.registerNode(
  'aggregated-node',
  {
    draw(cfg, group) {
      let width = 53,
        height = 27;
      const style = cfg.style || {};
      const colorSet = cfg.colorSet || colorSets[0];

      // halo for hover
      group.addShape('rect', {
        attrs: {
          x: -width * 0.55,
          y: -height * 0.6,
          width: width * 1.1,
          height: height * 1.2,
          fill: colorSet.mainFill,
          opacity: 0.9,
          lineWidth: 0,
          radius: (height / 2 || 13) * 1.2,
        },
        name: 'halo-shape',
        visible: false,
      });

      // focus stroke for hover
      group.addShape('rect', {
        attrs: {
          x: -width * 0.55,
          y: -height * 0.6,
          width: width * 1.1,
          height: height * 1.2,
          fill: colorSet.mainFill, // '#3B4043',
          stroke: '#AAB7C4',
          lineWidth: 1,
          lineOpacty: 0.85,
          radius: (height / 2 || 13) * 1.2,
        },
        name: 'stroke-shape',
        visible: false,
      });

      const keyShape = group.addShape('rect', {
        attrs: {
          ...style,
          x: -width / 2,
          y: -height / 2,
          width,
          height,
          fill: colorSet.mainFill, // || '#3B4043',
          stroke: colorSet.mainStroke,
          lineWidth: 2,
          cursor: 'pointer',
          radius: height / 2 || 13,
          lineDash: [2, 2],
        },
        name: 'aggregated-node-keyShape',
      });

      let labelStyle = {};
      if (cfg.labelCfg) {
        labelStyle = Object.assign(labelStyle, cfg.labelCfg.style);
      }
      group.addShape('text', {
        attrs: {
          text: `${cfg.count}`,
          x: 0,
          y: 0,
          textAlign: 'center',
          textBaseline: 'middle',
          cursor: 'pointer',
          fontSize: 12,
          fill: '#fff',
          opacity: 0.85,
          fontWeight: 400,
        },
        name: 'count-shape',
        className: 'count-shape',
        draggable: true,
      });

      // tag for new node
      if (cfg.new) {
        group.addShape('circle', {
          attrs: {
            x: width / 2 - 3,
            y: -height / 2 + 3,
            r: 4,
            fill: '#6DD400',
            lineWidth: 0.5,
            stroke: '#FFFFFF',
          },
          name: 'typeNode-tag-circle',
        });
      }
      return keyShape;
    },
    setState: (name, value, item) => {
      const group = item.get('group');
      if (name === 'layoutEnd' && value) {
        const labelShape = group.find((e: { get: (arg0: string) => string }) => e.get('name') === 'text-shape');
        if (labelShape) labelShape.set('visible', true);
      } else if (name === 'hover') {
        if (item.hasState('focus')) {
          return;
        }
        const halo = group.find((e: { get: (arg0: string) => string }) => e.get('name') === 'halo-shape');
        const keyShape = item.getKeyShape();
        const colorSet = item.getModel().colorSet || colorSets[0];
        if (value) {
          halo && halo.show();
          keyShape.attr('fill', colorSet.activeFill);
        } else {
          halo && halo.hide();
          keyShape.attr('fill', colorSet.mainFill);
        }
      } else if (name === 'focus') {
        const stroke = group.find((e: { get: (arg0: string) => string }) => e.get('name') === 'stroke-shape');
        const keyShape = item.getKeyShape();
        const colorSet = item.getModel().colorSet || colorSets[0];
        if (value) {
          stroke && stroke.show();
          keyShape.attr('fill', colorSet.selectedFill);
        } else {
          stroke && stroke.hide();
          keyShape.attr('fill', colorSet.mainFill);
        }
      }
    },
    update: undefined,
  },
  'single-node',
);

