# Sortify

Sortify is a command line application originally designed to facilitate sorting songs into playlists using the Spotify API.

## Installation

```
npm i -g sortify
```

## Quick Start

This tool's primary purpose is to allow the user to quickly sort a song into various playlists based on a set of predetermined tags. Let's say we wanted to sort all the songs that we tag #happy to end up in one playlist. We can do this easily by following the steps below:

1. First, we need to tag the playlist by adding #happy to the description of our playlist.
2. Next, we can start listening to some happy songs that we might want to put in our playlist, for example the song **Hey Ya by Outkast**.
3. While we are listening to our song, we can run sortify in our terminal with the command `sortify song --verbose`.
4. The command will tell us some stuff about the song we are listening to and then we can begin tagging the song for sorting. Since we haven't spent any time customizing our tags, we only have the default tags.
5. Tags are broken up into a series of prompts for organization. The default prompt categories are _moods_ and _genre_.
6. You can navigate a prompt by using the up and down arrow keys and you can select a tag by pressing the spacebar while it is highlighted. For now, let's just select the _mood_ tag _happy_.
7. Once you have selected all the relevant tags in a prompt category, you can confirm your choices and move on to the next prompt by pressing enter.
8. For our second prompt, _genre_, we can pick _pop_ and _rap_, but we haven't tagged any playlists with those tags so it won't end up doing anything (this time).
9. Once we have finished all our prompts sortify will list all the selected tags, along with some automatically generated ones. Then it will confirm all the playlists with matching tags. We should just see our #happy playlist so we can confirm and press enter.
10. If everything has gone correctly you should now see the song in the correct playlist in Spotify.

Using sortify for just a single playlist seems like a lot more overhead than just dragging your song into the new playlist (because it is). Using sortify is most useful when you have a large collection of playlists with different combinations of tags. Once your playlists are tagged, sorting a new song into the proper playlists is fast and easy and sortify will hopefully continue to get smarter the more you use it. All that's left now is for you to start tagging!

