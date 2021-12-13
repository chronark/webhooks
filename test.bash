#!/bin/bash


for VARIABLE in 1 2 3 4 5
do

curl --request POST \
  --url https://webhooks-w74m.onrender.com/ \
  --header 'Content-Type: application/json' \
  --header 'wh-debounce-window: 10' \
  --header 'wh-deduplication-id: abc' \
  --header 'wh-target-url: https://hookb.in/QJ0pwLYaw0s8mNzzm267' \
  --data '{
	"data": "$VARIABLE"
}'

done









