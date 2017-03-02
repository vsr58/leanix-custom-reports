/*
 * based on https://dev.leanix.net/docs/authentication
 */

'use strict';

const fs = require('fs');
const https = require('https');

// read link.properties file
const envFilePath = './link.properties';
if (!fs.existsSync(envFilePath)) {
	console.error('link.properties file is missing. Please create one with default_link.properties as template.');
	return;
}
const envFile = fs.readFileSync(envFilePath, 'UTF-8');
const keyValuePairs = getKeyValuePairs(envFile);

// extract keyValues from link.properties file
const instance = keyValuePairs.INSTANCE;
const workspace = keyValuePairs.WORKSPACE;
const apiToken = keyValuePairs.API_TOKEN;
const host = keyValuePairs.HOST;

// validate keyValues
if (!instance) {
	console.error('INSTANCE is missing in .env file.');
	return;
}
if (!workspace) {
	console.error('WORKSPACE is missing in .env file.');
	return;
}
if (!host) {
	console.error('HOST is missing in .env file.');
	return;
}
if (!apiToken) {
	console.error('API_TOKEN is missing in .env file.');
	return;
}

// query access token & write file
const options = {
	host: instance.substring(8), // w/o protocol
	method: 'POST',
	path: '/services/mtm/v1/oauth2/token',
	headers: {
		'authorization': 'Basic ' + btoa('apitoken:' + apiToken),
		'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
	}
}
const body = 'grant_type=client_credentials';
const request = https.request(options, res => {
		const error = checkResponse(res);
		if (error) {
			printError(error);
			res.resume();
			return;
		}
		// extract response body
		res.setEncoding('utf8');
		let rawData = '';
		res.on('data', chunk => rawData += chunk);
		res.on('end', () => {
			try {
				const targetFile = './link.html';
				const parsedData = JSON.parse(rawData);
				// write target file file
				writeFile(keyValuePairs, parsedData.access_token, targetFile);
				console.info(targetFile + ' has been written.');
			} catch (e) {
				printError(e);
			}
		});
	});
request.write(body);
request.end();
request.on('error', printError);

function getKeyValuePairs(from) {
	const a = from.split('\n');
	let result = {};
	for (let i = 0, len = a.length; i < len; i++) {
		const str = a[i].trim();
		const idx = str.indexOf('=');
		if (idx < 0) {
			continue;
		}
		const key = str.substring(0, idx);
		if (!key || key.length === 0 || key.startsWith('#')) {
			continue;
		}
		result[key] = str.substring(idx + 1);
	}
	return result;
}

function btoa(str) {
	return new Buffer(str).toString('base64');
}

function checkResponse(res) {
	const statusCode = res.statusCode;
	const contentType = res.headers['content-type'];
	let error;
	if (statusCode !== 200) {
		error = new Error('Request Failed.\nStatus Code: ' + statusCode);
	} else if (!/^application\/json/.test(contentType)) {
		error = new Error('Invalid content-type.\nExpected application/json but received ' + contentType);
	}
	return error;
}

function printError(e) {
	console.log('Error:');
	console.log(e);
}

function writeFile(keyValuePairs, accessToken, targetFile) {
	const host = keyValuePairs.HOST;
	const baseUrl = keyValuePairs.INSTANCE + '/' + keyValuePairs.WORKSPACE;
	const apiBaseUrl = baseUrl + '/api/v1';
	const customQueryParams = keyValuePairs.CUSTOM_QUERY_PARAMS;
	const useCustomQuery = customQueryParams ? true : false;
	const str = '<!DOCTYPE html>'
		 + '<html lang="en">'
		 + '<head>'
		 + '<meta http-equiv="refresh" content="0;URL=\'' + host + '/?'
		 + (useCustomQuery ? customQueryParams + '&' : '')
		 + 'baseUrl=' + baseUrl
		 + '&apiBaseUrl=' + apiBaseUrl
		 + '&token=' + accessToken + '\'" />'
		 + '</head>'
		 + '<body>'
		 + '<p>This page automatically refreshes itself.</p>'
		 + '</body>'
		 + '</html>';
	fs.writeFileSync(targetFile, str);
}
