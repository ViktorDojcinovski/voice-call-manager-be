#!/bin/bash

echo "Waiting for MongoDB to start..."
sleep 5  # Give some time for the MongoDB instances to be ready

echo "Initializing MongoDB replica set..."
mongosh --host mongo1:27017 <<EOF
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
});
EOF

echo "Replica set initialized successfully!"
