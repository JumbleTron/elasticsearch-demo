# Elasticsearch with kibana on docker

## Run:

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

## Security:

1. Log in to the Elasticsearch Service Console.
2. Go to page: http://localhost:5601/app/management/security/api_keys/
3. Create new API key

The API key needs to be supplied in the Authorization header of a request, in the following format:

``
Authorization: ApiKey $EC_API_KEY
``

## Create index

``
curl --request PUT \
--url https://localhost:9200/products \
--header 'Authorization: ApiKey $API_KEY' \
--header 'Content-Type: application/json' \
--data '{
"settings": {
"number_of_shards": 1,
"number_of_replicas": 1
},
"mappings": {
"properties": {
"product_name": {
"type": "text"
},
"price": {
"type": "float"
},
"description": {
"type": "text"
},
"category": {
"type": "keyword"
}
}
}
}'
``

## Create document

``
curl --request POST \
--url https://localhost:9200/products/_doc \
--header 'Authorization: ApiKey $API_KEY' \
--header 'Content-Type: application/json' \
--data '{
"product_name": "TV LED",
"price": 1500.99,
"description": "LED Full HD Smart TV",
"category": "Electronics"
}'
``