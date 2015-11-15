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
  , color: 'green'
  , angle: 0
  , source: [basicNode]
  , target: [basicNode, rootNode]
}

var disagreeEdge = {
    name: 'disagree'
  , color: 'red'
  , angle: 180
  , source: [basicNode]
  , target: [basicNode, rootNode]
}

var commentEdge = {
    name: 'comment'
  , color: 'black'
  , angle: null
  , source: [commentNode]
  , target: [basicNode, commentNode, rootNode]
}


module.exports = {
    name: 'Default'
  , nodeTypes: [basicNode, commentNode]
  , edgeTypes: [agreeEdge, disagreeEdge, commentEdge]
}
