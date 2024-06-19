# OpenVidReview

This project is a a collaborative video review and annotation tool. It allows users to upload videos, add comments with timestamps, color tags, and export comments as EDL files for use in video editing software like DaVinci Resolve.

The project is a work in progress and any use is at your own risk!

If you want to help in any capacity or contact me send me an email at david [a] davidguva.se

## Features

- Video upload
- Simple admin interface
- Time-based comments
- Color tags for comments
- Edit and delete comments
- Export comments as EDL files


## Todos

- Implement the use of encrypted passwords (especially for the admin interface)
- Real-time updates with Socket.io

I would love for people to test this and give feedback.

## Technologies Used

- Node.js
- Express.js
- SQLite
- EJS (Embedded JavaScript templating)
- Socket.io
- HTML/CSS/JavaScript

## Getting Started

### Prerequisites

- Node.js and npm installed
- SQLite installed

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/davidguva/OpenVidReview.git
    cd OpenVidReview
    ```

2. Install the dependencies:

    ```bash
    npm install
    ``

4. Start the server:

    ```bash
    npm start
    ```

5. Open your browser and go to `http://localhost:3000`.