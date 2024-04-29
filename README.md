# API Routers README

This repository contains routers for managing various functionalities in the application. Each router handles specific endpoints related to its domain.

## Installation

Before running the server, make sure to install the dependencies using the following command:

npm install --force

## Starting the Server
To start the server, use the following command:

npm start

## 1. Authentication Router

File: `auth_router.js`

This router is responsible for handling authentication-related endpoints such as user login and registration.

Endpoints:
- `POST /api/auth/login`: Endpoint for user login.
- `POST /api/auth/register`: Endpoint for user registration.


Each router provides a clear separation of concerns and defines specific endpoints for handling CRUD operations related to its domain.
