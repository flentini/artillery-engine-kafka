const test = require('tape');
const EventEmitter = require('events');
const sinon = require('sinon');
const rewiremock = require('rewiremock').default;

const stubbedProducer = {
  on: sinon.stub().onSecondCall().callsArg(1),
  send: sinon.stub().callsArg(1)
};

const spies = {
  Producer: sinon.spy(),
  HighLevelProducer: sinon.stub().returns(stubbedProducer),
  KafkaClient: sinon.spy()
};

rewiremock('kafka-node').with(spies);
rewiremock.enable();

test('before', (t) => {
  t.end();
});

const KafkaEngine = require('..');

const script = {
  config: {
    target: 'my_kafka_topic',
    kafka: {
      client: {
        kafkaHost: 'kafkahost:9092'
      }
    }
  },
  scenarios: [
    {
      name: 'Send message to topic',
      engine: 'kafka',
      flow: [
        {
          publishMessage: {
            batch: 2
          }
        }
      ]
    }
  ]
};

test('Engine Kafka Producer', (t) => {
  const events = new EventEmitter();
  const engine = new KafkaEngine(script, events, {});

  const runScenario = engine.createScenario(script.scenarios[0], events);
  const initialContext = {
    vars: {}
  };

  t.assert(engine, 'Can construct an engine');

  runScenario(initialContext, () => {
    t.assert(spies.HighLevelProducer.called, 'Creates the right type of producer');
    t.end();
  });
});

test('after', (t) => {
  rewiremock.disable();
  t.end();
});
