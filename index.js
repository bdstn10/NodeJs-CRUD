const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
const db = require('./db_config');

http.createServer((req, res) => {
    const homePages = ['/index', '/home', '/'];

    // Cek apakah requested url ada dalam kategori homePage 
    if (homePages.includes(req.url)) {
        // Jika ada, ubah urlnya menjadi 'index'
        req.url = '/index';
    }

    let filename = '.' + req.url + '.html';

    // Tangani jika user pengirim permintaan login
    if (req.url == '/login' && req.method == 'POST') {
        let body = ''

        req.on('data', data => {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                request.connection.destroy();
        });

        req.on('end', () => {
            let postData = querystring.parse(body);

            db.connect(err => {
                if (err) {
                    console.error(err.message);
                }

                let name = postData['uname'];
                let passwd = postData['passwd'];

                let query = `SELECT * FROM users WHERE name = '${name}' AND password = '${passwd}'`;

                db.query(query, (err, results) => {
                    if (err) {
                        console.error(err.message);
                    }

                    // Tangani jika credential yg dimasukkan benar dan sebaliknya
                    if (results.length > 0) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write("<h1>Welcome User To Our System</h1>");

                        return res.end(`<a href="/login">Logout</a>`);
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write("<h1>Sorry, You're Failed To Login</h1>");

                        return res.end(`<a href="/login">Login Again</a>`);
                    }
                })
            })
        });
    }

    fs.readFile(filename, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end("<h1>404 Not Found!</h1>")

            return console.error(err);

        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(data);

        res.end();
    })
}).listen(8080);

console.log("Server listening on http://localhost:8080");