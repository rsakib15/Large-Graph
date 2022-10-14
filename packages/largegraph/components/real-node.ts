import G6 from "@antv/g6";
import { isNumber, isArray } from '@antv/util';
import { colorSets, GLOBAL } from "../consts";
import { ILabelSytle } from "../interfaces";

// Custom real node
G6.registerNode(
  'real-node',
  {
    draw(cfg, group) {
      let r = 30;
      if (isNumber(cfg.size)) {
        r = cfg.size / 2;
      } else if (isArray(cfg.size)) {
        r = cfg.size[0] / 2;
      }
      const style = cfg.style || {};
      const colorSet = cfg.colorSet || colorSets[0];

      // halo for hover
      group.addShape('circle', {
        attrs: {
          x: 0,
          y: 0,
          r: r + 5,
          fill: style.fill || colorSet.mainFill || '#2B384E',
          opacity: 0.9,
          lineWidth: 0,
        },
        name: 'halo-shape',
        visible: false,
      });

      // focus stroke for hover
      group.addShape('circle', {
        attrs: {
          x: 0,
          y: 0,
          r: r + 5,
          fill: style.fill || colorSet.mainFill || '#2B384E',
          stroke: '#fff',
          strokeOpacity: 0.85,
          lineWidth: 1,
        },
        name: 'stroke-shape',
        visible: false,
      });

      const keyShape = group.addShape('circle', {
        attrs: {
          ...style,
          x: 0,
          y: 0,
          r,
          fill: colorSet.mainFill,
          stroke: colorSet.mainStroke,
          lineWidth: 2,
          cursor: 'pointer',
        },
        name: 'aggregated-node-keyShape',
      });

      let labelStyle: ILabelSytle = {};

      if (cfg.labelCfg) {
        labelStyle = Object.assign(labelStyle, cfg.labelCfg.style);
      }

      if (cfg.label) {
        const text = cfg.label;
        let labelStyle = {
          fontSize: 10,
        };

        let refY = 0;
        if (cfg.labelCfg) {
          labelStyle = Object.assign(labelStyle, cfg.labelCfg.style);
          refY += cfg.labelCfg.refY || 0;
        }

        const fontSize = labelStyle.fontSize < 8 ? 8 : labelStyle.fontSize;
        const lineNum: number = 1;
        let offsetY = lineNum * (fontSize || 12);
        group.addShape('text', {
          attrs: {
            text,
            x: 0,
            y: r + refY + offsetY + 5,
            textAlign: 'center',
            textBaseLine: 'alphabetic',
            cursor: 'pointer',
            fontSize,
            fill: '#fff',
            opacity: 0.85,
            fontWeight: 400,
            stroke: GLOBAL.edge.labelCfg.style.stroke,
          },
          name: 'text-shape',
          className: 'text-shape',
        });
      }

      // tag for new node
      if (cfg.new) {
        group.addShape('circle', {
          attrs: {
            x: r - 3,
            y: -r + 3,
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
        const label = group.find((e: { get: (arg0: string) => string }) => e.get('name') === 'text-shape');
        const keyShape = item.getKeyShape();
        const colorSet = item.getModel().colorSet || colorSets[0];
        if (value) {
          stroke && stroke.show();
          keyShape.attr('fill', colorSet.selectedFill);
          label && label.attr('fontWeight', 800);
        } else {
          stroke && stroke.hide();
          keyShape.attr('fill', colorSet.mainFill); // '#2B384E'
          label && label.attr('fontWeight', 400);
        }
      }
    },
    update: undefined,
  },
  'aggregated-node',
); // 这样可以继承 aggregated-node 的 setState
