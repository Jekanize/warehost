import config from './config';
import {singelton as notify} from './element/notify';
import {render} from './gui';

const RECONNECT_AFTER = 5000,
	RETRY_QUERY = 100,
	query = [],
	eventMsgID = {},
	eventTo = {};

let connectionID = localStorage.getItem('session'),
	socket = null;

function newUUID () {
	/* eslint-disable */
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = Math.random() * 16 | 0,
			v = c === 'x' ? r : r & 0x3 | 0x8;
		return v.toString(16);
	});
	/* eslint-enable */
}

function correctMsg (obj) {
	if (!obj.id) {
		obj.id = newUUID();
	}
}

function onerror (err) {
	console.warn(err);
	// eslint-disable-next-line no-magic-numbers
	if (socket.readyState !== 3) {
		notify.send({
			'header': 'Verbindung',
			'type': 'error'
		}, 'Verbindung zum Server unterbrochen!');
	}
	render();
	socket.close();
}

function onopen () {
	render();
}


export function sendjson (obj, callback) {
	if (socket.readyState !== 1) {
		query.push({
			'callback': callback,
			'obj': obj
		});
		return;
	}
	correctMsg(obj);
	const socketMsg = JSON.stringify(obj);
	socket.send(socketMsg);
	if (typeof callback === 'function') {
		eventMsgID[obj.id] = callback;
	}
}

function onmessage (raw) {
	const msg = JSON.parse(raw.data),
		msgFunc = eventMsgID[msg.id],
		eventFuncs = eventTo[msg.subject];

	if (msg.subject === 'session_init') {
		if (connectionID === null) {
			connectionID = newUUID();
			localStorage.setItem('session', connectionID);
		}
		msg.id = connectionID;
		sendjson(msg);
		render();
		return;
	}

	if (msgFunc) {
		msgFunc(msg);
		delete eventMsgID[msg.id];
		render();
		return;
	}

	if (typeof eventFuncs === 'object' && eventFuncs.length > 0) {
		// eslint-disable-next-line guard-for-in
		for (const key in eventFuncs) {
			const func = eventFuncs[key];
			if (func) {
				func(msg);
			}
		}
		render();
		return;
	}

	notify.send('warning', `unable to identify message: ${raw.data}`);
	render();
}

function onclose () {
	console.log('socket closed by server');
	notify.send({
		'header': 'Verbindung',
		'type': 'warning'
	}, 'Verbindung zum Server beendet!');
	render();
	// eslint-disable-next-line no-use-before-define
	window.setTimeout(connect, RECONNECT_AFTER);
}

function connect () {
	socket = new window.WebSocket(config.backend);
	socket.onopen = onopen;
	socket.onerror = onerror;
	socket.onmessage = onmessage;
	socket.onclose = onclose;
}

window.setInterval(() => {
	const queryEntry = query.pop();
	if (queryEntry) {
		sendjson(queryEntry.obj, queryEntry.callback);
	}
	console.log('query length: ', query.length);
}, RETRY_QUERY);

connect();

export function getStatus () {
	if (socket) {
		return socket.readyState;
	}
	return 0;
}

export function setEvent (to, func) {
	eventTo[to] = [func];
}

export function addEvent (to, func) {
	if (typeof eventTo[to] !== 'object') {
		eventTo[to] = [];
	}
	eventTo[to].push(func);
}

export function delEvent (to, func) {
	if (typeof eventTo[to] === 'object' && eventTo[to].length > 1) {
		eventTo[to].pop(func);
	} else {
		eventTo[to] = [];
	}
}
