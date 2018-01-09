# slackvisualizer
A python script to pull slack participation metrics and visualize them with D3.js

## Pulling data
1. Be sure to get an [api key from Slack](https://api.slack.com/custom-integrations/legacy-tokens) and add it to your environment variables under the term `SLACKKEY`
2. Install the required libraries with `pip install -r requirements.txt`
3. Run the following command to retreive the data from slack (note that you can change the filepath but this will send the data directly to the folder user by the visualization):
```
python retrieve_slack_messages.py -f chat_visualizer/data/chat_history.json
```

## Visualizing data
Simply launch the website within the `chat_visualizer` folder
