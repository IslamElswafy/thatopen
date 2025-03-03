import IFCViewer from './components/Viewer/IFCViewer';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <IFCViewer />
      </div>
    </ErrorBoundary>
  );
}

export default App;