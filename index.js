const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j9nln.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();

        const database = client.db('event_horizon');
        const usersCollection = database.collection('users');
        const ordersCollection = database.collection('orders');

        // Add Users API
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const email = await usersCollection.findOne(query);
            if (!email) {
                const result = await usersCollection.insertOne(user);
                res.json(result);
            }
        })


        // Get Users API
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });


        // Add Orders API
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        });


        // Get Orders API
        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const orders = await cursor.toArray();
            res.send(orders);
        });


        // Orders Cancel API
        app.put('/cancel_order', async (req, res) => {
            const data = req.body;
            const filter = {
                customerName: data.customer,
                Day: data.day,
                Slot: data.timeSlot,
            };
            const updateDoc = { $set: { status: data.status } };
            const result = await ordersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });


        // Delete owner/customer API
        app.delete('/delete_owner_customer', async (req, res) => {
            const data = req.body;
            const query = { email: data.email };
            const result = await usersCollection.deleteOne(query);
            res.json(result);
        })


        // Venue accept/reject API
        app.put('/venue_action', async (req, res) => {
            const data = req.body;
            const filter = {
                'venues.name': data.venueName
            };
            const updateDoc = { $set: { 'venues.$.status': data.action } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });


        // owner profile update 
        app.put('/owner_profile', async (req, res) => {
            const data = req.body;
            const filter = {
                email: data.emailAddress
            };
            const updateDoc = {
                $set: {
                    name: data.name,
                    phoneNo: data.phoneNo
                }
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });



        // Delete owner venue API
        app.delete('/owner_venue', async (req, res) => {
            const data = req.body;
            const query = { email: data.email };
            const result = await usersCollection.updateOne(query, { $pull: { venues: data.venue } });
            console.log(data)
            res.json(result);
        })

    }

    finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Event Horizon server is running')
})

app.listen(port, () => {
    console.log(`Listening at ${port}`)
})