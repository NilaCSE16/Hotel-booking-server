const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.port || 5000;

require("dotenv").config();

app.use(express.json());
app.use(cors());

const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${username}:${password}@cluster0.yexdchm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const roomCollection = client.db("hotelDB").collection("rooms");

    app.post("/addRoom", async (req, res) => {
      const room = req.body;
      console.log(room);
      const result = await roomCollection.insertOne(room);
      res.send(result);
    });
    app.get("/rooms", async (req, res) => {
      const result = await roomCollection.find().toArray();
      res.send(result);
    });
    app.get("/rooms/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomCollection.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hotel booking is running");
});

app.listen(port, () => {
  console.log("Hotel Booking is running on port: ", port);
});
