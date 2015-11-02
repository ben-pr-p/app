var basic = {
  name: 'basic'
}

var agree = {
  name: 'agree',
  color: 'green',
  angle: 0,
  from: [basic],
  to: [basic]
}

var disagree = {
  name: 'disagree',
  color: 'red',
  angle: 180,
  from: [basic],
  to: [basic]
}

module.exports = {
  name: 'Default',
  argumentTypes: [basic],
  linkTypes: [agree, disagree]
}
