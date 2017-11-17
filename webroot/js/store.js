const current = {},
	list = {},
	cmds = {},
	store = {
		'stats': {
			'Clients': 0,
			'ClientsWifi': 0,
			'ClientsWifi24': 0,
			'ClientsWifi5': 0,
			'Firmwares': {},
			'Gateways': 0,
			'Models': {},
			'Nodes': 0
		}
	};

export default {store};

export function getNode (nodeid) {
	let node = {};

	if (list[nodeid]) {
		node = list[nodeid];
		if (current[nodeid]) {
			const cNode = current[nodeid];

			// eslint-disable-next-line no-underscore-dangle
			node._wireless = cNode.wireless;
			node.lastseen = cNode.lastseen;
		}
	} else {
		// eslint-disable-next-line camelcase
		node.node_id = nodeid;
		node.wireless = {};
		node.location = {};
		list[nodeid] = node;
	}

	return node;
}

export function updateNode (node, system) {
	if (system) {
		list[node.node_id] = node;
	} else {
		current[node.node_id] = node;
	}
}


export function getNodes () {
	return Object.keys(list).map(getNode);
}

export function updateCMD (cmd) {
	cmds[cmd.id] = cmd;
}

export function getCMDs () {
	return cmds;
}
