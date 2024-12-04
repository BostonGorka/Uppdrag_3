import 'dotenv/config';
import http from 'http';
import { MongoClient } from 'mongodb';
import { getRequestBody } from './utilities.js';
import fs from 'fs/promises';
import { handlePostRoute } from './routes/posts-route.js';

let dbConn = await MongoClient.connect(process.env.MONGODB_CONNECTION_STRING);
export let dbo = dbConn.db(process.env.MONGODB_DATABASE_NAME);

//funktion som hanterar request och response (paramterar)
async function handleRequest(request, response) {

	let url = new URL(request.url, 'http://' + request.headers.host);
	let path = url.pathname;
	let pathSegments = path.split('/').filter(function (segment) {
		if (segment === '' || segment === '..') {
			return false;
		} else {
			return true;
		}
	});


	let nextSegment = pathSegments.shift();
	//Kollar segment samt HTTP metod
	if (nextSegment === 'create-post') {
		if (request.method !== 'GET') {
			response.writeHead(405, { 'Content-Type': 'text/plain' });
			response.write('405 Method Not Allowed');
			response.end();
			return;
		}
		//läser in create-post filen från templates
		let template = (await fs.readFile('templates/create-post.volvo')).toString();

		//förfrågan godkänns och utförs
		response.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
		response.write(template);
		response.end();
		return;
	}
	//Kollar segment samt HTTP metod
	if (nextSegment === 'post-list') {
		if (request.method !== 'POST') {
			response.writeHead(405, { 'Content-Type': 'text/plain' });
			response.write('405 Method Not Allowed');
			response.end();
			return;
		}
		//läser in volvo filen post-list från mappen templates och gör den till en string 
		let template = (await fs.readFile('templates/post-list.volvo')).toString();

		//förfrågan godkänns och utförs
		response.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
		response.write(template);
		response.end();
		return;
	}

	//Kollar segment samt HTTP metod
	if (nextSegment === 'posts') {
		await handlePostRoute(pathSegments, url, request, response);
		return;
	}


}
//startar servern
let server = http.createServer(handleRequest);

server.listen(process.env.PORT);
