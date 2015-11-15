export default class Schema {
  constructor (debateType) {
    this.schema = debateType;

    this.color = this.color.bind(this);
  }

  color (type) {
    var edgeType = this.schema.edgeTypes.filter(e => e.name == type)[0];
    return (edgeType) ? edgeType.color : '#000';
  }

  edgesTo (type) {
    debugger;
    var edges = this.schema.edgeTypes.filter(e => {
      var matches = e.target.filter(n => n.name == type);
      return matches.length > 0;
    });
    return edges;
  }

  sourceOfEdge (type) {
    var edgeType = this.schema.edgeTypes.filter(e => e.name == type)[0];
    return edgeType.source[0];
  }

  angle (type) {
    var edgeType = this.schema.edgeTypes.filter(e => e.name == type)[0];
    return (edgeType) ? edgeType.angle : 270;
  }
}
