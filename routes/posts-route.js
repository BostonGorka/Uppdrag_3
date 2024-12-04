import http from 'http';
import { cleanupHTMLOutput, getRequestBody } from '../utilities.js';
import { dbo } from '../index.js';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';

/**
 * 
 * @param {string[]} pathSegments 
 * @param {http.IncomingMessage} request 
 * @param {http.IncomingMessage} response 
 */
export async function handlePostRoute(pathSegments, url, request, response) {
    let nextSegment = pathSegments.shift();

    if (!nextSegment) {

        if (request.method === 'POST') {
            let body = await getRequestBody(request);

            let params = new URLSearchParams(body);
            
            //kollar om dessa variabler är tillgängliga att hämtas eller ändras
            if (!params.get('userName') || !params.get('title')
                || !params.get('breadText')) {

                response.writeHead(400, { 'Content-Type': 'text/plain' });
                response.write('400 Bad Request');
                response.end();
                return;
            }
            //hämtar variablerna från ForumPosts i mongodb
            let result = await dbo.collection('ForumPosts').insertOne({
                'name': params.get('userName'),
                'title': params.get('title'),
                'breadText': params.get('breadText')
            });

            //skriver ut resultatet utifrån inläggets id
            response.writeHead(303, { 'Location': '/posts/' + result.insertedId });
            response.end();
            return;
        }

        if (request.method === 'GET') {
            let filter = {};
            //filtrerar query utefter id som finns i mongodb för respektive inlägg
            if (url.searchParams.has('user')) {
                filter._id = new ObjectId(url.searchParams.get('user'));
            }


            //skapar array med variablerna som finns i ForumPosts på mongodb
            let documents = await dbo.collection('ForumPosts').find(filter).toArray();

            let postsString = '';
            //skapar lista med alla inlägg från hela forumet 
            for (let i = 0; i < documents.length; i++) {
                postsString += '<li><a href="/posts/' + cleanupHTMLOutput(documents[i]._id.toString()) + '">' + ' title: ' + cleanupHTMLOutput(documents[i].title) + '</a></li>';
            }
            //läser posts filen från templates och gör den till en string
            let template = (await fs.readFile('templates/posts.volvo')).toString();

            //byter ut %{posts}% med listan som skapades i postsString
            template = template.replaceAll('%{posts}%', postsString);

            //förfrågan godkänns och utförs
            response.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            response.write(template);
            response.end();
            return;




        }
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.write('405 Method Not Allowed');
        response.end();
        return;
    }
    //kollar om http metoden inte är lika med GET
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.write('405 Method Not Allowed');
        response.end();
        return;
    }
    let profileDocument;
    //kollar om ett id är lika med segmentet
    try {
        profileDocument = await dbo.collection('ForumPosts').findOne({
            "_id": new ObjectId(nextSegment)
        });
    } catch (e) {
        //om inget matchar skrivs ett 404 not found ut och avslutar svaret
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.write('404 Not Found');
        return;
    }
    //Kollar om profileDocument finns
    if (!profileDocument) {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.write('404 Not Found');
        response.end();
        return;
    }
    //Byter ut alla %{}%  mot respektive innehåll i variablerna från mongodb
    let template = (await fs.readFile('templates/post-list.volvo')).toString();
    template = template.replaceAll('%{userName}%', cleanupHTMLOutput(profileDocument.name));
    template = template.replaceAll('%{postTitle}%', cleanupHTMLOutput(profileDocument.title));
    template = template.replaceAll('%{breadText}%', cleanupHTMLOutput(profileDocument.breadText));

    //förfrågan godkänns och utförs
    response.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
    response.write(template);
    response.end();
    return;

}