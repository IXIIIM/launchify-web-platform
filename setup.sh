#!/bin/bash

# Update package lists
sudo apt-get update

# Install OpenSSL 1.1.x
sudo apt-get install -y openssl libssl1.1

# Install project dependencies
npm install

# Generate Prisma client
npm run prisma:generate

echo "Setup complete! You can now run 'npm run dev' to start the server."