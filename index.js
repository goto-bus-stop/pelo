'use strict'

const Module = require('module')

var BOOL_PROPS = [
  'autofocus', 'checked', 'defaultchecked', 'disabled', 'formnovalidate',
  'indeterminate', 'readonly', 'required', 'selected', 'willvalidate'
]

var BOOL_PROP_PATTERN = new RegExp(' (' + BOOL_PROPS.join('|') + '|onclick)=(""|\'\')', 'ig')
var DISABLED_PATTERN = new RegExp('disabled=("true"|\'true\')', 'ig')

const replaceMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#039;'
}
const replaceMapRE = new RegExp(Object.keys(replaceMap).join('|'), 'g')

function replaceMapper (matched){
  return replaceMap[matched]
}

function handleValue (value) {
  if (Array.isArray(value)) {
    // Suppose that each item is a result of html``.
    return value.join('')
  }
  // Ignore event handlers.
  //     onclick=${(e) => doSomething(e)}
  // will become
  //     onclick=""
  if (typeof value === 'function') {
    return '""'
  }

  if (value === null || value === undefined || value === false) {
    return ''
  }

  if (typeof value === 'object' && value.constructor.name !== 'String') {
    return objToString(value)
  }

  if (value.__encoded) {
    return value
  }

  return value.toString().replace(replaceMapRE, replaceMapper)
}

function stringify () {
  var pieces = arguments[0]
  var output = ''
  for (var i = 0; i < pieces.length - 1; i++) {
    output += pieces[i] + handleValue(arguments[i + 1])
  }
  output += pieces[i]
  output = output
    .replace(DISABLED_PATTERN, 'disabled="disabled"')
    .replace(BOOL_PROP_PATTERN, '')

  // HACK: Avoid double encoding by marking encoded string
  // You cannot add properties to string literals
  // eslint-disable-next-line no-new-wrappers
  const wrapper = new String(output)
  wrapper.__encoded = true
  return wrapper
}

function objToString (obj) {
  const values = [];
  const keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    values.push(`${key}="${obj[key] || ''}"`)
  }
  return values.join(' ')
}

function replace (moduleId) {
  const originalRequire = Module.prototype.require
  Module.prototype.require = function (id) {
    if (id === moduleId) {
      return stringify
    } else {
      return originalRequire.apply(this, arguments)
    }
  }
}

stringify.replace = replace

module.exports = stringify
