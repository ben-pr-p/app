var basic = {
    name: 'basic'
  , color: 'white'
}

var agree = {
    name: 'agree'
  , color: 'green'
  , angle: 0
  , source: [basic]
  , target: [basic]
}

var disagree = {
    name: 'disagree'
  , color: 'red'
  , angle: 180
  , source: [basic]
  , target: [basic]
}

var comment = {
    name: 'comment'
  , color: 'black'
  , angle: null
  , source: [basic]
  , target: [basic]
}


module.exports = {
    name: 'Default'
  , nodeTypes: [basic]
  , edgeTypes: [agree, disagree, comment]
}
