import { FC } from 'react';
import IFCViewer from './components/Viewer/IFCViewer';
import './App.css';

const App: FC = () => {
  return (
    <div className="app-container">
      <IFCViewer />
    </div>
  );
};

export default App;