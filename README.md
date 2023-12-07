# Elasticsearch with kibana on docker

## Run

* docker-compose up
* genera token for kibana 

``
docker-compose exec -it elasticsearch01 /usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s kibana
``

* get verification code from kibana

``
docker-compose exec -it kibana bin/kibana-verification-code
``

* reset password for elastic user

``
docker-compose exec -it elasticsearch01 /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic
``