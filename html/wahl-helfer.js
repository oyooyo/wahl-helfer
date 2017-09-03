(function() {
  var AGREE, DEFAULT_USER_POSITION, DEFAULT_USER_WEIGHT, DISAGREE, MAXIMUM_USER_WEIGHT, MINIMUM_USER_WEIGHT, NEUTRAL, SKIP, create_element, create_party_element, create_radio_element, create_text_node, create_thesis_element, create_user_position_element, create_user_weight_element, election, get_element_by_id, http_get_json_url, http_get_url, party_ratios, remove_child_nodes_of, search_parameters, set_user_position, set_user_weight, setup_election_with_data, setup_election_with_id, setup_election_with_url, update_parties, user_positions, user_weights;

  DISAGREE = 1;

  NEUTRAL = 2;

  AGREE = 3;

  SKIP = 4;

  DEFAULT_USER_POSITION = SKIP;

  MINIMUM_USER_WEIGHT = 0;

  MAXIMUM_USER_WEIGHT = 100;

  DEFAULT_USER_WEIGHT = 10;

  election = null;

  user_positions = null;

  user_weights = null;

  party_ratios = null;

  create_party_element = function(party, ratio, index) {
    var ratio_string;
    ratio_string = (isNaN(ratio) ? '' : `${(ratio * 100).toFixed(2)}%`);
    return create_element('li', {
      'class': 'list-group-item'
    }, [
      create_element('div', {
        'class': 'row'
      }, [
        create_element('div', {
          'class': 'col-6'
        }, [
          create_element('p', {
            'class': 'my-0'
          }, [party.short_name]), create_element('small', {
            'class': 'text-muted'
          }, [party.full_name])
        ]), create_element('div', {
          'class': 'col-6'
        }, [
          create_element('div', {
            'class': 'bg-primary pb-4',
            'style': `width:${(isNaN(ratio) ? '0%' : ratio_string)};`
          }), create_element('output', {
            'class': ''
          }, [ratio_string])
        ])
      ])
    ]);
  };

  get_element_by_id = function(id) {
    return document.getElementById(id);
  };

  create_text_node = function(text) {
    return document.createTextNode(text);
  };

  create_element = function(tag_name, attributes, children) {
    var child, element, i, key, len, value;
    element = document.createElement(tag_name);
    if (attributes) {
      for (key in attributes) {
        value = attributes[key];
        element.setAttribute(key, value);
      }
    }
    if (children) {
      for (i = 0, len = children.length; i < len; i++) {
        child = children[i];
        if (typeof child !== 'object') {
          child = document.createTextNode(child);
        }
        element.appendChild(child);
      }
    }
    return element;
  };

  remove_child_nodes_of = function(element) {
    var results;
    results = [];
    while (element.hasChildNodes()) {
      results.push(element.removeChild(element.lastChild));
    }
    return results;
  };

  update_parties = function() {
    var maximum_score, parties_element, party_metas;
    maximum_score = election.theses.reduce(function(score, thesis, thesis_index) {
      return score + ((user_positions[thesis_index] === SKIP) ? 0 : user_weights[thesis_index]);
    }, 0);
    election.parties.forEach(function(party, party_index) {
      var party_ratio, party_score;
      party_score = election.theses.reduce(function(score, thesis, thesis_index) {
        var party_position, unweighed_thesis_score, user_position, user_weight, weighed_thesis_score;
        user_position = user_positions[thesis_index];
        user_weight = user_weights[thesis_index];
        party_position = {
          '+': AGREE,
          '-': DISAGREE,
          '~': NEUTRAL
        }[party.positions[thesis_index]];
        unweighed_thesis_score = (user_position === SKIP ? 0 : (2 - Math.abs(user_position - party_position)) / 2);
        weighed_thesis_score = unweighed_thesis_score * user_weight;
        return score + weighed_thesis_score;
      }, 0);
      party_ratio = party_score / maximum_score;
      return party_ratios[party_index] = party_ratio;
    });
    party_metas = party_ratios.map(function(party_ratio, index) {
      return {
        ratio: party_ratio,
        index: index
      };
    });
    party_metas.sort(function(party_meta_1, party_meta_2) {
      return party_meta_2.ratio - party_meta_1.ratio;
    });
    parties_element = get_element_by_id('parties');
    remove_child_nodes_of(parties_element);
    return party_metas.forEach(function(party_meta, party_meta_index) {
      var party;
      party = election.parties[party_meta.index];
      return parties_element.appendChild(create_party_element(party, party_meta.ratio, party_meta_index));
    });
  };

  set_user_position = function(thesis_index, user_position) {
    if (user_positions[thesis_index] !== user_position) {
      user_positions[thesis_index] = user_position;
      return update_parties();
    }
  };

  set_user_weight = function(thesis_index, user_weight) {
    if (user_weights[thesis_index] !== user_weight) {
      user_weights[thesis_index] = user_weight;
      return update_parties();
    }
  };

  create_user_weight_element = function(thesis_index) {
    var input_element, input_id, output_element, output_user_weight, update_user_weight;
    input_id = `thesis_${thesis_index}-weight`;
    input_element = create_element('input', {
      'type': 'range',
      'min': MINIMUM_USER_WEIGHT,
      'max': MAXIMUM_USER_WEIGHT,
      'step': '1',
      'id': input_id,
      'value': DEFAULT_USER_WEIGHT
    });
    output_element = create_element('output');
    output_user_weight = function() {
      return output_element.value = Number(input_element.value);
    };
    update_user_weight = function() {
      return set_user_weight(thesis_index, output_user_weight());
    };
    update_user_weight();
    input_element.addEventListener('input', output_user_weight);
    input_element.addEventListener('change', update_user_weight);
    return create_element('div', {
      'class': 'col-12 col-sm-6'
    }, [
      create_element('label', {
        'for': input_id
      }, ['Gewichtung:']), output_element, input_element
    ]);
  };

  create_radio_element = function(name, value, text, change_listener) {
    var attributes, checked, input_element, radio_element;
    checked = value === DEFAULT_USER_POSITION;
    attributes = {
      'class': 'form-check-input',
      'type': 'radio',
      'name': name,
      'value': value
    };
    if (checked) {
      attributes['checked'] = '';
      change_listener(value);
    }
    input_element = create_element('input', attributes, []);
    radio_element = create_element('div', {
      'class': 'form-check form-check-inline'
    }, [
      create_element('label', {
        'class': 'form-check-label'
      }, [input_element, text])
    ]);
    radio_element.addEventListener('change', function() {
      if (input_element.checked) {
        return change_listener(value);
      }
    });
    return radio_element;
  };

  create_user_position_element = function(thesis_index) {
    var radio_name, user_position_listener;
    radio_name = `thesis_${thesis_index}-position`;
    user_position_listener = function(user_position) {
      return set_user_position(thesis_index, user_position);
    };
    return create_element('div', {
      'class': 'col-12 col-sm-6'
    }, [create_radio_element(radio_name, AGREE, 'Ja', user_position_listener), create_radio_element(radio_name, NEUTRAL, 'Neutral', user_position_listener), create_radio_element(radio_name, DISAGREE, 'Nein', user_position_listener), create_radio_element(radio_name, SKIP, 'Ignorieren', user_position_listener)]);
  };

  create_thesis_element = function(thesis, thesis_index, number_of_theses) {
    return create_element('div', {
      'class': 'card my-2'
    }, [
      create_element('div', {
        'class': 'card-header bg-secondary text-white'
      }, [create_element('strong', {}, [thesis_index + 1]), '/', number_of_theses, ': ', create_element('strong', {}, [thesis.topic])]), create_element('div', {
        'class': 'card-body py-0'
      }, [
        create_element('p', {
          'class': 'card-text h5 py-2'
        }, [thesis.statement])
      ]), create_element('div', {
        'class': 'card-footer'
      }, [
        create_element('div', {
          'class': 'row'
        }, [create_user_position_element(thesis_index), create_user_weight_element(thesis_index)])
      ])
    ]);
  };

  setup_election_with_data = function(election_data) {
    var number_of_theses, theses_element;
    election = election_data;
    number_of_theses = election_data.theses.length;
    user_positions = Array(number_of_theses).fill(DEFAULT_USER_POSITION);
    user_weights = Array(number_of_theses).fill(DEFAULT_USER_WEIGHT);
    party_ratios = Array(election_data.parties.length).fill(0/0);
    theses_element = get_element_by_id('theses');
    remove_child_nodes_of(theses_element);
    election_data.theses.forEach(function(thesis, thesis_index, theses) {
      var thesis_element;
      thesis_element = create_thesis_element(thesis, thesis_index, theses.length);
      return theses_element.appendChild(thesis_element);
    });
    return update_parties();
  };

  http_get_url = function(url) {
    return new Promise(function(resolve, reject) {
      var request;
      request = new XMLHttpRequest();
      request.onload = function() {
        if (request.status === 200) {
          resolve(request.response);
        } else {
          reject(Error(request.statusText));
        }
      };
      request.onerror = function() {
        reject(Error('Network Error'));
      };
      request.open('GET', url, true);
      request.send(null);
    });
  };

  http_get_json_url = function(json_url) {
    return http_get_url(json_url).then(JSON.parse);
  };

  setup_election_with_url = function(election_data_url) {
    return http_get_json_url(election_data_url).then(setup_election_with_data);
  };

  setup_election_with_id = function(election_id) {
    return setup_election_with_url(`wahlen/${election_id}.json`);
  };

  search_parameters = {};

  location.search.substr(1).split('&').forEach(function(parameter) {
    var key, value;
    [key, value] = parameter.split('=');
    return search_parameters[key] = value;
  });

  setup_election_with_id(search_parameters.wahl);

}).call(this);
