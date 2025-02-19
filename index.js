require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
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

    // Load a specific post details by id
    app.get('/volunteer/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await volunteerCollection.findOne(query);
        res.send(result);
      });
    
    // Delete a post
    app.delete('/volunteer/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.deleteOne(query);
      res.send(result);
    });

    // Update a specific element
    app.put('/volunteer/:id', async (req, res) => {
      const id = req.params.id;
      const updatedPost = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedPost,
      };
      const result = await volunteerCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Added new collection  
    const requestedVolunteer = client.db('volunteerDB').collection('volunteers');

    

app.post('/requestedVolunteer', async (req, res) => {
    const newPost = req.body;

    // Ensure newPost.volunteersNeeded is a number 
    newPost.volunteersNeeded = Number(newPost.volunteersNeeded) || 0;

    console.log('Creating new volunteer post:', newPost);
    const result = await requestedVolunteer.insertOne(newPost);
    
    if (result.insertedId) {
        const postId = new ObjectId(newPost.postId);

        // Fetch the current post data from volunteerCollection
        const existingPost = await volunteerCollection.findOne({ _id: postId });

        if (existingPost) {
            let updatedVolunteersNeeded = Number(existingPost.volunteersNeeded) || 0;

            // Step 1: Ensure volunteersNeeded is a number in volunteerCollection
            if (typeof existingPost.volunteersNeeded !== 'number') {
                await volunteerCollection.updateOne(
                    { _id: postId },
                    { $set: { volunteersNeeded: updatedVolunteersNeeded } }
                );
            }

            // Step 2: Reduce the available volunteer slots in volunteerCollection
            await volunteerCollection.updateOne(
                { _id: postId },
                { $inc: { volunteersNeeded: -1 } }
            );

            // Step 3: Also update volunteersNeeded in requestedVolunteer collection
            await requestedVolunteer.updateOne(
                { _id: result.insertedId },  // Update the newly inserted document
                { $set: { volunteersNeeded: updatedVolunteersNeeded - 1 } }
            );
        }
    }

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
