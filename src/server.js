// import express from 'express';
// import {MongoClient} from 'mongodb';
// import { db, connectToDb } from './db.js'
// // const articlesInfo=[
// //     {
// //     name: "learn-react",
// //     upvotes: 0,
// //     comments:[],
// //     },
// //     {
// //         name: "mongo-db",
// //         upvotes: 0,
// //         comments:[],
// //         },

// //     {
// //  name: "learn-node",
// //         upvotes: 0,
// //         comments:[],
// //     }

// // ]


// const app = express();
// app.use(express.json());

// app.get('/api/articles/:name', async (req,res)=>{
    
//     const {name} =req.params;
//     const client =new MongoClient('mongodb://127.0.0.1:27017');
//     await client.connect();

//     const db=client.db('react-blog-db');
//     const article=await db.collection('articles').findOne({name});
//     if(article){ 
//     res.json(article);
//     } else{
//         res.sendStatus(404);
//     }
//     });

//     app.put('/api/articles/:name/upvote', async (req, res) => {
//         const { name } = req.params;
       
//         const client = new MongoClient('mongodb://127.0.0.1:27017');
//         await client.connect();
    
//         const db = client.db('react-blog-db');
//         await db.collection('articles').updateOne({ name }, {
//             $inc: { upvotes: 1 },
//         });
//         const article = await db.collection('articles').findOne({ name });
    
//         if (article) {
//             article.upvotes += 1;
//             res.send(`The ${name} article now has ${article.upvotes} upvotes!!!`);
//         } else {
//             res.send('That article doesn\'t exist');
//         }
//     });

// // app.post('api/articles/:name/comments', (req,res) => {
// // const { name } = req.params;
// // const { postedBy, text } = req.body;
// // const article =articlesInfo.find( a => a.name === name);
// // if(article){
// //     article.comments.push({postedBy, text});
// //     res.send(article.comments);

// // }else{
// //     res.send('The article doesn\'t exist');
// // }
// // });


// app.post('/api/articles/:name/comments', async (req, res) => {
//     const { name } = req.params;
//     const { postedBy, text } = req.body;

//     await db.collection('articles').updateOne({ name }, {
//         $push: { comments: { postedBy, text } },
//     });
//     const article = await db.collection('articles').findOne({ name });

//     if (article) {
//         res.send(article.comments);
//     } else {
//         res.send('That article doesn\'t exist!');
//     }
// });
// // for upvote database


// // app.post('/hello', (req, res)=>{
// //     console.log(req.body.name);
// //     res.send(`Hello ${req.body.name}!`);

// // });

// // // app.get('/hello/:name/goodbye/:otherName', (req,res)=>{
// // console.log(req.params);
// //     const { name } = req.params;
// // res.send(`Hello ${name}!!`);
// // });

// // app.get('/hello/:name', (req, res) => {
// //     const { name } = req.params;
// //     res.send(`Hello ${name}!!`);
// // });








// app.listen(3000, ()=>{
//     console.log("server is listening in 3000 port");
// });



import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import express from 'express';
import 'dotenv/config';
import { db, connectToDb } from './db.js';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(
    fs.readFileSync('./credentials.json')
);
admin.initializeApp({
    credential: admin.credential.cert(credentials),
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
})

app.use(async (req, res, next) => {
    const { authtoken } = req.headers;

    if (authtoken) {
        try {
            req.user = await admin.auth().verifyIdToken(authtoken);
        } catch (e) {
            return res.sendStatus(400);
        }
    }

    req.user = req.user || {};

    next();
});

app.get('/api/articles/:name', async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;

    const article = await db.collection('articles').findOne({ name });

    if (article) {
        const upvoteIds = article.upvoteIds || [];
        article.canUpvote = uid && !upvoteIds.includes(uid);
        res.json(article);
    } else {
        res.sendStatus(404);
    }
});

app.use((req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.sendStatus(401);
    }
});

app.put('/api/articles/:name/upvote', async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;

    const article = await db.collection('articles').findOne({ name });

    if (article) {
        const upvoteIds = article.upvoteIds || [];
        const canUpvote = uid && !upvoteIds.includes(uid);
   
        if (canUpvote) {
            await db.collection('articles').updateOne({ name }, {
                $inc: { upvotes: 1 },
                $push: { upvoteIds: uid },
            });
        }

        const updatedArticle = await db.collection('articles').findOne({ name });
        res.json(updatedArticle);
    } else {
        res.send('That article doesn\'t exist');
    }
});

app.post('/api/articles/:name/comments', async (req, res) => {
    const { name } = req.params;
    const { text } = req.body;
    const { email } = req.user;

    await db.collection('articles').updateOne({ name }, {
        $push: { comments: { postedBy: email, text } },
    });
    const article = await db.collection('articles').findOne({ name });

    if (article) {
        res.json(article);
    } else {
        res.send('That article doesn\'t exist!');
    }
});

const PORT = process.env.PORT || 8000;

connectToDb(() => {
    console.log('Successfully connected to database!');
    app.listen(PORT, () => {
        console.log('Server is listening on port ' + PORT);
    });
})


//auto generate secure password
//6ol2vfaAbhfaQRXp