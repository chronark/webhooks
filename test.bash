#!/bin/bash


for n in 1 2 3 4 5
do


curl --request POST \
  --url https://webhooks-w74m.onrender.com/ \
  --header 'wh-debounce-window: 10' \
  --header 'wh-deduplication-id: abc' \
  --header 'wh-target-url: https://hookb.in/eKN2Yqy3wgulwQmmwRLm' \
  --data "$n"
done









