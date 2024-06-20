# OpenVidReview

This project is a a collaborative video review and annotation tool. It allows users to upload videos, add comments with timestamps, color tags, and export comments as EDL files for use in video editing software like DaVinci Resolve.

The project is a work in progress and any use is at your own risk!

If you want to help in any capacity or contact me send me an email at david [a] davidguva.se and if you for some reason wants to say thanks you can [buy me a coffee](https://buymeacoffee.com/davidguva).

## Features

-   Video upload
-   Simple admin interface
-   Time-based comments
-   Color tags for comments
-   Edit and delete comments
-   Export comments as EDL files

## Todos

-   Implement the use of encrypted passwords (especially for the admin interface)
-   Real-time updates with Socket.io
-   Overall to make it as secure as possible and ready for production.

I would love for people to test this and give feedback.

## Technologies Used

-   Node.js
-   Express.js
-   SQLite
-   EJS (Embedded JavaScript templating)
-   Socket.io
-   HTML/CSS/JavaScript

## Getting Started

### Prerequisites

-   Node.js and npm installed
-   SQLite installed

### Installation using NodeJS

1. Clone the repository:

    ```bash
    git clone https://github.com/davidguva/OpenVidReview.git
    cd OpenVidReview
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Start the server:

    ```bash
    npm start
    ```

4. Open your browser and go to `http://localhost:3000` or visit `http://localhost:3000/admin` for the admin interface.

### Installation using Docker

1. Clone the repository:

    ```bash
    git clone https://github.com/davidguva/OpenVidReview.git
    cd OpenVidReview
    ```

2. Build and start the container:

    `docker compose up -d`

#### Docker Configuration

##### Storage

You **should** bind a host directory into the container to persist videos and configuration. Otherwise, these will be lost when the container is updated.

See commented example in [docker-compose.yml](/docker-compose.yml)

###### Linux Host and File Permissions

If you are

* using [rootless containers with Podman](https://developers.redhat.com/blog/2020/09/25/rootless-containers-with-podman-the-basics#why_podman_)
* running docker on MacOS or Windows

this **DOES NOT** apply to you.

If you are running Docker on a **Linux Host** you should specify `user:group` permissions of the user who owns the **configuration directory** on the host to avoid [docker file permission problems.](https://ikriv.com/blog/?p=4698) These can be specified using the [environmental variables **PUID** and **PGID**.](https://docs.linuxserver.io/general/understanding-puid-and-pgid)

To get the UID and GID for the current user run these commands from a terminal:

* `id -u` -- prints UID
* `id -g` -- prints GID

See commented example in [docker-compose.yml](/docker-compose.yml)
