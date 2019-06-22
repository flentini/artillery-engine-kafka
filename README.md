# Artillery.io Kafka Plugin

Load Test Kafka with [Artillery](https://artillery.io)

Based on the [artillery-engine-kinesis](https://github.com/artilleryio/artillery-engine-kinesis) plugin

This is a work-in-progress

## Usage

### Install the plugin

```
# If Artillery is installed globally:
npm install -g artillery-engine-kafka
```

### Define a scenario

```yaml
config:
  target: "kafka_topic"
  kafka:
    client:
      kafkaHost: "localhost:9092"
  phases:
    - duration: 10
      arrivalRate: 5
  engines:
    kafka: {}

scenarios:
  - name: "Send message to cluster"
    engine: kafka
    flow:
      - publishMessage:
          # destination topic, required
          topic: "myTestTopic"
          # size of the batch, default 1
          batch: 10
          # size of the message in bytes, default 500.
          # Ignored if data is defined
          size: 300
          # message payload, takes precedence over size parameter
          # it can be an object or a string
          data:
            name: "Mr Charles J. Message"
            location: "London, UK"
```
