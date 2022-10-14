/*
  example模块是示例代码，请勿直接在上面开发，可以使用yarn run generate pkgname命令来生成package，详见README
*/
import { Vue, Component } from 'vue-property-decorator';
import { LargeGraphData, NodeClickPayload, EdgeClickPayload } from '../../largegraph/interfaces';

@Component({
  depends: ['component.largegraph.LargeGraph'],
})
export default class LargeGraphPage extends Vue {
  private data: LargeGraphData = {
    nodes: [{ id: 'Myriel' }, { id: 'Napoleon' }, { id: 'Mlle.Baptistine' }, { id: 'Mme.Magloire' }],
    edges: [
      { source: 'Napoleon', target: 'Myriel' },
      { source: 'Mlle.Baptistine', target: 'Myriel' },
      { source: 'Mme.Magloire', target: 'Myriel' },
    ],
  };
  private borderColor: string = '#f0f0f0';
  private continerHeight: number = 600;
  private expanLevel: number = 1;
  private nodeColor = {
    style: {
      backgroundColor: '#f00',
      borderColor: '#eee',
      textColor: '#000',
      textSize: 25,
    },
  };
  private edgeColor = {
    source: '8',
    target: '9',

    style: {
      lineColor: '#f00',
      lineWidth: 2,
    },
  };
  private autoFit: boolean = false;
  private width: number = 800;
  private height: number = 600;

  private handleGetGraphData() {
    fetch('https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json')
      .then((res) => res.json())
      .then((data) => {
        alert('fetch success');
        this.data = data;
      });
  }

  public render() {
    return (
      <div class='w-full h-full'>
        <div class='fixed top-0 left-0 right-0'>
          <div>
            width: <input v-model={this.width} />
            height: <input v-model={this.height} />
            Expand Level <input v-model={this.expanLevel} />
            autoFit: {this.autoFit.toString()}
            <button
              onClick={() => {
                this.autoFit = !this.autoFit;
              }}
            >
              toggle
            </button>
            <div>
              <button onClick={this.handleGetGraphData}>change Data by fetch</button>
            </div>
          </div>
        </div>
        <large-graph
          data={this.data}
          width={this.width}
          height={this.height}
          autoFit={this.autoFit}
          borderColor={this.borderColor}
          containerHeight={this.continerHeight}
          changelargeGraphNode={this.nodeColor}
          changelargeGraphEdge={this.edgeColor}
          expandLevel={this.expanLevel}
          onNodeClick={(data: NodeClickPayload) => {
            console.log('onNodeClick', data);
          }}
          onEdgeClick={(data: EdgeClickPayload) => {
            console.log('onEdgeClick', data);
          }}
        />
      </div>
    );
  }
}
