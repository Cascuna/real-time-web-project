# Real Time Web
![Main image](main-image.png)

## Purpose of the app
A fun 'get-together' spotify app where you can compile a playlist of songs with a group, and 

## Challenges I faced
The architecture of the project wasn't superB, which introduced allot more bugs as I continued developing. The problem with this is that the whole application is quite buggy, and I haven't really reached the point I want the application to be in. This together with the complexity of getting the access key from a callback really threw me off.

## Style of the project
For the general codestyle I decided to adhere to the [google style guide](https://google.github.io/styleguide/jsguide.html). This is because it's fairly new and is a bit different then my current coding style, which is mostly based of the airbnb styleguide. With this i hope to be able to slowly form my own coding style.
As for the document structure I decided to use [risingstacks](https://blog.risingstack.com/node-hero-node-js-project-structure-tutorial/) project structure as a baseline.   

Reasoning behind this is that I personally find the MVC document structure most sources recommend quite cluttered, and I prefer to create my app parts as encapsulated as possible.  Down the line i'll probably divert from risingstacks structure slightly, and will document my adaptations here. 

## Feature list

- Choose your playback device to listen on!
- Add your favourite songs to the queue
- Rate other people their choices to influence the queue



## Requirements

`npm` minimal  version `v5.6.0`
`node` minimal version `v8.9.4`


## Install guide
```cd app```
Then you can do 
```npm install```
Finally
```npm start```

## Dependencies
The product has been based upon the socket implementation by of `socket.io`.  
### Api's
To flair up the functionality, i'm using the [spotify api](https://developer.spotify.com/web-api/) through the ever so handy [spotify-web-api-node](https://github.com/thelinmichael/spotify-web-api-node) node package.

## Internals

### Data persistence
Every Socket.IO connection has a persistence session. What keys are being used for different values inside this session can be found in the [config.js](https://github.com/Cascuna/real-time-web-project/blob/herkansing/src/config.js) under `session`.

This session is *required* for the app to run correctly, as it stores all needed data to communicate with the spotify API.


#### 'update user list', (`authenticatedUsers`)
`emit (Serversided)`  
**AuthenticatedUsers** - A collection of all users that have authenticated with spotify. Gets fetched from the session's `filestore`  
`on (Clientsided) `  
Populates the '**current users online**' list with the users their `spotify_id's`


#### 'disconnect', (none)
`on (Serversided)`   
Checks if the user is authenticated, removes him from the userlist if this is true.

#### 'user authenticated' (`data -> access_code, refresh_token`)
**access_code** - Code received from spotify on succesful authentication  
**refresh_token** - Indicator of the lifetime of `access_code`  

`on (Serversided)`  
Creates a SpotifyApi instance for the specific user with his authentication keys and registers this in the user his session so we can persistenly use this.

Also retrieves the user his `spotify_id`and registers this in the session aswell, together with a call to `update user list` & 'user logged in'

`emit (Clientside)`  
The socket has received a callback from the spotify_authentication page & sends the `access_code` & `refresh_code` to the server.


#### 'User logged in' (`userName`)
**userName** - Name of the user that logged in   

`emit (Serverside)`  
Sends the username to the client to show a welcome message & notify the other users the user 'logged in'

`on (Clientside)`  
Creates a welcome message for the user & notifies people in the chat the user joined

