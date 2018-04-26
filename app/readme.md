# Real Time Web
![Main image](main-image.png)
- [Real Time Web](#real-time-web)
    - [Purpose of the app](#purpose-of-the-app)
    - [Challenges I faced](#challenges-i-faced)
    - [Style of the project](#style-of-the-project)
    - [Feature list](#feature-list)
    - [Wish list](#wish-list)
    - [Requirements](#requirements)
    - [Install guide](#install-guide)
    - [Dependencies](#dependencies)
        - [Api's](#apis)
    - [Internals](#internals)
        - [Types of users](#types-of-users)
            - [`temporary user`](#temporary-user)
            - [`Registered user`](#registered-user)
        - [Data](#data)
            - [Database](#database)
        - [The handeling of sockets events](#the-handeling-of-sockets-events)
            - [Server Side](#server-side)
                - [`socket.on('logged in')`](#socketonlogged-in)
                    - [Params](#params)
                    - [Function](#function)
                - [`socket.on('logged in user')`](#socketonlogged-in-user)
                    - [Params](#params)
                    - [Function](#function)
                - [`socket.on('disconnect')`](#socketondisconnect)
                    - [Params](#params)
                    - [Function](#function)
                - [`socket.on('typing')`](#socketontyping)
                    - [Params](#params)
                    - [Function](#function)
                - [`socket.on('setup spotify playlist)`](#socketonsetup-spotify-playlist)
                    - [Params](#params)
                - [Function](#function)
                - [`socket.on('spotify generate access token')`](#socketonspotify-generate-access-token)
                    - [Params](#params)
                    - [Function](#function)
                - [`socket.on('login temp user')`](#socketonlogin-temp-user)
                    - [Params](#params)
                    - [Function](#function)
            - [Client Side](#client-side)
                - [`socket.on("check localstorage")`](#socketoncheck-localstorage)
                    - [Params](#params)
                    - [Function](#function)
                - [`socket.emit("new message")`](#socketemitnew-message)
                    - [Params](#params)
                    - [Functions](#functions)
                - [`socket.on("typing")`](#socketontyping)
                    - [Params](#params)
                    - [Functions](#functions)

## Purpose of the app
This application aims to offer a solution to real time chat applications. Here you can make your own user groups, see who is online and more.

## Challenges I faced
The architecture of the project wasn't superB, which introduced allot more bugs as I continued developing. The problem with this is that the whole application is quite buggy, and I haven't really reached the point I want the application to be in. This together with the complexity of getting the access key from a callback really threw me off.

## Style of the project
For the general codestyle I decided to adhere to the [google style guide](https://google.github.io/styleguide/jsguide.html). This is because it's fairly new and is a bit different then my current coding style, which is mostly based of the airbnb styleguide. With this i hope to be able to slowly form my own coding style.
As for the document structure I decided to use [risingstacks](https://blog.risingstack.com/node-hero-node-js-project-structure-tutorial/) project structure as a baseline.   

Reasoning behind this is that I personally find the MVC document structure most sources recommend quite cluttered, and I prefer to create my app parts as encapsulated as possible.  Down the line i'll probably divert from risingstacks structure slightly, and will document my adaptations here. 

## Feature list

- Dynamic groups. Don't enjoy the general chat? Make one for yourself and your friends
- See who are online
- Vulgarity filter (English only)
- Real-time chat


## Wish list

- [ ] Listen to your favourite tunes with chat buddies
- [ ] Private chat groups
- [ ] Chat history
- [ ] Accounts (Oauth)
- [ ] Friends


## Requirements

`npm` version `v5.6.0`
`node` version `v8.9.4`


## Install guide
```cd app```
Then you can do 
```npm install```
Finally
```npm start```

## Dependencies
The product has been based upon the socket implementation by of `socket.io`.  
For the profanity filter i've used [retext-profanity] (https://github.com/retextjs/retext-profanities)

### Api's
To flair up the functionality, i'm using the [spotify api](https://developer.spotify.com/web-api/) through the ever so handy [spotify-web-api-node](https://github.com/thelinmichael/spotify-web-api-node) node package.

## Internals

### Types of users
Inside the application there are 2 user types:

#### `temporary user`
As the name indicates, these are users that want to use the application but didn't want to register yet. They will be limited to the 'base' usage of the application, that is, without the extra functionality the spotify API provides.

#### `Registered user`
Made the effort to create a account, and is able to use all functionality offered by the web application.

### Data
![test](Diagram.png)


`SpotifySessionRoomPair`: Saves the meta data of the spotify playlist created for the chatroom. 
Meta data here means: `playlist_id`
`UserKeyPairs`: Pairs a users name with his spotify access key.

#### Database
The only data saved in the database at the moment is the `user` model.


### The handeling of sockets events

#### Server Side

<!-- ##### `socket.on('logged in user')` 
###### Params
A session.user object to validate & register in the socket.
###### Function
WIP, endpoint that should be called from the server to indicate that the user logged in to a account in the database.  -->

##### `socket.on('logged in')` 
###### Params
`user`, `room`
###### Function
Joins a room for the user

setup spotify
##### `socket.on('logged in user')` 
###### Params
A session.user object to validate & register in the socket.
###### Function
WIP, endpoint that should be called from the server to indicate that the user logged in to a account in the database. 

##### `socket.on('disconnect')` 
###### Params
###### Function
Removes the current active user belonging to the socket from the active room.


##### `socket.on('typing')` 
###### Params
A `typing` boolean to indicate the current typing state. 
###### Function
if it's true it will emit a `typing` message to all clients in the same room as the typing client.

##### `socket.on('setup spotify playlist)`
###### Params
`user`: Name of the user
`room`: Room the spotify playlist will be created for
##### Function
Createsa playlist for the connected user based on the channel name. Currently always creates a playlist, even if there is already a playlist with this name.


##### `socket.on('spotify generate access token')`
###### Params
The code received from the spotify callback upon a succesful spotify authentication.
###### Function
Generates a accesstoken and writes this to the current logged in user.


##### `socket.on('login temp user')`
###### Params
A `user` and a `room`
###### Function
Creates a temporary user & saves his footprint in the socket, and ensures that the data is saved in the client's local storage.


#### Client Side

##### `socket.on("check localstorage")` 
###### Params
`localStorageKeyNames (Required) `: List of LtestocalStorage namespaces, used to check if these namespaces contain any user information.  

###### Function
Checks localstorage to see if there is a temporary user in the localstorage. Should only be called if the session is empty & the user has logged in with a [temporary user](#temporary-user) before.

##### `socket.emit("new message")`
###### Params
`message`: The input of the textbox

###### Functions
Sends a request to the server to broadcast the user his message to the server

##### `socket.on("typing")`
###### Params
`Typing`: Boolean, indicates where the user is still typing or not 
`Message`: Message which will be broadcasted to the other users in the room

###### Functions
Broadcasts the typing message

