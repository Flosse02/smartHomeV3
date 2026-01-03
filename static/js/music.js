let musicData = {};
let selectedArtist = null;
let selectedAlbum = null;

export function initMusic() {
    const container = document.getElementById("music-container");
    if (!container) {console.log("Music cointainer not found in DOM!"); return;}
    fetch("/api/music")
        .then(res => res.json())
        .then(data => {
            musicData = data;
            renderArtists();

            const artists = document.querySelector(".tab[data-tab='artists']");
            const albums = document.querySelector(".tab[data-tab='albums']");
            const songs = document.querySelector(".tab[data-tab='songs']");
            artists.addEventListener("click", () => {
                setActiveTab(artists);
                renderArtists();
            })
            albums.addEventListener("click", () => {
                setActiveTab(albums);
                selectedArtist = null;
                renderAlbums();
            })
            songs.addEventListener("click", () => {
                setActiveTab(songs);
                selectedArtist = null;
                selectedAlbum = null;
                renderSongs();
            })
        })
        .catch(err => {
            container.textContent = "Failed to load music";
            console.error(err);
        });
}

function renderArtists() {
    const container = document.getElementById("music-list");
    container.innerHTML = "";
    const ul = document.createElement("ul");

    for (const artist in musicData) {
        const li = document.createElement("li");
        li.textContent = artist;
        li.addEventListener("click", () => {
            selectedArtist = artist;
            selectedAlbum = null;
            renderAlbums();
        });
        ul.appendChild(li);
    }
    container.appendChild(ul);
}

function renderAlbums() {
    const container = document.getElementById("music-list");
    container.innerHTML = "";
    const ul = document.createElement("ul");

    if (selectedArtist){
        const albums = musicData[selectedArtist];
        for (const album in albums) {
            const li = document.createElement("li");
            li.textContent = album;
            li.addEventListener("click", () => {
                selectedAlbum = album;
                renderSongs();
            });
            ul.appendChild(li);
        }
    } else {
        for (const artists in musicData) {
            const artist = musicData[artists];
            for (const album in artist){
                const li = document.createElement("li");
                li.textContent = album;
                li.addEventListener("click", () => {
                    selectedArtist = artists;
                    selectedAlbum = album;
                    renderSongs();
                });
                ul.appendChild(li);
            }
        }
    }
    container.appendChild(ul);
}

function renderSongs() {
    const container = document.getElementById("music-list");
    container.innerHTML = "";
    const ul = document.createElement("ul");

    if (selectedAlbum || selectedArtist){
        const songs = musicData[selectedArtist][selectedAlbum];
        for (const song of songs) {
            const li = document.createElement("li");
            li.textContent = song.title;
            li.addEventListener("click", () => {
                playSong(song);
            });
            ul.appendChild(li);
        }
    } else {
        for (const artists in musicData) {
            const artist = musicData[artists];
            for (const albums in artist){
                const songs = musicData[artists][albums];
                for (const song of songs) {
                    const li = document.createElement("li");
                    li.textContent = song.title;
                    li.addEventListener("click", () => {
                        playSong(song);
                    });
                    ul.appendChild(li);
                }
            }
        }
    }
    container.appendChild(ul);
}

function playSong(song) {
    const player = document.getElementById("audio-player");
    player.src = `/stream/${song.id}`;
    console.log(`/stream/${song.id}`);
    player.play();
}

function setActiveTab(tabButton) {
    document.querySelectorAll(".music-bar .tab").forEach(btn => btn.classList.remove("active"));
    tabButton.classList.add("active");
}