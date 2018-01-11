import requests
import json
import argparse
import datetime
import os

section_assignments = {'U8DGW7KGD': 'A', 'U8C7VUKCY': 'B', 'U8DPKGUEB': 'B', 'U8CUHJG2U': 'B', 'U8C1X5TA5': 'B', 'U8CNKQMR6': 'A', 'U8M4ENAQL': 'A', 'U8CEWCK99': 'B', 
'U8HTULDBJ': 'B', 'U8G9TRVA5': 'A', 'U8DNT78LE': 'A', 'U8CNQK8JG': 'B', 'U8G9MDF3K': 'B', 'U8C67L5UH': 'A', 'U8DUAR1HD': 'A',
 'U8M0HPK8D': 'A', 'U8FUKRC4V': 'A', 'U8LCMUJLR': 'B', 'U8C5SUKPT': 'B', 'U8CTSRT0R': 'A', 'U8C4H8BCY': 'B', 'U8C9QF4SD': 'B', 
 'U8C997UM6': 'A', 'U8DT833T8': 'A', 'U8GJ09F5M': 'A', 'U8D3GH5GB': 'B', 'U8KKE6HMF': 'B', 'U8L5VPQ4T': 'B', 'U8FLB5F6G': 'B', 'U8E59ACR2': 'A'}

def slack_query(query_name, url_data = {}):
	url = 'https://slack.com/api/'
	request_url = '{0}{1}?'.format(url, query_name)
	api_token=os.environ['SLACKKEY']
	url_data['token'] = api_token
	response = requests.get(request_url, params = url_data)
	data = json.loads(response.text)
	return data

def get_channel_list(channels_to_exclude = []):
	channels = {}
	data = slack_query('conversations.list')
	for channel in data['channels']:
		if channel['name'] not in channels_to_exclude:
			channels[channel['name']] = {'id': channel['id']}
	return channels

def get_users(users_to_exclude = []):
	users = {}
	data = slack_query('users.list')
	for user in data['members']:
		if user['id'] not in users_to_exclude:
			users[user['id']] = {'name': user['real_name'], 'section':section_assignments[user['id']]}
	return users

def get_channel_history(channel_id, channel_name, user_list):
	data = slack_query('conversations.history', url_data={'channel':channel_id, 'count':1000})
	posts_to_exclude = ['channel_topic', 'channel_join', 'pinned_item', 'bot_message', 'channel_purpose', 'channel_archive', 'channel_name']
	if 'messages' in data:
		filtered_data = [message for message in data['messages'] if 'subtype' not in message.keys() or message['subtype'] not in posts_to_exclude]
		messages = []
		for message in filtered_data:
			if 'subtype' not in message.keys() or message['subtype'] != 'file_comment':
				user_id = message['user']
				timestamp = message['ts']
				text = message['text']
			else:
				user_id = message['comment']['user']
				timestamp = message['comment']['timestamp']
				text = message['comment']['comment']

			if user_id in user_list:
				timestamp = datetime.datetime.fromtimestamp(float(timestamp)).strftime('%Y-%m-%d %H:%M:%S')
				messages.append({'channel':channel_name, 'user':user_list[user_id]['name'], 'ts':timestamp, 'text':text})
				messages[-1]['section'] = user_list[message['user']]['section']
				messages[-1]['post'] = 1
				messages[-1]['words'] = len(messages[-1]['text'].split(' '))
				messages[-1]['characters'] = len(messages[-1]['text'])
	else:
		messages = []
	return messages

def get_all_messages():
	channels_to_exclude = ['scratchwork']
	channels = get_channel_list(channels_to_exclude)

	users_to_exclude = ['U865BPL76', 'U87KPT3RV', 'U8NLCNG1M', 'U8P3D8CAZ', 'USLACKBOT', 'U8GD099QD', 'U8G7HSM2L', 'U8CJADZ44', 'U8CPYVA9J']
	user_list = get_users(users_to_exclude)
	
	messages = []
	for channel in channels:
		print('Retrieving #{0} history...'.format(channel))
		messages += get_channel_history(channels[channel]['id'], channel, user_list)
	return messages

if __name__ == '__main__':
	parser = argparse.ArgumentParser()
	parser.add_argument('-f', '--file', help = 'output_file')

	data = get_all_messages()

	args = parser.parse_args()
	if args.file:
		with open(args.file + '.json', 'w') as outfile:
			json.dump(data, outfile)
