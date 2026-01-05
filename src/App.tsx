import logo from './assets/logo.svg';
import './App.css';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import swal from 'sweetalert';

const apiToken = "BQCBAvmEExsw7cnUJxSpJEJAHxHGKcJYOmoR92T3Agot3_IKLq61MKpDaaZPoJX78uZLo-ZWpxSSV-7yh2kzb8ucNQkujhaeIPOf5lLX3fvrTgwitDDnmXWcVyzqdurEv_kU23Ihz2EB5qjTiIj17GHmqUPVAZ2-T8PIlRlOpMvbhpVOEWXR7_HVnEKeq6aPEbdt8phQX6ArjuricgJw8BmhMUJuonMvfzHr_lgY8OJVpdPjlNIKayiwwJR5Matx7TYaQaoc5IY4O9BNkdGR7hvE3wc8uqVo7aMklQ8zQFTAhu76unpx8bXhAaf_U_aFC39ywDPORIoARg2HHXIwQ4-UiSS_prALA9dwbsj-YO2nW8JHIt7gC-8vfY96TvfQ3XhglF-7IbKCtA1uzBKmNMcJ1fg";

/**
 * Récupère les titres sauvegardés de l'utilisateur
 */
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
      alt="Album cover"
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
    // Correction: === au lieu de ==
    if (track.track?.id === currentTrack?.track?.id) {
      swal('Bravo !', "C'est la bonne réponse", 'success');
    } else {
      swal('Dommage !', "Ce n'est pas la bonne réponse", 'error');
    }
  };

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
              <audio
                src={currentTrack?.track?.preview_url ?? ''}
                controls
                autoPlay
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="App-buttons">
        {trackChoices.map((track, index) => (
          <TrackButton 
            key={index}
            track={track} 
            onClick={() => checkAnswer(track)} 
          />
        ))}
      </div>
    </div>
  );
};

export default App;
