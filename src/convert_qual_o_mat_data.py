#!/usr/bin/env python3

import json

def read_json_file(directory, file_name):
	import os.path
	json_file_path = os.path.join(directory, file_name)
	try:
		with open(json_file_path, 'r') as json_file:
			return json.load(json_file)
	except:
		return None

def read_data_files(directory):
	return {
		'answers': read_json_file(directory, 'answer.json'),
		'comments': read_json_file(directory, 'comment.json'),
		'opinions': read_json_file(directory, 'opinion.json'),
		'overview': read_json_file(directory, 'overview.json'),
		'parties': read_json_file(directory, 'party.json'),
		'statements': read_json_file(directory, 'statement.json'),
	}

ANSWER_MAPPING = {
	0: '+',
	1: '-',
	2: '~',
}

def ensure_array_length(array, length):
	array += [None] * (length - len(array))
	return array

def get_positions(party_id, data):
	positions = []
	for opinion in data['opinions']:
		if opinion['party'] == party_id:
			positions = ensure_array_length(positions, (opinion['statement'] + 1))
			positions[opinion['statement']] = opinion['answer']
	return ''.join(ANSWER_MAPPING[position] for position in positions)

def convert_data(data):
	return {
		'name': data['overview']['title'],
		'theses': [{
			'topic': 'Aussage Nr. {id}'.format(id = statement['id']),
			'statement': statement['text'],
		} for statement in data['statements']],
		'parties': [{
			'short_name': party['name'],
			'full_name': party['longname'],
			'positions': get_positions(party['id'], data),
		} for party in data['parties']],
	}

# ----
# MAIN
# ----
if __name__ == '__main__':
	import argparse
	argument_parser = argparse.ArgumentParser(
		formatter_class = argparse.ArgumentDefaultsHelpFormatter,
		description = 'Convert election data from the format used by qual-o-mat-data (https://github.com/gockelhahn/qual-o-mat-data) to the format used by wahl-helfer',
	)
	argument_parser.add_argument(
		'--input_directory', '-i',
		type = str,
		default = '.',
		help = 'the directory where the input (JSON) files are located',
	)
	argument_parser.add_argument(
		'--output_file', '-o',
		type = argparse.FileType('w'),
		default = '-',
		help = 'the output (JSON) file to write to',
	)
	arguments = argument_parser.parse_args()

	input_data = read_data_files(arguments.input_directory)
	converted_data = convert_data(input_data)
	json.dump(converted_data, arguments.output_file, indent='\t', sort_keys=True)
