# @idg/large-graph

# use

```
@Component({
  depends: [
    'component.largegraph.LargeGraph',
  ]
})
```
## use component in render function:
```
public render () {
  return (
    <large-graph data={...} />
  )
}
```

### Props
<!-- TABLE_GENERATE_START -->

| Name  | Type | Description | Default |
| ----- | ---- | ----------- | ------- |
| data  | Object | Data for large graph | Array |
| borderColor | string | Border color of node | #f0f0f0 |
| continerHeight | number | Height of graph conrainter | 600 |
| nodeColor | Object | Color of node | { ```default: '#1890ff', hover: '#40a9ff', active: '#096dd9' }``` |color|
| edgeColor | Object | Color of Edge | { ```default: '#1890ff', hover: '#40a9ff', active: '#096dd9' }``` |
| expandLevel | number | Node expand level | 1 |


<!-- TABLE_GENERATE_END -->
