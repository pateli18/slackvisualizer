# slackvisualizer
A python script to pull slack participation metrics and visualize them with D3.js

## Pulling Slack Data
1. Be sure to get an [api key from Slack](https://api.slack.com/custom-integrations/legacy-tokens) and add it to your environment variables under the term `SLACKKEY`
2. Install the required libraries with `pip install -r requirements.txt`
3. Run the following command to retreive the data from slack (note that you can change the filepath but this will send the data directly to the folder user by the visualization):
```
python retrieve_slack_messages.py -f chat_visualizer/data/slack_chat_history.json
```

## Pulling Trello Data
1. Be sure to get an [api key](https://trello.com/app-key) **and** [token](https://trello.com/app-key) from Trello and add them to your environment variables as `TRELLOKEY` and `TRELLOTOKEN` respectively
2. Install the required libraries with `pip install -r requirements.txt` (if you have not already done so for slack)
3. Run the following command to retreive the data from trello (note that you can change the filepath but this will send the data directly to the folder user by the visualization):
```
python retrieve_trello_messages.py -f chat_visualizer/data/trello_action_history.json
```

## Visualizing data
Simply launch the website within the `chat_visualizer` folder
