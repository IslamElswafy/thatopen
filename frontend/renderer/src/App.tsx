import { FC, Fragment } from 'react';
import IFCViewer from './components/Viewer/IFCViewer';
import './App.css';

const App: FC = () => {
  return (
    <Fragment>
      <IFCViewer />
    </Fragment>
  );
};

export default App;