// Requires socket.io-client 0.9.x:
// browser code can load a minified Socket.IO JavaScript library;
// standalone code can install via 'npm install socket.io-client@0.9.1'.

// schema source: https://www.mediawiki.org/wiki/Manual:RCFeed

var io = require('socket.io-client');
var Influx = require('influx');
var database = process.env.DATABSE_NAME || 'wikipedia'
var influxHost = process.env.INFLUX_URL || 'localhost' 
var influxPort = process.env.INFLUX_PORT || '8086' 
var batchSize = process.env.BATCH_SIZE || 10
var connectionUrl = process.env.CONNECTION_URL || 'https://stream.wikimedia.org/rc'

// Connect to wikipedia real time event stream
var socket = io.connect(connectionUrl)

// Instantiate the InfluxDB client and initialize the schema
const influx = new Influx.InfluxDB({
  host: influxHost,
  port: influxPort,
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
        "wiki",
        "namespace_tag"
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

// Create the database for this application if it does not exist
influx.createDatabase('wikipedia')

// Subscribe to all wikipedia events
socket.on('connect', () => {
  socket.emit('subscribe', '*')
})

var writeConfig = {
  database: database,
  retentionPolicy: 'autogen',
  precision: 's'
}

// Handle events as they are emitted
socket.on('change', function (data) {
  // Switch on event type
  switch (data.type) {
    case 'edit':
      influx.writePoints([editPoint(data)],writeConfig)
      break;
    case 'new':
      influx.writePoints([editPoint(data)],writeConfig)
      break;
    case 'log':
      influx.writePoints([logPoint(data)],writeConfig)
      break;
    case 'categorize':
      influx.writePoints([eventPoint(data)],writeConfig)
      break;
    default:
      console.log("missed event of ", data.type, " type...")
      break;
  }
})

// Point creation for edit and new events
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
      "patrolled": `"${encodeURI(data.patrolled)}"`,
      "namespace_tag": Math.round(data.namespace)
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

// Point creation for generic events
var eventPoint = function (data) {
  return {
    "measurement": "event",
    "tags": {
      "user": `"${encodeURI(data.user)}"`,
      "type": `"${encodeURI(data.type)}"`,
      "bot": `"${encodeURI(data.bot)}"`,
      "server_name": `"${encodeURI(data.server_name)}"`,
      "wiki": `"${encodeURI(data.wiki)}"`,
      "namespace_tag": Math.round(data.namespace)
    },
    "fields": {
      "title": `"${encodeURI(data.title)}"`,
      "event_id": Math.round(data.id),
      "namespace": Math.round(data.namespace),
      "comment": `"${encodeURI(data.comment)}"`
    }
  }
}

// Point creation for the log event type
var logPoint = function (data) {
  return {
    "measurement": "event",
    "tags": {
      "user": `"${encodeURI(data.user)}"`,
      "type": `"${encodeURI(data.type)}"`,
      "bot": `"${encodeURI(data.bot)}"`,
      "server_name": `"${encodeURI(data.server_name)}"`,
      "wiki": `"${encodeURI(data.wiki)}"`,
      "log_type": `"${encodeURI(data.log_type)}"`,
      "namespace_tag": Math.round(data.namespace)
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