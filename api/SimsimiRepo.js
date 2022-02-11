const axiosClient = require('../axiosClient');

module.exports = {
	talk(text) {
		return axiosClient.get('/', { params: { text: text, lc: 'vn' } });
	},
};
