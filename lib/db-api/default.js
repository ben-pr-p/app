var basicNode = {
    name: 'basic'
  , color: 'white'
}

var commentNode = {
    name: 'comment'
  , color: 'black'
}

var rootNode = {
    name: 'root'
  , color: 'white'
}

var agreeEdge = {
    name: 'agree'
  , color: '#a4cb53'
  , angle: 0
  , source: [basicNode]
  , target: [basicNode, rootNode]
}

var disagreeEdge = {
    name: 'disagree'
  , color: '#d95e59'
  , angle: 180
  , source: [basicNode]
  , target: [basicNode, rootNode]
}

var commentEdge = {
    name: 'comment'
  , color: '#666'
  , angle: null
  , source: [commentNode]
  , target: [basicNode, commentNode, rootNode]
}

module.exports = {
    name: 'Default'
  , nodeTypes: [basicNode, commentNode]
  , edgeTypes: [agreeEdge, disagreeEdge, commentEdge]
}
