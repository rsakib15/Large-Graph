import Vue, { ComponentOptions } from 'vue';
import { Depend } from '@idg/idg';
declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    depends?: Array<string | Depend>;
  }
}

// declare module 'vue/types/vue' {
//   interface Vue {
//     $Message: any;
//   }
// }
