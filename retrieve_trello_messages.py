import requests
import json
import argparse
import os

team_boards = ['5a5000b1aec1a269f123a949', '5a4fa7ca9b9444c95a7b5725', '5a4fa7a4694787234e702a84', '5a4cf20858260d304a47b9d1',
'5a5000814017ad42e45d6961', '5a5017ab83962a8204320c0e', '5a50009f6cff3bf4290ef839', '5a4fa8aa80b013868bbe03cf']

key = os.environ['TRELLOKEY']
token = os.environ['TRELLOTOKEN']

base_url = "https://api.trello.com/1/boards/"
url_params = {'key':key, 'token':token}

def get_action_data():
	data = {}
	for board in team_boards:
		board_response = requests.get(base_url + board, params = url_params)
		board_response_data = json.loads(board_response.text)
		
		board_data = {}
		board_data['name'] = board_response_data['name']
		print('Retrieving data from ' + board_data['name'] + '...')

		board_data['actions'] = []
		board_data['members'] = set()

		url_params['limit'] = 1000
		actions_response = requests.get(base_url + board + '/actions', params = url_params)
		actions_response_data = json.loads(actions_response.text)

		for action in actions_response_data:
			member = action['memberCreator']['fullName']
			board_data['members'].add(member)
			if 'list' in action['data'].keys():
				action_name = action['data']['list']['name']            
			elif 'card' in action['data'].keys():
				action_name = action['data']['card']['name']
			else:
				action_name = None
			board_data['actions'].append({'member':member, 'type':action['type'], 'action_name':action_name, 'time':action['date'][:10]})
			
		print(len(board_data['actions']))
		board_data['members'] = list(board_data['members']) 
		data[board] = board_data
	return data


if __name__ == '__main__':
	parser = argparse.ArgumentParser()
	parser.add_argument('-f', '--file', help = 'output_file')

	data = get_action_data()

	args = parser.parse_args()
	if args.file:
		with open(args.file + '.json', 'w') as outfile:
			json.dump(data, outfile)