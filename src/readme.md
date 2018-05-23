- [Real Time Web](#real-time-web)
    - [Purpose of the app](#purpose-of-the-app)
    - [What did I change, what was my focus](#what-did-i-change--what-was-my-focus)
    - [Style of the project](#style-of-the-project)
    - [Feature list](#feature-list)
    - [Wish list](#wish-list)
    - [Requirements](#requirements)
    - [Install guide](#install-guide)
    - [Dependencies](#dependencies)
        - [Api's](#apis)
    - [Internals](#internals)
        - [Data persistence](#data-persistence)
            - [Socket endpoints](#socket-endpoints)
            - ['update user list', (`authenticatedUsers`)](#update-user-list--authenticatedusers)
            - ['connect', (none)](#connect--none)
            - ['connect_error', (none)](#connect-error--none)
            - ['song rated', (songId, rating)](#song-rated--songid--rating)
            - ['disconnect', (none)](#disconnect--none)
            - ['current song playing' (`currentSong`)](#current-song-playing-currentsong)
            - ['user authenticated' (`data -> access_code, refresh_token`)](#user-authenticated-data---access-code--refresh-token)
            - ['User logged in' (`userName`)](#user-logged-in-username)
            - ['update spotify related ui' (`queue`, `currentSong`)](#update-spotify-related-ui-queue--currentsong)
# Real Time Web
![Main image](main-image.png)

## Purpose of the app
A fun 'get-together' spotify app where you can compile a playlist of songs with a group, and enjoy those tunes together!

## What did I change, what was my focus
The previous iteration of this concept grew out of control, partially due to my lack of knowledge about creating a accesstoken in a new tab, and delegating this to the socket it's active homepage to hugely decrease the complexity of it. I've also caught wind about how to do leverage Express sessions myself, which allowed me to spend more time on the spotify implementation. For said implementation I primairly focused on making a shared experience, allowing all users to see what songs are playing to create a incentive to log on. They are also able to change the score of the song which manipulates the data for all users. Personally I think with this i've reached a level of understanding about sockets and oauth in general which will be hugely beneficial moving forward.

## Style of the project
For the general codestyle I decided to adhere to the [google style guide](https://google.github.io/styleguide/jsguide.html). This is because it's fairly new and is a bit different then my current coding style, which is mostly based of the airbnb styleguide. With this i hope to be able to slowly form my own coding style.
As for the document structure I decided to use [risingstacks](https://blog.risingstack.com/node-hero-node-js-project-structure-tutorial/) project structure as a baseline.   

Reasoning behind this is that I personally find the MVC document structure most sources recommend quite cluttered, and I prefer to create my app parts as encapsulated as possible.  Down the line i'll probably divert from risingstacks structure slightly, and will document my adaptations here. 

## Feature list
- Choose your playback device to listen on!
- Add your favourite songs to the queue
- Rate other people their choices to influence the queue
- Scold other people in chat for their horrible choices
- song auto completion
- Persistent user data, so you only have to login once!

## Wish list
- DJ mode, make a user responsible for the queue
- Export all songs played as a playlist



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
The product has been based upon the socket implementation by of `socket.io` inside a 'express' app. The project also heavily leverages express sessions
### Api's
To flair up the functionality, i'm using the [spotify api](https://developer.spotify.com/web-api/) through the ever so handy [spotify-web-api-node](https://github.com/thelinmichael/spotify-web-api-node) node package.

## Internals

### Data persistence
Every Socket.IO connection has a persistence session. What keys are being used for different values inside this session can be found in the [config.js](https://github.com/Cascuna/real-time-web-project/blob/herkansing/src/config.js) under `session`.

This session is *required* for the app to run correctly, as it stores all needed data to communicate with the spotify API.

#### Socket endpoints
#### 'update user list', (`authenticatedUsers`)
`emit (Serversided)`  
**AuthenticatedUsers** - A collection of all users that have authenticated with spotify. Gets fetched from the session's `filestore`  
`on (Clientsided) `  
Populates the '**current users online**' list with the users their `spotify_id's`

#### 'connect', (none)
`on (Clientsided)`
Checks on connection if the server is online


#### 'connect_error', (none)
`on (Clientsided)`
Gets received if the server crashes


#### 'song rated', (songId, rating)
**SongId** - The identifier of the song to give the rating
**Rating** - What value the song has  

`on (Clientsided)`
Updates the song card for the viewer to reflect rating

`emit (Serversided)`
Tells all active lclients that a song's rating has been changed

#### 'disconnect', (none)
`on (Serversided)`   
Checks if the user is authenticated, removes him from the userlist if this is true.

#### 'current song playing' (`currentSong`)
**CurrentSong** - Contains information about the song that is currently playing, like playback data and card information  

`on (Clientsided)`  
Adds player interface with the song that needs to be played for the user 

`emit (Serversided)`
Notifies all users that the song has changed and there is a new in queue to be played  



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


#### 'update spotify related ui' (`queue`, `currentSong`)

**queue** - Current queue of songs, contains all info needed to display cards correctly 
**CurrentSong** - Contains information about the song that is currently playing, like playback data and card information  
`on (Clientside)`
Constructs the currently playing bar so the user knows what the song it's progress is
`emit (Serverside)`
When a socket connects, it fetches the currentSong & queue 




