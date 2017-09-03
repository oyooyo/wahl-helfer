DISAGREE = 1
NEUTRAL = 2
AGREE = 3
SKIP = 4

DEFAULT_USER_POSITION = SKIP

MINIMUM_USER_WEIGHT = 0
MAXIMUM_USER_WEIGHT = 100
DEFAULT_USER_WEIGHT = 10

election = null
user_positions = null
user_weights = null
party_ratios = null

create_party_element = (party, ratio, index) ->
	ratio_string = (if isNaN(ratio) then '' else "#{(ratio * 100).toFixed(2)}%")
	create_element 'li', {'class':'list-group-item'}, [
		create_element 'div', {'class':'row'}, [
			create_element 'div', {'class':'col-6'}, [
				create_element 'p', {'class':'my-0'}, [
					party.short_name
				]
				create_element 'small', {'class':'text-muted'}, [
					party.full_name
				]
			]
			create_element 'div', {'class':'col-6'}, [
				create_element 'div', {'class':'bg-primary pb-4', 'style':"width:#{if isNaN(ratio) then '0%' else ratio_string};"}
				create_element 'output', {'class':''}, [
					ratio_string
				]
			]
		]
	]

get_element_by_id = (id) ->
	document.getElementById(id)

create_text_node = (text) ->
	document.createTextNode(text)

create_element = (tag_name, attributes, children) ->
	element = document.createElement(tag_name)
	if attributes
		for key, value of attributes
			element.setAttribute(key, value)
	if children
		for child in children
			if typeof(child) isnt 'object'
				child = document.createTextNode(child)
			element.appendChild(child)
	element

remove_child_nodes_of = (element) ->
	while element.hasChildNodes()
		element.removeChild(element.lastChild)

update_parties = ->
	maximum_score = election.theses.reduce (score, thesis, thesis_index) ->
			score + (if (user_positions[thesis_index] is SKIP) then 0 else user_weights[thesis_index])
		, 0
	election.parties.forEach (party, party_index) ->
		party_score = election.theses.reduce (score, thesis, thesis_index) ->
				# TODO improve/shorten
				user_position = user_positions[thesis_index]
				user_weight = user_weights[thesis_index]
				party_position = {'+':AGREE, '-':DISAGREE, '~':NEUTRAL}[party.positions[thesis_index]]
				unweighed_thesis_score = (if (user_position is SKIP) then 0 else ((2 - Math.abs(user_position - party_position)) / 2))
				weighed_thesis_score = (unweighed_thesis_score * user_weight)
				score + weighed_thesis_score
			, 0
		party_ratio = (party_score / maximum_score)
		party_ratios[party_index] = party_ratio
	party_metas = party_ratios.map (party_ratio, index) ->
		ratio: party_ratio
		index: index
	party_metas.sort (party_meta_1, party_meta_2) ->
		(party_meta_2.ratio - party_meta_1.ratio)
	parties_element = get_element_by_id('parties')
	remove_child_nodes_of(parties_element)
	party_metas.forEach (party_meta, party_meta_index) ->
		party = election.parties[party_meta.index]
		parties_element.appendChild create_party_element(party, party_meta.ratio, party_meta_index)

set_user_position = (thesis_index, user_position) ->
	if user_positions[thesis_index] isnt user_position
		user_positions[thesis_index] = user_position
		update_parties()

set_user_weight = (thesis_index, user_weight) ->
	if user_weights[thesis_index] isnt user_weight
		user_weights[thesis_index] = user_weight
		update_parties()

create_user_weight_element = (thesis_index) ->
	input_id = "thesis_#{thesis_index}-weight"
	input_element = create_element 'input', {'type':'range', 'min':MINIMUM_USER_WEIGHT, 'max':MAXIMUM_USER_WEIGHT, 'step':'1', 'id':input_id, 'value':DEFAULT_USER_WEIGHT}
	output_element = create_element 'output'
	output_user_weight = ->
		output_element.value = Number(input_element.value)
	update_user_weight = ->
		set_user_weight(thesis_index, output_user_weight())
	update_user_weight()
	input_element.addEventListener 'input', output_user_weight
	input_element.addEventListener 'change', update_user_weight
	create_element 'div', {'class':'col-12 col-sm-6'}, [
		create_element 'label', {'for':input_id}, [
			'Gewichtung:'
		]
		output_element
		input_element
	]

create_radio_element = (name, value, text, change_listener) ->
	checked = (value is DEFAULT_USER_POSITION)
	attributes = {'class': 'form-check-input', 'type':'radio', 'name':name, 'value':value}
	if checked
		attributes['checked'] = ''
		change_listener(value)
	input_element = create_element 'input', attributes, []
	radio_element = create_element 'div', {'class': 'form-check form-check-inline'}, [
		create_element 'label', {'class': 'form-check-label'}, [
			input_element
			text
		]
	]
	radio_element.addEventListener 'change', ->
		if input_element.checked
			change_listener(value)
	radio_element

create_user_position_element = (thesis_index) ->
	radio_name = "thesis_#{thesis_index}-position"
	user_position_listener = (user_position) ->
		set_user_position(thesis_index, user_position)
	create_element 'div', {'class':'col-12 col-sm-6'}, [
		create_radio_element(radio_name, AGREE, 'Ja', user_position_listener)
		create_radio_element(radio_name, NEUTRAL, 'Neutral', user_position_listener)
		create_radio_element(radio_name, DISAGREE, 'Nein', user_position_listener)
		create_radio_element(radio_name, SKIP, 'Ignorieren', user_position_listener)
	]

create_thesis_element = (thesis, thesis_index, number_of_theses) ->
	create_element 'div', {'class':'card my-2'}, [
		create_element 'div', {'class': 'card-header bg-secondary text-white'}, [
			create_element 'strong', {}, [
				(thesis_index + 1)
			]
			'/'
			number_of_theses
			': '
			create_element 'strong', {}, [
				thesis.topic
			]
		]
		create_element 'div', {'class': 'card-body py-0'}, [
			create_element 'p', {'class': 'card-text h5 py-2'}, [
				thesis.statement
			]
		]
		create_element 'div', {'class': 'card-footer'}, [
			create_element 'div', {'class': 'row'}, [
				create_user_position_element(thesis_index)
				create_user_weight_element(thesis_index)
			]
		]
	]

setup_election_with_data = (election_data) ->
	election = election_data
	number_of_theses = election_data.theses.length
	user_positions = Array(number_of_theses).fill(DEFAULT_USER_POSITION)
	user_weights = Array(number_of_theses).fill(DEFAULT_USER_WEIGHT)
	party_ratios = Array(election_data.parties.length).fill(NaN)
	theses_element = get_element_by_id('theses')
	remove_child_nodes_of(theses_element)
	election_data.theses.forEach (thesis, thesis_index, theses) ->
		thesis_element = create_thesis_element(thesis, thesis_index, theses.length)
		theses_element.appendChild(thesis_element)
	update_parties()

http_get_url = (url) ->
	new Promise (resolve, reject) ->
		request = new XMLHttpRequest()
		request.onload = ->
			if request.status is 200
				resolve(request.response)
			else
				reject(Error(request.statusText))
			return
		request.onerror = ->
			reject(Error('Network Error'))
			return
		request.open('GET', url, true)
		request.send(null)
		return

http_get_json_url = (json_url) ->
	http_get_url(json_url)
	.then(JSON.parse)

setup_election_with_url = (election_data_url) ->
	http_get_json_url(election_data_url)
	.then(setup_election_with_data)

setup_election_with_id = (election_id) ->
	setup_election_with_url("wahlen/#{election_id}.json")

search_parameters = {}
location.search.substr(1).split('&').forEach (parameter) ->
	[key, value] = parameter.split('=')
	search_parameters[key] = value

setup_election_with_id(search_parameters.wahl)

