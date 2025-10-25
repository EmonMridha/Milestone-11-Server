const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());


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

        //  Getting all the jobs
        app.get('/jobs', async(req,res)=> {
            const cursor = jobsCollection.find(); // Emny
            const result = await cursor.toArray(); // Fetches all data from the DB and stores here
            res.send(result); // Sending fetched data to the client
        })

        app.get('/jobs/:id', async(req, res) => {
            const id = req.params.id; //  Getting the ID from URL parameters
            const query = {_id: new ObjectId(id)} // Converting the id into mongodb ID
            const result = await jobsCollection.findOne(query) // Getting the data that matches the id and saving here
            res.send(result); // Sending the data to the client
        })

        // Job applications related apis
        app.post('/applications', async(req,res) => {
            const application = req.body; // Storing the data from the request 
            const result = await applicationCollection.insertOne(application) //  Sending teh data to the mongodb and saving the confirmation message and unique id here
            res.send(result) // Sending the confirmation message and unique id to the client
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