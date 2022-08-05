// Importing modules
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const db = require("./config/dbconn");
const { genSalt, compare, hash } = require("bcrypt");
const jwt = require("jsonwebtoken");
// Express app
const app = express();
// Express router
const router = express.Router();
// Configuration
const port = parseInt(process.env.Port) || 4000;
//
const secret = process.env.SecretKey;
//
app.use(router, cors(), express.json(), express.urlencoded({
        extended: true,
    })
);

app.use((req, res, next)=> {
    res.setHeader('Access-Control-Allow-Origin',
    '*');
    next();
});


//
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// home
router.get('/', (req, res)=> {
    res.status(200).sendFile(path.join(__dirname, 'views', 'index.html'));
});

//register
router.get('/register', (req, res)=> {
    res.status(200).sendFile(path.join(__dirname, 'views', 'register.html'));
});

//login
router.get('/login', (req, res)=> {
    res.status(200).sendFile(path.join(__dirname, 'views', 'login.html'));
});


// emailer system
router.post("/sendmail", async (req, res) => {
    let trs = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: `${process.env.email}`,
            pass: `${process.env.password}`,
        },
    });
    // emailed Message
    const details = await trs.sendMail({
            from: `${process.env.email}`,
            to: "www.moniquedampies132@gmail.com",
            subject: "Sending email from express API",
            text: `Testing if this works`,
        },
        (err, info) => {
            if (err) {
                console.log("Email was not sent");
            } else {
                console.log(`Email was ${info.response}`);
                res.send("Sent");
            }
        }
    );
});

// User registration
router.post('/register', bodyParser.json(),(req, res)=>{
    let emails = `SELECT email FROM users WHERE ?`;
    let email = {
        email: req.body.email
    }
    db.query(emails, email, async(err, results)=>{
        if(err) throw err
        // VALIDATION
        if (results.length > 0) {
            res.send("The provided email exists. Please enter another one");
            
        } else {
            const bd = req.body;
            let generateSalt = await genSalt();
            bd.userpassword = await hash(bd.userpassword, generateSalt);
            // Query
            const strQry = 
            `
            INSERT INTO users(firstname, lastname, gender, email, userpassword)
            VALUES(?, ?, ?, ?, ?);
            `;
            //
            db.query(strQry, 
                [bd.firstname, bd.lastname, bd.gender, bd.email, bd.userpassword],
                (err, results)=> {
                    if(err) throw err;
                    res.send(`number of affected row/s: ${results.affectedRows}`);
                })
        }
    })
})


// Login
router.post("/login", bodyParser.json(), (req, res) => {
    // const user = bd.email;
    // const password = bd.userpassword;
    const strQry = `
    SELECT firstname, gender, email, userpassword
    FROM users WHERE email = ?;
    `;
    db.query(strQry, req.body.email, (err, results) => {
        if (err) throw err;
        compare(req.body.userpassword, results[0].userpassword, (err, auth) => {
            if (auth) {
                const key = jwt.sign(JSON.stringify(results[0]), secret);
                res.json({
                    status: 200,
                    results: key,
                });
            } else {
                res.send("failed");
            }
        });
        // res.json({
        //     status: 200,
        //     results: results
        // })
    });
    /*
Have to compare: 
compare(req.body.userpassword, results.userpassword)
======
require('crypto').randomBytes(64).toString('hex')
*/
});



// Create new products
router.post("/products", bodyParser.json(), (req, res) => {
    const bd = req.body;
    bd.totalamount = bd.quantity * bd.price;
    // Query
    const strQry = `
    INSERT INTO products(prodName, prodUrl, quantity, price, totalamount, dateCreated)
    VALUES(?, ?, ?, ?, ?, ?);
    `;
    //
    db.query(
        strQry,
        [
            bd.prodName,
            bd.prodUrl,
            bd.quantity,
            bd.price,
            bd.totalamount,
            bd.dateCreated,
        ],
        (err, results) => {
            if (err) throw err;
            res.send(`number of affected row/s: ${results.affectedRows}`);
        }
    );
});



// Get all products
router.get("/products", (req, res) => {
    // Query
    const strQry = `
    SELECT id, prodName,prodUrl, quantity, price, totalamount, dateCreated, userid
    FROM products;
    `;
    db.query(strQry, (err, results) => {
        if (err) throw err;
        res.json({

             
            status: 200,
            results: results,
        });
    });
});



// Get one product
router.get("/products/:id", (req, res) => {
    // Query
    const strQry = `
    SELECT id, prodName, prodUrl, quantity, price, totalamount, dateCreated, userid
    FROM products
    WHERE id = ?;
    `;
    db.query(strQry, [req.params.id], (err, results) => {
        if (err) throw err;
        res.json({
            status: 200,
            results: results.length <= 0 ? "Sorry, no product was found." : results,
        });
    });
});


// Update product
router.put("/products", bodyParser.json(), (req, res) => {
    const bd = req.body;
    // Query
    const strQry = `UPDATE products
     SET ?
     WHERE id = ?`;

    db.query(strQry, [bd.id], (err, data) => {
        if (err) throw err;
        res.send(`number of affected record/s: ${data.affectedRows}`);
    });
});



// Delete product
router.delete("/products/:id", (req, res) => {
    // Query
    const strQry = `
    DELETE FROM products 
    WHERE id = ?;
    `;
    db.query(strQry, [req.params.id], (err, data, fields) => {
        if (err) throw err;
        res.send(`${data.affectedRows} row was affected`);
    });
});
/*
res.status(200).json({
    status: 200,
    results: results
})
*/

//
router.get('/verify', (req,res) => {
    const token = req.header("x-auth-token");

    if(!token){
        return res.status(400), res.send("400")
    }

    jwt.verify(token, process.env.SecretKey, (err, decodedToken) => {
        if (err) throw err
        res.json({decodedToken})
    });
})