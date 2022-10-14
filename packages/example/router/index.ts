import { Route } from '@idg/idg';
const LargeGraph: Route = {
  path: '/',
  name: 'index',
  page: 'LargeGraphPage',
};
const LargeGraphTest: Route = {
  path: '/largegraphtest',
  name: 'LargeGraphTest',
  page: 'LargeGraphTestPage',
}

export const routes = [
  LargeGraph,
  LargeGraphTest
];
