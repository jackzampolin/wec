// Requires socket.io-client 0.9.x:
// browser code can load a minified Socket.IO JavaScript library;
// standalone code can install via 'npm install socket.io-client@0.9.1'.

// schema source: https://www.mediawiki.org/wiki/Manual:RCFeed

var io = require('socket.io-client');
var Influx = require('influx');
var socket = io.connect('https://stream.wikimedia.org/rc');
var database = 'wikipedia'

const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: database,
  schema: [
    {
      "measurement": "event",
      "tags": [
        "user",
        "type",
        "bot",
        "server_name",
        "minor",
        "patrolled",
        "log_type",
        "wiki"
      ],
      "fields": {
        "title": Influx.FieldType.STRING,
        "event_id": Influx.FieldType.INTEGER,
        "namespace": Influx.FieldType.INTEGER,
        "comment": Influx.FieldType.STRING,
        "log_action": Influx.FieldType.STRING, 
        "log_id": Influx.FieldType.INTEGER, 
        "log_action_comment": Influx.FieldType.STRING,
        "post_length_old": Influx.FieldType.INTEGER,
        "revision_id_old": Influx.FieldType.INTEGER,
        "post_length_new": Influx.FieldType.INTEGER,
        "revision_id_new": Influx.FieldType.INTEGER,
      }
    }
  ]
})

err = influx.createDatabase('wikipedia')

if (err !== null) {
  console.log(err)
}

socket.on('connect', () => {
  socket.emit('subscribe', '*')
})

var points = []

socket.on('change',socketOnChange);

var socketOnChange = function (data) {
  switch (data.type) {
    case 'edit':
      points.push(editPoint(data))
      break;
    case 'new':
      points.push(editPoint(data))
      break;
    case 'log':
      points.push(logPoint(data))
      break;
    case 'categorize':
      points.push(eventPoint(data))
      break;
    default:
      console.log(data.type)
      console.log(data)
      console.log("=========================================")
  }
  if (points.length >= 10) {
    influx.writePoints(points,{
      database: database,
      retentionPolicy: 'autogen',
      precision: 's'
    }).catch(err => {
      console.log(err.message)
    })
    points = []
  } 
}

var editPoint = function (data) {
  return {
    "measurement": "event",
    "tags": {
      "user": `"${encodeURI(data.user)}"`,
      "type": `"${encodeURI(data.type)}"`,
      "bot": `"${encodeURI(data.bot)}"`,
      "server_name": `"${encodeURI(data.server_name)}"`,
      "wiki": `"${encodeURI(data.wiki)}"`,
      "minor": `"${encodeURI(data.minor)}"`,
      "patrolled": `"${encodeURI(data.patrolled)}"`
    },
    "fields": {
      "post_length_old": Math.round(data.length.old),
      "revision_id_old": Math.round(data.revision.old),
      "post_length_new": Math.round(data.length.new),
      "revision_id_new": Math.round(data.revision.new),
      "title": `"${encodeURI(data.title)}"`,
      "event_id": Math.round(data.id),
      "namespace": Math.round(data.namespace),
      "comment": `"${encodeURI(data.comment)}"`
    }
  }
}

var eventPoint = function (data) {
  return {
    "measurement": "event",
    "tags": {
      "user": `"${encodeURI(data.user)}"`,
      "type": `"${encodeURI(data.type)}"`,
      "bot": `"${encodeURI(data.bot)}"`,
      "server_name": `"${encodeURI(data.server_name)}"`,
      "wiki": `"${encodeURI(data.wiki)}"`
    },
    "fields": {
      "title": `"${encodeURI(data.title)}"`,
      "event_id": Math.round(data.id),
      "namespace": Math.round(data.namespace),
      "comment": `"${encodeURI(data.comment)}"`
    }
  }
}

var logPoint = function (data) {
  return {
    "measurement": "event",
    "tags": {
      "user": `"${encodeURI(data.user)}"`,
      "type": `"${encodeURI(data.type)}"`,
      "bot": `"${encodeURI(data.bot)}"`,
      "server_name": `"${encodeURI(data.server_name)}"`,
      "wiki": `"${encodeURI(data.wiki)}"`,
      "log_type": `"${encodeURI(data.log_type)}"`
    },
    "fields": {
      "title": `"${encodeURI(data.title)}"`,
      "event_id": Math.round(data.id),
      "namespace": Math.round(data.namespace),
      "comment": `"${encodeURI(data.comment)}"`,
      "log_action": `"${encodeURI(data.log_action)}"`, 
      "log_id": Math.round(data.log_id), 
      "log_action_comment": `"${encodeURI(data.log_action_comment)}"`,
    }
  }
}