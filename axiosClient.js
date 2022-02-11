const axios = require('axios');
const baseURL = 'https://api.simsimi.net';
const prefix = '/v2';
const axiosClient = axios.create({
	baseURL: baseURL + prefix,
	headers: {
		'content-type': 'application/json',
	},
});
module.exports = axiosClient;
