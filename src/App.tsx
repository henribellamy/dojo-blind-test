import logo from './assets/logo.svg';
import './App.css';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import swal from 'sweetalert';

const apiToken =
  'BQBWcNKR80VEYh9CN4NuPzl27YlUwl238kjGRZ1qG0sJsqR3SLTIYK940lmfksZCWf6-9gsstBIdMh_aYtTyiaTNlrsDOJohFTyK1W7fa2U34EWmCLCP9RB7quIXYt7J_6_e3yaeISbv3GNTYDZqjdmGtfV0GfPD6TQT3VOL8O6qe3H5HPcVkSMeTW1V83umBxwmoibWpaZy51dk_TqZvmUAgDDWIqwqtuMmLSOgh_o4fYNy61E4U_UolLrQtbZ3-v4BWvbewsochcYQe7IVkyZcVdJ-LPdbw25FiG_lUVZ-haifzkYZZUk42LyeBhKg0ybkjIvvdcDIZQcDSy4J0ME4eATzdIrWfGnLTNJlB2Wl5ebhMw0l4mkj7_nmut3hcORX3wIhxA';

const getDeezerPreview = async (
  trackName: string,
  artistName: string,
): Promise<string | null> => {
  try {
    const query = encodeURIComponent(`${artistName} ${trackName}`);
    // Utiliser le proxy Vite configuré
    const url = `/api/deezer/search?q=${query}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data[0].preview;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la recherche sur Deezer:', error);
    return null;
  }
};

const fetchTracks = async () => {
  const response = await fetch('https://api.spotify.com/v1/me/tracks', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + apiToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Fetching tracks failed with status ${response.status}`);
  }
  const data = (await response.json()) as { items: any[] };

  return data.items;
};

const pickRandomTrack = (tracks: any[]) => {
  return tracks[Math.floor(Math.random() * tracks.length)]!;
};

const shuffleArray = (tracks: any[]) => {
  return tracks.sort(() => Math.random() - 0.5);
};

const AlbumCover = ({ track }: { track: any }) => {
  return (
    <img
      src={track.album.images?.[0]?.url ?? ''}
      style={{ width: 200, height: 200 }}
    />
  );
};

const TrackButton = ({
  track,
  onClick,
}: {
  track: any;
  onClick: () => void;
}) => {
  return (
    <div className="App-track-button">
      <AlbumCover track={track.track} />
      <button onClick={onClick}>{track.track?.name}</button>
    </div>
  );
};

const App = () => {
  const {
    data: tracks,
    isSuccess,
    isLoading,
  } = useQuery({ queryKey: ['tracks'], queryFn: fetchTracks });

  const [currentTrack, setCurrentTrack] = useState<any | undefined>(undefined);
  const [trackChoices, setTrackChoices] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (!tracks) {
      return;
    }

    const rightTrack = pickRandomTrack(tracks);
    setCurrentTrack(rightTrack);

    const wrongTracks = [pickRandomTrack(tracks), pickRandomTrack(tracks)];
    const choices = shuffleArray([rightTrack, ...wrongTracks]);
    setTrackChoices(choices);
  }, [tracks]);

  const checkAnswer = (track: any) => {
    if (track.track?.id == currentTrack?.track?.id) {
      swal('Bravo !', "C'est la bonne réponse", 'success');
    } else {
      swal('Dommage !', "Ce n'est pas la bonne réponse", 'error');
    }
  };

  useEffect(() => {
    const fetchDeezerPreview = async () => {
      if (!currentTrack?.track) return;

      const trackName = currentTrack.track.name ?? '';
      const artistName = currentTrack.track.artists?.[0]?.name ?? '';

      const preview = await getDeezerPreview(trackName, artistName);
      if (preview) {
        setPreviewUrl(preview);
      }
    };

    fetchDeezerPreview();
  }, [currentTrack]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1 className="App-title">Bienvenue sur le blind test</h1>
      </header>
      <div className="App-images">
        {isLoading || !isSuccess ? (
          'Loading...'
        ) : (
          <div>
            <div>
              {previewUrl ? (
                <audio key={previewUrl} src={previewUrl} controls autoPlay />
              ) : (
                <p>Chargement de l'extrait audio...</p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="App-buttons">
        {trackChoices
          .filter(track => track?.track)
          .map(track => (
            <TrackButton track={track} onClick={() => checkAnswer(track)} />
          ))}
      </div>
    </div>
  );
};

export default App;
