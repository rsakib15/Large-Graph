/*
  example模块是示例代码，请勿直接在上面开发，可以使用yarn run generate pkgname命令来生成package，详见README
*/
import { Vue, Component, Watch } from 'vue-property-decorator';

@Component({
  depends: [
    'component.largegraph.LargeGraph',
  ],
})

export default class TestPage extends Vue {
  private continerHeight: number = 600;
  
  test1 = {
    "data":{
      "nodes":[{"id":"Myriel"},{"id":"Napoleon"},{"id":"Mlle.Baptistine"},{"id":"Mme.Magloire"}],
      "edges": [{"source":"Napoleon","target":"Myriel"},{"source":"Mlle.Baptistine","target":"Myriel"},{"source":"Mme.Magloire","target":"Myriel"}],
    },
    "borderColor": "#000000",
    "expanLevel": 1,
    "nodeColor": {
      "style": {
        "backgroundColor": '#f00',
        "borderColor": "#000000",
        "textColor": '#000',
        "textSize": 25,
      },
    },
    "edgeColor":{
      "source": "8",
      "target": "9",
      "style": {
          "lineColor": '#fEE',
          "lineWidth": 2,
        }
      }
  }

  test2 = {
    "data":{
      "nodes":[{"id":"Myriel"},{"id":"Napoleon"},{"id":"Mlle.Baptistine"},{"id":"Mme.Magloire"}],
      "edges": [{"source":"Napoleon","target":"Myriel"},{"source":"Mlle.Baptistine","target":"Myriel"},{"source":"Mme.Magloire","target":"Myriel"}],
    },
    "expanLevel": 1,
    "borderColor": "#FFFFFF",
    "nodeColor": {
      "style": {
        "backgroundColor": '#000000',
        "borderColor": '#FFFFFF',
        "textColor": '#FFFFFF',
        "textSize": 25,
      },
    },
    "edgeColor":{
      "source": "8",
      "target": "9",
      "style": {
          "lineColor": '#EF0',
          "lineWidth": 2,
        }
      }
  }

  testCase = this.test2 // Change test case number for different test case

  checkValidColorCode(color: string) {
    if (color.length !== 7 || color.charAt(0) !== '#') {
      return false;
    }
    for (let i = 1; i < 7; i++) {
      if (!(color.charAt(i) >= '0' && color.charAt(i) <= '9') && !(color.charAt(i) >= 'a' && color.charAt(i) <= 'f')) {
        return false;
      }
    }
    return true;
  }

  @Watch('borderColor', {deep: true, immediate: true})
  onBorderColorChange(val: string){
    if(this.checkValidColorCode(val)){
      console.log("Valid Color: ", val)
      this.$data.borderColor = val
    }else{
      console.log("Invalid Color: ", val)
    }
  }

  public render() {
    return (
      <div>
        {
          this.testCase.data && <large-graph
          data={this.testCase.data}
          borderColor={this.testCase.borderColor}
          changelargeGraphNode={this.testCase.nodeColor}
          changelargeGraphEdge={this.testCase.edgeColor}
          expandLevel={this.testCase.expanLevel}
          containerHeight={this.continerHeight}
        />}
      </div>
    );
  }
}
