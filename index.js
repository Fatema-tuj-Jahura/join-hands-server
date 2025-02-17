require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSS}@cluster0.t61iz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const volunteerCollection = client.db('volunteerDB').collection('volunteerPosts');

    app.post('/volunteer', async (req, res) => {
      const newPost = req.body;
      console.log('Creating new volunteer post:', newPost);
      const result = await volunteerCollection.insertOne(newPost);
      res.send(result);
    });

    // Get volunteer posts with optional search by title
app.get('/volunteer', async (req, res) => {
    const { search } = req.query;
    let query = {};

    // If search query exists, filter by title 
    if (search) {
        query.title = { $regex: search, $options: 'i' }; 
    }

    const cursor = volunteerCollection.find(query);
    const result = await cursor.toArray();

    res.send(result);
});

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Join Hands: A volunteer add server");
  });
  
  app.listen(port, () => {
    console.log(`Join hands server is running on port: ${port}`);
  });
