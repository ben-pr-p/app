var basic = {
    name: 'basic'
  , color: 'white'
}

var problem = {
    name: 'problem'
  , color: 'blue'
  , angle: 180
  , source: [basic]
  , target: [basic]
}

var cause = {
    name: 'cause'
  , color: 'red'
  , angle: 90
  , source: [basic]
  , target: [basic]
}

var solution = {
    name: 'solution'
  , color: 'yellow'
  , angle: 0
  , source: [basic]
  , target: [basic]
}

module.exports = {
    name: 'Default'
  , nodeTypes: [basic]
  , edgeTypes: [problem, solution, cause]
}
