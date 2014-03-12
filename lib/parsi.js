var Set = require('./set'),
	Lexi = require('./lexi');

function Parsi(grammar, mode) {
	this.nonterminals = new Set(grammar.map(function(production) {
		return production.lhs;
	}));

	this.terminals = new Set(grammar.reduce(function(acc, production) {
		return acc.concat(production.rhs);
	}, [])).difference(this.nonterminals).add(Parsi.endSymbol);

	this.grammar = {};
	for(var i = 0; i < grammar.length; i++) {
		if(this.grammar[grammar[i].lhs] === undefined) {
			this.grammar[grammar[i].lhs] = new Set();
		}

		this.grammar[grammar[i].lhs].add(grammar[i]);
	}

	if(this.grammar[Parsi.startSymbol] === undefined) {
		throw new Error('Start production is not defined.');
	} else if(this.grammar[Parsi.startSymbol].length > 1) {
		throw new Error('Start production should contains only one production.');
	}

	this.startProduction = this.grammar[Parsi.startSymbol].elements[0];
	this.mode = new mode(this.terminals, this.nonterminals, this.grammar, this.startProduction);
	this.parse = this.mode.parse.bind(this.mode);
}

Parsi.startSymbol = 'START';
Parsi.endSymbol = '$end';

function Production(lhs, rhs, action) {
	this.lhs = lhs;
	this.rhs = rhs;
	this.action = (action || function(value) {
		return value;
	});
}

function Lookahead(terminals, nonterminals, grammar) {
	this.terminals = terminals;
	this.nonterminals = nonterminals;
	this.grammar = grammar;
}

Lookahead.prototype.first = function(symbols) {
	if(this.firsts === undefined) {
		this.firsts = this.nonterminals.elements.reduce(function(acc, nonterminal) {
			acc[nonterminal] = new Set();
			return acc;
		}, this.terminals.elements.reduce(function(acc, terminal) {
			acc[terminal] = new Set(terminal);
			return acc;
		}, {}));

		for(var lhs in this.grammar) {
			for(var i = 0; i < this.grammar[lhs].length; i++) {
				var firstSymbol = this.grammar[lhs].elements[i].rhs[0];
				if(this.terminals.contains(firstSymbol)) {
					this.firsts[this.grammar[lhs].elements[i].lhs].add(firstSymbol);
				} else if(this.nonterminals.contains(firstSymbol)) {
					this.firsts[this.grammar[lhs].elements[i].lhs].union(this.firsts[firstSymbol]);
					this.firsts[firstSymbol].on('add', (function(to, symbol) {
						this.firsts[to].add(symbol);
					}).bind(this, this.grammar[lhs].elements[i].lhs));
				}
			}
		}
	}

	return (symbols[0] && this.firsts[symbols[0]]) || new Set();
};

function LR(terminals, nonterminals, grammar, startProduction) {
	this.terminals = terminals;
	this.nonterminals = nonterminals;
	this.grammar = grammar;
	this.startProduction = startProduction;
	this.lookahead = new Lookahead(terminals, nonterminals, grammar);
}

LR.actions = {
	accept: 0,
	reduce: 1,
	shift: 2,
	goto: 3
};

LR.prototype.closure = function(items) {
	var items = new Set(items.elements); // mutable hell! @todo Immutable sets, please!

	var changed;
	do {
		var changed = false;

		for(var i = 0; i < items.elements.length; i++) {
			var item = items.elements[i];

			if(!this.nonterminals.contains(item.markedSymbol)) {
				continue;
			}

			var lookaheads = this.lookahead.first(item.markedRhs.slice(1).concat(item.lookahead));
			for(var n = 0; n < lookaheads.elements.length; n++) {
				var lookahead = lookaheads.elements[n];
				for(var a = 0; a < this.grammar[item.markedSymbol].elements.length; a++) {
					var production = this.grammar[item.markedSymbol].elements[a];
					var nextItem = new Item(production, 0, [lookahead]);
					if(!items.contains(nextItem)) {
						items.add(nextItem);
						changed = true;
					}
				}
			}
		}
	} while(changed);

	return items;
};

LR.prototype.goto = function(items, symbol) {
	var gotos = new Set();
	for(var i = 0; i < items.length; i++) {
		var item = items.elements[i];
		if(item.markedSymbol === symbol) {
			gotos.add(item.shiftMarker());
		}
	}

	return this.closure(gotos);
};

LR.prototype.states = function() {
	var s0 = new State(0, this.closure(new Set([new Item(this.startProduction, 0, [Parsi.endSymbol])])));
	var states = [s0];
	var items = new Set([s0]);
	var todo = [s0];
	while(todo.length > 0) {
		var state = todo.shift();
		for(var i = 0; i < state.items.length; i++) {
			var item = state.items.elements[i];
			if(item.markedSymbol !== undefined) {
				var newState = new State(states.length, this.goto(state.items, item.markedSymbol));
				if(items.contains(newState.items)) { // @todo Much ugly!
					var b = -1; // @todo Find a better solution
					for(var a = 0; a < items.elements.length; a++) {
						if(JSON.stringify(items.elements[a]) == JSON.stringify(newState.items)) {
							b = a;
						}
					}
					if(b !== -1) {
						state.addMove(b, item.markedSymbol);
					}
				}
				else if(newState.items.length > 0 && !items.contains(newState.items)) {
					state.addMove(newState.id, item.markedSymbol);
					states.push(newState);
					items.add(newState.items);
					todo.push(newState);
				}
			}
		}
	}

	return states;
};

LR.prototype.table = function(states) {
	var table = {};
	for(var i = 0; i < states.length; i++) {
		var state = states[i];
		for(var n = 0; n < state.items.length; n++) {
			var item = state.items.elements[n];
			if(item.markedSymbol === undefined) {
				if(item.production == this.startProduction && item.production.markedSymbol === undefined) {
					table[i + ',' + Parsi.endSymbol] = [LR.actions.accept];
				} else {
					table[i + ',' + item.lookahead] = [LR.actions.reduce, item.production];
				}
			}
		}

		for(var symbol in state.moves) {
			if(this.terminals.contains(symbol)) {
				table[i + ',' + symbol] = [LR.actions.shift, state.moves[symbol]];
			} else {
				table[i + ',' + symbol] = [LR.actions.goto, state.moves[symbol]];
			}
		}
	}

	return table;
};

LR.prototype.parse = function(tstack, vstack) {
	tstack.push(Parsi.endSymbol);
	var table = this.table(this.states()), stack = [0];

	do {
		var action = table[stack[0] + ',' + tstack[0]];

		switch(action && action[0]) {
			case LR.actions.shift:
				stack.unshift(vstack.shift());
				stack.unshift(tstack.shift());
				stack.unshift(action[1]);
				break;

			case LR.actions.reduce:
				var values = [];
				for(var i = 0; i < action[1].rhs.length; i++) {
					stack.shift();
					stack.shift();
					values.unshift(stack.shift());
				}

				stack.unshift(action[1].action.apply(null, values));
				stack.unshift(action[1].lhs);
				stack.unshift(table[stack[2] + ',' + action[1].lhs][1]);
				break;

			case LR.actions.accept && tstack[0] === Parsi.endSymbol:
				return stack[2];
				break;

			default:
				throw new Error("Syntax error. Unexpected '" + tstack[0] + "'.");
		}
	} while(true);
};

function Item(production, marker, lookahead) {
	this.production = production;
	this.marker = marker;
	this.lookahead = lookahead; // Must be array!!!
	this.markedRhs = this.production.rhs.slice(this.marker);
	this.markedSymbol = this.markedRhs[0];
}

Item.prototype.shiftMarker = function() {
	return new Item(this.production, this.marker + 1, this.lookahead);
};

function State(id, items) {
	this.id = id;
	this.items = items;
	this.moves = {};
}

State.prototype.addMove = function(to, symbol) {
	this.moves[symbol] = to;
};

module.exports = {
	Parser: Parsi,
	Production: Production,
	modes: {
		LR: LR
	}
};