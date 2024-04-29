const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.port || 5000;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

require("dotenv").config();

app.use(express.json());
app.use(
  cors({
    origin: [
      "https://hotel-booking-client-tau.vercel.app",
      "http://localhost:5173",
      "https://hotel-booking-979ba.firebaseapp.com/",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

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

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log("Token: ", token);
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access!!!!!!!" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "An Unauthorized Access" });
    }
    req.user = decoded;
    // console.log("Decoded: ", decoded.email);
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const userCollection = client.db("hotelDB").collection("users");
    const roomCollection = client.db("hotelDB").collection("rooms");
    const blogCollection = client.db("hotelDB").collection("blogs");
    const bookingCollection = client.db("hotelDB").collection("bookings");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log("User: ", user);
      const token = jwt.sign({ user }, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      // const refreshToken = jwt.sign({ user }, process.env.ACCESS_TOKEN, {
      //   expiresIn: "1h",
      // });

      res
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        })
        .header("Authorization", token)
        .json({ success: true });
    });
    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
        })
        .json({ success: true });
    });

    app.post("/addUsers", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.status(200).json({ message: "Successfully Added" });
    });
    app.get("/users", async (req, res) => {
      let query = {};
      // console.log(req.query.email);
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/addRoom", async (req, res) => {
      const room = req.body;
      // console.log(room);
      const result = await roomCollection.insertOne(room);
      res.status(200).json({ message: "Successfully Added" });
    });
    app.get("/rooms", async (req, res) => {
      var result = [];
      // var page = await roomCollection.estimatedDocumentCount();
      if (!req.query) {
        // page = parseInt(req.query.page);
        result = await roomCollection.find().toArray();
      } else {
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);
        result = await roomCollection
          .find()
          .skip(page * size)
          .limit(size)
          .toArray();
      }
      // const result = await roomCollection.find().toArray();
      res.send(result);
    });
    app.get("/rooms/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/roomsCount", async (req, res) => {
      const count = await roomCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.post("/addBookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.status(200).json({ message: "Successfully Added" });
    });
    app.get("/bookings", verifyToken, async (req, res) => {
      let query = {};
      // console.log("Nilaaaaaaa: ", req.user.email);
      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: "Invalid User" });
      }
      if (req.query.roomId) {
        query = { roomId: req.query.roomId };
      } else {
        if (req.query.email) {
          query = { email: req.query.email };
        }
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });
    app.put("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const booking = req.body;
      const options = { upsert: true };
      console.log("Booking: ", booking);
      const updateDoc = {
        $set: {
          date: booking.date,
        },
      };
      const result = await bookingCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.status(200).json({ message: "Successfully Updated" });
    });
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/bookings", async (req, res) => {
      // const today = new Date().toISOString().split("T")[0];
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0"); // Month starts from 0
      const day = String(today.getDate()).padStart(2, "0");
      const year = today.getFullYear();

      const formattedDate = `${month}/${day}/${year}`;

      // console.log(formattedDate); // Output: mm/dd/yyyy

      // console.log("Today: ", today);
      const result = await bookingCollection.deleteMany({
        date: { $lt: formattedDate },
      });
      res.status(200).json({ message: "Deleted successful" });
    });

    app.post("/addBlogs", async (req, res) => {
      const blog = req.body;
      console.log(blog);
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });
    app.get("/blogs", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.status(200).json({ message: "Successfully Added" });
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
