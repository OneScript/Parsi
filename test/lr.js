var assert = require('assert');
var parsi = require('../lib/parsi');
var Set = require('../lib/set');

var lr = new parsi.modes.LR(new Set([';', 'id', ':=', '+', '$end']), new Set(['START', 'S', 'A', 'E']), {
	'START': new Set([
		{lhs: 'START', rhs: ['S'], action: function() {}}
	]),
	'S': new Set([
		{lhs: 'S', rhs: ['S', ';', 'A'], action: function() {}},
		{lhs: 'S', rhs: ['A'], action: function() {}}
	]),
	'A': new Set([
		{lhs: 'A', rhs: ['E'], action: function() {}},
		{lhs: 'A', rhs: ['id', ':=', 'E'], action: function() {}}
	]),
	'E': new Set([
		{lhs: 'E', rhs: ['E', '+', 'id'], action: function() {}},
		{lhs: 'E', rhs: ['id'], action: function() {}}
	])
}, {lhs: 'START', rhs: ['S'], action: function() {}});

describe('#LR', function() {
	it('should generate canonical collection', function() {
		var expected = [
			[
				{lhs: 'START', rhs: ['S'], marker: 0, lookahead: ['$end']},
				{lhs: 'S', rhs: ['A'], marker: 0, lookahead: ['$end']},
				{lhs: 'A', rhs: ['id', ':=', 'E'], marker: 0, lookahead: ['$end']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 0, lookahead: ['$end']},
				{lhs: 'E', rhs: ['id'], marker: 0, lookahead: ['$end']},
				{lhs: 'S', rhs: ['A'], marker: 0, lookahead: [';']},
				{lhs: 'A', rhs: ['id', ':=', 'E'], marker: 0, lookahead: [';']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 0, lookahead: ['+']},
				{lhs: 'E', rhs: ['id'], marker: 0, lookahead: [';']},
				{lhs: 'S', rhs: ['S', ';', 'A'], marker: 0, lookahead: ['$end']},
				{lhs: 'A', rhs: ['E'], marker: 0, lookahead: ['$end']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 0, lookahead: [';']},
				{lhs: 'E', rhs: ['id'], marker: 0, lookahead: ['+']},
				{lhs: 'S', rhs: ['S', ';', 'A'], marker: 0, lookahead: [';']},
				{lhs: 'A', rhs: ['E'], marker: 0, lookahead: [';']}
			],
			[
				{lhs: 'START', rhs: ['S'], marker: 1, lookahead: ['$end']},
				{lhs: 'S', rhs: ['S', ';', 'A'], marker: 1, lookahead: ['$end']},
				{lhs: 'S', rhs: ['S', ';', 'A'], marker: 1, lookahead: [';']}
			],
			[
				{lhs: 'S', rhs: ['A'], marker: 1, lookahead: ['$end']},
				{lhs: 'S', rhs: ['A'], marker: 1, lookahead: [';']}
			],
			[
				{lhs: 'A', rhs: ['E'], marker: 1, lookahead: ['$end']},
				{lhs: 'A', rhs: ['E'], marker: 1, lookahead: [';']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 1, lookahead: ['$end']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 1, lookahead: [';']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 1, lookahead: ['+']}
			],
			[
				{lhs: 'A', rhs: ['id', ':=', 'E'], marker: 1, lookahead: ['$end']},
				{lhs: 'A', rhs: ['id', ':=', 'E'], marker: 1, lookahead: [';']},
				{lhs: 'E', rhs: ['id'], marker: 1, lookahead: ['$end']},
				{lhs: 'E', rhs: ['id'], marker: 1, lookahead: [';']},
				{lhs: 'E', rhs: ['id'], marker: 1, lookahead: ['+']}
			],
			[
				{lhs: 'S', rhs: ['S', ';', 'A'], marker: 2, lookahead: [';']},
				{lhs: 'S', rhs: ['S', ';', 'A'], marker: 2, lookahead: ['$end']},
				{lhs: 'A', rhs: ['id', ':=', 'E'], marker: 0, lookahead: ['$end']},
				{lhs: 'A', rhs: ['id', ':=', 'E'], marker: 0, lookahead: [';']},
				{lhs: 'A', rhs: ['E'], marker: 0, lookahead: ['$end']},
				{lhs: 'A', rhs: ['E'], marker: 0, lookahead: [';']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 0, lookahead: ['$end']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 0, lookahead: [';']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 0, lookahead: ['+']},
				{lhs: 'E', rhs: ['id'], marker: 0, lookahead: ['$end']},
				{lhs: 'E', rhs: ['id'], marker: 0, lookahead: [';']},
				{lhs: 'E', rhs: ['id'], marker: 0, lookahead: ['+']}
			],
			[
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 2, lookahead: ['$end']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 2, lookahead: [';']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 2, lookahead: ['+']}
			],
			[
				{lhs: 'A', rhs: ['id', ':=', 'E'], marker: 2, lookahead: ['$end']},
				{lhs: 'A', rhs: ['id', ':=', 'E'], marker: 2, lookahead: [';']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 0, lookahead: ['$end']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 0, lookahead: [';']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 0, lookahead: ['+']},
				{lhs: 'E', rhs: ['id'], marker: 0, lookahead: ['$end']},
				{lhs: 'E', rhs: ['id'], marker: 0, lookahead: [';']},
				{lhs: 'E', rhs: ['id'], marker: 0, lookahead: ['+']}
			],
			[
				{lhs: 'S', rhs: ['S', ';', 'A'], marker: 3, lookahead: ['$end']},
				{lhs: 'S', rhs: ['S', ';', 'A'], marker: 3, lookahead: [';']}
			],
			[
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 3, lookahead: ['$end']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 3, lookahead: [';']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 3, lookahead: ['+']}
			],
			[
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 1, lookahead: ['$end']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 1, lookahead: [';']},
				{lhs: 'E', rhs: ['E', '+', 'id'], marker: 1, lookahead: ['+']},
				{lhs: 'A', rhs: ['id', ':=', 'E'], marker: 3, lookahead: ['$end']},
				{lhs: 'A', rhs: ['id', ':=', 'E'], marker: 3, lookahead: [';']}
			],
			[
				{lhs: 'E', rhs: ['id'], marker: 1, lookahead: ['$end']},
				{lhs: 'E', rhs: ['id'], marker: 1, lookahead: [';']},
				{lhs: 'E', rhs: ['id'], marker: 1, lookahead: ['+']}
			]
		];

		var states = lr.states();

		for(var i = 0; i < states.length; i++) {
			assert.equal(states[i].items.length, expected[i].length);
			for(var n = 0; n < states[i].items.length; n++) {
				var found = false;
				var item = states[i].items.elements[n];

				for(var a = 0; a < expected[i].length; a++) {
					if(item.production.lhs === expected[i][a].lhs && item.production.rhs.join(',') === expected[i][a].rhs.join(',') && item.marker === expected[i][a].marker && item.lookahead.join(',') === expected[i][a].lookahead.join(',')) {
						found = true;
						break;
					}
				}

				if(!found) {
					assert.fail(item.production.lhs + ' -> ' + item.production.rhs.join(' ') + ', ' + item.marker + ', ' + item.lookahead.join(' '), null, null);
				}
			}
		}
	});

	it('should generate parse table', function() {
		var expected = {
			'0,S': [parsi.modes.LR.actions.goto, 1],
			'0,A': [parsi.modes.LR.actions.goto, 2],
			'0,E': [parsi.modes.LR.actions.goto, 3],
			'5,A': [parsi.modes.LR.actions.goto, 8],
			'5,E': [parsi.modes.LR.actions.goto, 3],
			'7,E': [parsi.modes.LR.actions.goto, 10],
			'0,id': [parsi.modes.LR.actions.shift, 4],
			'1,;': [parsi.modes.LR.actions.shift, 5],
			'1,$end': [parsi.modes.LR.actions.accept],
			'2,;': [parsi.modes.LR.actions.reduce, {lhs: 'S', rhs: ['A']}],
			'2,$end': [parsi.modes.LR.actions.reduce, {lhs: 'S', rhs: ['A']}],
			'3,;': [parsi.modes.LR.actions.reduce, {lhs: 'A', rhs: ['E']}],
			'3,+': [parsi.modes.LR.actions.shift, 6],
			'4,+': [parsi.modes.LR.actions.reduce, {lhs: 'E', rhs: ['id']}],
			'4,:=': [parsi.modes.LR.actions.shift, 7],
			'3,$end': [parsi.modes.LR.actions.reduce, {lhs: 'A', rhs: ['E']}],
			'4,;': [parsi.modes.LR.actions.reduce, {lhs: 'E', rhs: ['id']}],
			'4,$end': [parsi.modes.LR.actions.reduce, {lhs: 'E', rhs: ['id']}],
			'5,id': [parsi.modes.LR.actions.shift, 4],
			'6,id': [parsi.modes.LR.actions.shift, 9],
			'7,id': [parsi.modes.LR.actions.shift, 11],
			'8,;': [parsi.modes.LR.actions.reduce, {lhs: 'S', rhs: ['S', ';', 'A']}],
			'8,$end': [parsi.modes.LR.actions.reduce, {lhs: 'S', rhs: ['S', ';', 'A']}],
			'9,;': [parsi.modes.LR.actions.reduce, {lhs: 'E', rhs: ['E', '+', 'id']}],
			'9,+': [parsi.modes.LR.actions.reduce, {lhs: 'E', rhs: ['E', '+', 'id']}],
			'9,$end': [parsi.modes.LR.actions.reduce, {lhs: 'E', rhs: ['E', '+', 'id']}],
			'10,;': [parsi.modes.LR.actions.reduce, {lhs: 'A', rhs: ['id', ':=', 'E']}],
			'10,+': [parsi.modes.LR.actions.shift, 6],
			'10,$end': [parsi.modes.LR.actions.reduce, {lhs: 'A', rhs: ['id', ':=', 'E']}],
			'11,;': [parsi.modes.LR.actions.reduce, {lhs: 'E', rhs: ['id']}],
			'11,+': [parsi.modes.LR.actions.reduce, {lhs: 'E', rhs: ['id']}],
			'11,$end': [parsi.modes.LR.actions.reduce, {lhs: 'E', rhs: ['id']}]
		};

		var table = lr.table(lr.states());

		assert.equal(Object.keys(table).length, Object.keys(expected).length);

		for(var item in table) {
			assert.equal(table[item][0], expected[item][0]); // mode

			if(table[item][0] === parsi.modes.LR.actions.reduce) {
				assert.equal(table[item][1].lhs, expected[item][1].lhs);
				assert.deepEqual(table[item][1].rhs, expected[item][1].rhs);
			} else {
				assert.equal(table[item][1], expected[item][1]);
			}
		}
	});

	it('should parse', function() {
		lr.parse(['id', ';', 'id'], ['21', ';', '21']);
	});
});