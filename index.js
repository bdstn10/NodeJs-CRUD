const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
const db = require('./db_config');
const url = require('url');

http.createServer((req, res) => {
    const homePages = ['/index', '/home', '/'];

    // Cek apakah requested url ada dalam kategori homePage 
    if (homePages.includes(req.url)) {
        // Jika ada, ubah urlnya menjadi 'index'
        req.url = '/index';
    }

    // Tangani jika ada permintaan halaman dari user
    let filename = '.' + req.url + '.html';
    if (req.method == 'GET' && !req.url.includes('?')) {
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
                    if (results.length > 0) {
                        // Response ketika username dan password benar
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(`
                                <title>Login Successfully</title>
                                <h1>Selamat Datang <em>${name}</em>, Anda Berhasil Login</h1>
                                <p><a href="/tambahAkun">Tambah Akun User</a></p>
                                <p><a href="/ubahSandi?id=${results[0]['id']}">Ubah Sandi</a></p>
                                <p><a href="/login">Logout</a></p>
                                <p><a href="/delete?id=${results[0]['id']}" style="color: red;" onclick="return confirm('Apakah anda yakin ingin menghapus akun ini?')">Delete Account</a></p>
                            `);

                        return res.end();
                    } else {
                        // Response ketika username dan password salah
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(`
                                <title>Login Failed</title>
                                <h1>Maaf, anda gagal login</h1>
                                <a href="/login">Login Ulang</a>
                                `)

                        return res.end();

                    }
                })
            })
        });
    }

    // Tangani jika user ingin menambahkan akun baru 
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

    // Tangani jika user ingin mengubah sandi
    if (req.url.includes('/ubahSandi')) {
        // Penanganan jika user merequest dengan metode GET (Mengakses halaman ubah sandi)
        if (req.method == 'GET') {
            // Berikan halaman ubah sandi dengan isi dari ubahSandi.html
            fs.readFile('ubahSandi.html', (err, data) => {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            })
        }

        // Penanganan jika user mengklik tombol ubah sandi
        if (req.method == 'POST') {
            // Buat variabel untuk menyimpan data yang dimasukkan user
            let body = ''
            req.on('data', (data) => {
                body += data;
            })

            req.on('end', () => {
                // Tangkap semua data yang diperlukan dalam operasi database nanti
                let id = url.parse(req.url, true)['query']['id'];
                let userData = querystring.parse(body);

                let oldPasswd = userData.oldPasswd;
                let newPasswd = userData.newPasswd;

                // Cek apakah password lama yang user masukkan sama dengan yang di db
                let querySatu = `SELECT * FROM users WHERE id = ${id}`;

                db.query(querySatu, (err, results) => {
                    // Cek apakah password lama yg dimasukkan sama dengan yg di db
                    if (oldPasswd == results[0]['password']) {
                        // Update password jika password lama sama dengan yang ada di db
                        let queryDua = `UPDATE users SET password = '${newPasswd}' WHERE users.id = ${id}`
                        db.query(queryDua, (err, results) => {
                            if (err) {
                                console.error(err);
                            }
                            // Berikan feedback kepada user jika berhasil mengubah password
                            if (results.affectedRows > 0) {
                                res.write(`<script>alert("Berhasil mengubah password")</script>`);
                                res.write(`<a href="/login">Login Ulang</a>`)

                                return res.end();
                            }
                        })
                    } else {
                        // Beri response jika password lama berbeda dengan yg di db
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(`<script>alert('Password lama salah!')</script>`);
                        res.write(`<a href="/ubahSandi?id=${id}">Coba Lagi</a>`);

                        res.end();
                    }
                })
            })
        }

    }

    // Tangani jika user ingin menghapus akun
    if (req.url.includes('/delete')) {
        // Tangkap id pengguna
        let id = url.parse(req.url, true)['query']['id'];

        // Hapus akun pengguna di db berdasarkan idnya
        db.connect(err => {
            if (err) {
                console.error(err);
            }

            let query = `DELETE FROM users WHERE id = ${id}`;
            db.query(query, (err, results) => {
                if (err) {
                    return console.error(err);
                }

                // Buat feedback kepada user jika berhasil hapus data
                if (results.affectedRows > 0) {
                    res.write(`<script>alert("Berhasil menghapus akun anda!")</script>`);
                    res.write(`<a href="/login">Login Ulang</a>`)

                    return res.end();
                }
            })
        })
    }
}).listen(8080);

console.log("Server listening on http://localhost:8080");