const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const port = process.env.PORT || 3000;

// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next) => {
    console.log('inside the logger middleware');
    next();
}

const verifyToken = (req,res,next) => {
    const token = req.cookie?.token;
    if(!token) {
        return res.status(401).send({message: 'unauthorized access'})
    }

    jwt.verify.apply(token, process.env.JWT_ACCESS_SECRET, (err, decoded)=> {
        if(err){
            return res.status(401).send({message:'unauthorized access'})
        }
        req.decoded = decoded;
        next();
    })

}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v9x5iie.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const jobsCollection = client.db('careerCode').collection('jobs');
        const applicationCollection = client.db('careerCode').collection('applications')

        // jwt token related api
        app.post('/jwt', async (req, res) => {
            const userInfo = req.body;

            const token = jwt.sign(userInfo, process.env.JWT_ACCESS_SECRET, {expiresIn: '2h'})

            res.cookie('token', token, {
                httpOnly: true,
                secure: false
            })

            res.send({success:true}) // Sending a success message to the client
        })

        //  Getting all the jobs
        app.get('/jobs', async (req, res) => {

            const email = req.query.email; // Getting the query parameter email from the URL
            const query = {}
            if (email) {
                query.hr_email = email // If an email is there in the query parameter then set it in the query variable
            }
            const result = await jobsCollection.find(query).toArray() // Fetch jobs from DB based on query and saves here
            res.send(result); // Sending fetched data to the client
        })

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id; //  Getting the ID from URL parameters
            console.log('inside application api', req.cookies);
            const query = { _id: new ObjectId(id) } // Converting the id into mongodb ID 
            const result = await jobsCollection.findOne(query) // Getting the data that matches the id and saving here
            res.send(result); // Sending the data to the client
        })

        app.post('/jobs', async (req, res) => {
            const newJob = req.body; // Getting the data from the request and storing here 
            const result = await jobsCollection.insertOne(newJob); // Sending the newJob data in the database and saving the confirmation message here
            res.send(result) // sending the confirmation message to the client
        })

        app.get('/applications/job/:job_id', async (req, res) => {
            const job_id = req.params.job_id;
            const query = { id: job_id }
            const result = await applicationCollection.find(query).toArray(); // Commanding to find the data matches with the query and saves here
            res.send(result) // Sending the data to the client
        })

        app.get('/applications', logger, async (req, res) => {
            const email = req.query.email; // Extracting the email from the URL query parameter and storing the email here

            const query = { applicant: email }

            const result = await applicationCollection.find(query).toArray() // Searching all the collection to find the data that matches the query and saves here

            // bad way to aggregate data
            for (const application of result) {
                const id = application.id; // Getting the id from the application object
                const jobQuery = { _id: new ObjectId(id) } // Converting the id into mongodb id
                const job = await jobsCollection.findOne(jobQuery); // Commanding to find the job that matches the jobQuery
                application.company = job.company
                application.title = job.title
                application.company_logo = job.company_logo
            }
            res.send(result) // Sending the data to the client
        })

        // Job applications related apis
        app.post('/applications', async (req, res) => {
            const application = req.body; // Getting the data from the request and storing here 
            const result = await applicationCollection.insertOne(application) //  Sending teh data to the mongodb and saving the confirmation message and unique id here
            res.send(result) // Sending the confirmation message and unique id to the client
        })

        app.patch('/applications/:id', async (req, res) => {
            const id = req.params.id; // Getting Id from the req
            const filter = { _id: new ObjectId(id) } // Converting id into mongoDb id
            const updatedDoc = { // Defining What to update
                $set: {
                    status: req.body.status
                }
            }

            const result = await applicationCollection.updateOne(filter, updatedDoc) // Commanding mongodb to update and saving the confirmation message here
            res.send(result); // Sending the confirmation message to the client
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Career Code Cooking') // 
})

app.listen(port, () => {
    console.log(`Career Code server is running on Port ${port}`);
})