const kafka = require('kafka-node');
const debug = require('debug')('engine:kafka');
const A = require('async');
const _ = require('lodash');

function KafkaEngine(script, ee, helpers) {
  this.script = script;
  this.ee = ee;
  this.helpers = helpers;

  return this;
}

KafkaEngine.prototype.createScenario = function(scenarioSpec, ee) {
  const tasks = scenarioSpec.flow.map(rs => this.step(rs, ee));

  return this.compile(tasks, scenarioSpec.flow, ee);
}

KafkaEngine.prototype.step = function step (rs, ee) {
  const self = this;

  if (rs.loop) {
    const steps = rs.loop.map(loopStep => this.step(loopStep, ee));

    return this.helpers.createLoopWithCount(rs.count || -1, steps, {});
  }

  if (rs.log) {
    return function log (context, callback) {
      return process.nextTick(function () { callback(null, context); });
    };
  }

  if (rs.think) {
    return this.helpers.createThink(rs, _.get(self.config, 'defaults.think', {}));
  }

  if (rs.publishMessage) {
    return function publishMessage (context, callback) {
      const data = typeof rs.publishMessage.data === 'object'
            ? JSON.stringify(rs.publishMessage.data)
            : String(rs.publishMessage.data);
      const batchSize = Number(rs.publishMessage.batch) || 1;

      const message = {
        topic: rs.publishMessage.topic,
        messages: new Array(batchSize).fill().map(() => data)
      }

      context.kafka.producer.send([message], function (err, data) {
        if (err) {
          ee.emit('error', err);
          debug(err);

          return callback(err, context);
        }

        ee.emit('response', 0, 0, context._uid);

        return callback(null, context);
      });
    }
  }

  return function (context, callback) {
    return callback(null, context);
  }
}

KafkaEngine.prototype.compile = function compile(tasks, scenarioSpec, ee) {
  const self = this;
  return function scenario(initialContext, callback) {
    const init = function init (next) {
      if (!((self.script.config.kafka || {}).client || {}).host) {
        throw new Error('kafka.host is required')
      }

      const opts = Object.assign({}, self.script.config.kafka, {
        kafkaHost: self.script.config.kafka.host
      });
      delete opts.host;

      const kafkaClient = new kafka.KafkaClient(opts);

      initialContext.kafka = {
        producer: new (kafka.HighLevelProducer)(kafkaClient)
      };

      initialContext.kafka.producer.on('error', function (err) {
        ee.emit('error', err);
      })

      initialContext.kafka.producer.on('ready', function () {
        ee.emit('started');

        next(null, initialContext);
      })
    }

    let steps = [init].concat(tasks);

    A.waterfall(
      steps,
      function done (err, context) {
        if (err) {
          debug(err);
        }

        return callback(err, context);
      });
  }
}

module.exports = KafkaEngine;
