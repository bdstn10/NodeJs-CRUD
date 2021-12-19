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

    // Tangani jika ada permintaan halaman dari user
    let filename = '.' + req.url + '.html';
    if (req.method == 'GET') {
        fs.readFile(filename, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end("<h1>404 Not Found!</h1>")

                return console.error(err);

            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);

            return res.end();
        })
    }

    // Tangani jika user mengirim permintaan login
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
                    let response = ''
                    if (results.length > 0) {
                        response = 'berhasil.html'
                    } else {
                        response = 'gagal.html'
                    }

                    fs.readFile(response, (err, file) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/html' });
                            res.end("<h1>404 Not Found!</h1>")

                            return console.error(err);

                        }

                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(file);

                        return res.end();
                    })
                })
            })
        });
    }

    // Tangani jika user ingin menambah akun user 
    if (req.url == '/tambahAkun' && req.method == 'POST') {
        let body = '';
        req.on('data', data => {
            body += data;
        })
        req.on('end', () => {
            let postData = querystring.parse(body)
            let username = postData['uname'];
            let password = postData['passwd'];

            // Buat query untuk menambah user ke database
            let query = `INSERT INTO users (id, name, password) VALUES (NULL, '${username}', '${password}')`;

            db.query(query, (err, results) => {
                if (err) {
                    return console.error(err.message);
                }

                if (results.affectedRows > 0) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });

                    res.write(`<p>Berhasil menambahkan akun <em>${username}</em></p>`);
                    res.write('<a href="/tambahAkun">Tambahkan Akun Lagi</a>')
                    res.end();
                }
            })
        })
    }

}).listen(8080);

console.log("Server listening on http://localhost:8080");