/*
  example模块是示例代码，请勿直接在上面开发，可以使用yarn run generate pkgname命令来生成package，详见README
*/
import { Vue, Component } from 'vue-property-decorator';
import svg from '../static/default.svg';
@Component({
  depends: [
  ],
})
export default class Test extends Vue {
  public render() {
    return (
      <div class='flex justify-center items-center h-full'>
        <div >
          <img style='width: 280px;' src={ svg } alt="" />
          <div class='text-center text-gray-7 mt-4'>您暂未设置项目主页，请在零壤中设置</div>
        </div>
      </div>
    );
  }
 }
